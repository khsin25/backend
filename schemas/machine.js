var mongoose = require('mongoose');
// var fs = require("fs");
// var ObjectId = mongoose.Schema.Types.ObjectId;
var checkParts = require('./templates.js').get_template_parts
var check = require('../passport/middleware.js').hasPermission
const MachineSchema = new mongoose.Schema({ //TODO: add a partReplacement reference array! [{ObjectID}]
  sn: {type: String, required: true, unique: true},       //TODO: add a partReplacement Schema {replacedPart (Part), newPart (Part), reason, date, replacedBy}
  barcode: {type: String, required: true, unique:true}, //TODO: enforce this to be UNIQUE!!!!
  customer: String,
  registerDate: Date,
  operationalHours: {type:Number, required:true}, //NEW requirement. 4/10/19
  installLocation: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'] // 'location.type' must be 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  installAddress: String,
  model: {type: String, required: true}
});
const Machine = mongoose.model('Machine', MachineSchema);

Machine.collection.createIndex({
  location: '2dsphere'
});
Machine.collection.ensureIndex({
  loc: '2dsphere'
});
MachineSchema.index({
  location: '2dsphere'
});

//APAC
//CONUS
//LATM

//populate

exports.test = function() {
  console.log("test complete")
}

var postMachine = async (req,res) => { //needs removal of part objects, replacement with part ID objects and looped/bulk insertion into the part db
  var myPromise = new Promise((resolve,reject)=>{

    if(req.body){
      if(req.body.machine.sn && req.body.machine.barcode){ //just a little bit of verification
        try{
          myMachine = new Machine(req.body.machine)
          console.log(myMachine)
          myMachine.installer = req.user.email
          var valerror = myMachine.validateSync()
          if(valerror){
            reject({error:"could not cast to Machine.... do you have all the required fields?", mongoerror:valerror})
          }

          myMachine.save()
          .then((result)=>{
            console.log("good: "+ result)
            resolve({status:"success", data:result})
          })
          .catch((error)=>{
            var dupType = ""
            console.log("error: "+ error)
            console.log(JSON.stringify(error, null, 2))
            dupType = error.errmsg.split('dup key: ')[1].split('\"')[1]
            if(error.code == 11000) //duplicate
            {
              res.status(409); reject({error:dupType +" already exists in database", mongoerror:error})
            }
            else{
              res.status(400); reject({error:"could not cast to Machine.... do you have all the required fields?", mongoerror:error})
            }
          })
        }catch(error){
          console.log("could not cast to Machine.... do you have all the required fields? caught: "+ error)
          res.status(400); reject({error:"could not cast to Machine.... do you have all the required fields?", caught: error})
        }
      }else{res.status(400); reject({error:"no serial number or barcode"})}
    }else{res.status(400); reject({error:"no body"})}

  })
  return myPromise;
}

exports.postMachine = postMachine;

exports.saveMachine = async(req,res) => { //PERMISSIONS GOOD
  if(req.user && check("add_new_machine", req.user.permissions))
  {
    console.log("You have permission!")
  }
  else{res.status(401).json({error:"You do not have permission to access this page!"})}
}

exports.checkThenSaveMachine = async(req,res) => { //PERMISSIONS GOOD
  if(req.user && check("add_new_machine", req.user.permissions)){
    await checkParts(req,res)
      .then(async(val)=>{
        await postmachine(req,res)
        .then((val1)=>{res.status(200).json(val1)})
        .catch((val1)=>{console.log("save rejected: "+val1);res.status(400).json(val1)})
      })
      .catch((val)=>{console.log("check rejected: "+val);res.status(400).json(val)})
  }else{res.status(401).json({error:"You do not have permission to access this page!"})}
}

exports.findMachine = async(req,res)=>{
  var myPromise = new Promise((resolve,reject)=>{
      Machine.findOne({barcode:req.body.barcode}, (err,doc)=>{
        if(err){reject({error:err})}
        if(doc){res.status(200); resolve(doc) }
        else{res.status(404); reject({error:"Machine not found!"})}
      })
  })
  return myPromise
}

exports.findMachineSerialParam = async(req,res)=>{
  var myPromise = new Promise((resolve,reject)=>{
      Machine.findOne({sn:req.params.serial}, (err,doc)=>{
        if(err){reject({error:err})}
        if(doc){res.status(200); resolve(doc) }
        else{res.status(404); reject({error:"Machine with serial number "+ req.params.serial + " not found!" })}
      })
  })
  return myPromise
}

exports.reportOneMachineUniversal = async(req,res)=>{
  var myPromise = new Promise((resolve,reject)=>{
    var ser = {sn:req.params.serial}
    var bar = {barcode:req.params.barcode}
    var query;
      if(req.params.serial) { query = ser }
      else{query = bar}
    Machine.findOne(query)
      .populate('parts')
      .exec((err,doc)=>{
        if(err){reject({error:err})}
        if(doc){res.status(200); resolve(doc) }
        else{res.status(404); reject({error:"Machine not found!"})}
      })
  })
  .then((val)=>{res.status(200).json(val)})
  .catch((val)=>{console.log("rejected: "+val);res.json(val)})
}

exports.Machine_model = function() {
  return Machine
};
