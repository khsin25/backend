var mongoose = require('mongoose');
var slug = require('slug')
var fs = require("fs");
// var path = require('path');
//var ObjectId = mongoose.Schema.Types.ObjectId;
const TemplateSchema = new mongoose.Schema({
  model: String, //not required
  modelslug:String,
  parts:[{
    pn: String,
    description: String,
    weight: Number, //grams
    dimensions: {
      height: Number,
      width: Number,
      length: Number
    },
    rev: Number
  }]
})
const Template = mongoose.model('Template', TemplateSchema);

exports.prepopulate_all = function() {
  var myPromise = new Promise((resolve, reject) => {
    //Why the heck does it resolve so quick??
    let resolveCount = 0;
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //listing all files using forEach
        files.forEach( function (file) {
          Template.count(function(err, count) {
            if (!err && count < files.length) { //empty
              console.log(file + " is empty...");
              fs.readFile(directoryPath + '/' + file, 'utf8', function(err, data) {
                if (err) throw err;
                if(data){
                  let json
                  try {
                    json = JSON.parse(data)
                    console.log("successfully parsed " + file + " JSON!");
                  } catch(err) {
                    console.log("Major problem with " + file + ". Is it valid JSON?")
                    console.log(err)
                    return;
                  };
                  //console.log(file +" JSON: " + JSON.stringify(json));
                  let template = new Template(json);
                  //Check to see if this template already exists in the DB!!!
                  if (!template.model) {
                    return
                  }
                  Template.find({modelslug:slug(template.model)},(err, doc) => {
                    if (doc.length > 0) {
                      console.log(file + ' template already exists, skipping!')
                      return
                    }
                    if (err) {
                      console.log(file + ' had some kind of error: ' + err)
                      return
                    }
                    //console.log('doc = ' + doc)
                    console.log(template)
                    template.modelslug = slug(template.model);
                    //console.log("DOC..." + json);

                    template.save(function(err, doc) {
                      if (err) {
                        console.log(err);
                        reject(err);
                      } else {
                        console.log("successfully saved " + file + " into DB!")
                        //resolve(1)
                        resolveCount += 1
                        console.log('inside resolveCount = ' + resolveCount)
                      }
                    })
                  })
                }
                else{ //no data
                  console.log("No Data in " + file)
                  //resolve(0)
                }
              })
            } else {
              console.log(file + " is already filled in the DB, no need to refill")
              //resolve(0)
            }

          })
          console.log(file);
        });
        console.log('????resolveCount = ' + resolveCount)
        resolve(resolveCount)
    });

  })

  return myPromise

}


exports.template_920CT_prepopulate = async function(){ //needs work
  var myPromise = new Promise((resolve, reject) => {

    Template.count(function(err, count) {
      if (!err && count === 0) { //empty
        console.log("920CT is empty...");
      } else {
        console.log("920CT is already filled in the DB, no need to refill")
        resolve(0)
      }
    })
  })
  return myPromise
}
exports.get_template_parts0 = async (req, res) => {
  Template.find({modelslug:req.params.modelslug},"parts.nonexistant", (err, doc) => {
     if(err){ throw err; res.status(404).json({error:"not found"}) }
     if(doc[0].parts){
       var count = doc[0].parts.length
       console.log("count: " +count)
       res.status(200).json(count);
     }
     else{ res.status(404).json({error:"no template parts"}) }
   })
}

exports.get_template_parts = async (req, res) => { //count template parts and check to see if they  match the parts that were sent along with the machine
  var myPromise = new Promise((resolve, reject) => {
    if(req.body.machine.model && req.body.machine.parts)
    {
      Template.aggregate([
      { $match : { modelslug: req.body.machine.model } },
      { $project: {"partsSize": { "$size": "$parts" } } }
    ], (err, doc) => {
         if(err){ throw err; res.status(404).json({error:"not found"}) }
         if(doc[0] && doc[0].partsSize){
           if(doc[0].partsSize == req.body.machine.parts.length)
           {
             resolve({dbPartSize: doc[0].partsSize,
                      reqPartSize: req.body.machine.parts.length,
                      equal:true});
           }
           else{
             resolve({dbPartSize: doc[0].partsSize,
                      reqPartSize: req.body.machine.parts.length,
                      equal:false});
           }
         }
         else{ reject({error:"no template parts"}) }
       })
     }
    else{
      reject({error:"no model or parts in body"})
    }
    })
 return myPromise
}

exports.get_aTemplate = async (req, res) => {
   Template.find({modelslug:req.params.modelslug},{'_id': 0, '__v':0}, (err, doc)=>{
      if(err){ throw err; res.status(404).json({error:"not found"}) }
      if(doc[0]){ console.log("good template request. here's a cookie: "+ JSON.stringify(doc[0])); res.status(200).json(doc[0]); }
      else{ console.log("bad template request, here's a dookie: "+ JSON.stringify(doc)); res.status(404).json({error:"empty templates database"}) }
    })
}

exports.get_bareModels = async (req, res) => {
    Template.find({},"model modelslug", (err, doc)=>{
      if(err){ throw err; res.status(404).json({error:"not found"}) }
      if(doc){ res.status(200).json(doc); }
      else{ res.status(404).json({error:"empty templates database"}) }
    })
}

exports.get_fullTemplate = async (req, res) => {
    Template.find({}, (err, doc)=>{
      if(err){ throw err; res.status(404).json({error:"not found"}) }
      if(doc){ res.status(200).json(doc); }
      else{ res.status(404).json({error:"empty templates database"}) }
    })
}

exports.Template_model = function() {
  return Template
};
exports.Template_schema = function() {
  return TemplateSchema
};
