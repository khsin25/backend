var mongoose = require('mongoose');
// var fs = require("fs");
//var ObjectId = mongoose.Schema.Types.ObjectId;
const PermissionSchema = new mongoose.Schema({
  rapiscan_tech:Object,
  rapiscan_manager: Object,
  customer:Object
})
const Permission = mongoose.model('Permission', PermissionSchema);

exports.PermissionSchema_prepopulate = async function(req,res){ //needs work
  var myPromise = new Promise((resolve, reject) => {

    Permission.count(function(err, count) {
      if (!err && count === 0) { //empty
        console.log("Permission DB is empty...");
      } else {
        console.log("Permission is already filled in the DB, no need to refill")
        resolve({error:"Permission is already filled in the DB, no need to refill"})
      }
    })
  })
  .then((x)=>{res.json(x)})
  .catch((y)=>{res.status(404).json(y)})
}

exports.get_Permission = async (req, res) => {
    Permission.find({}, {'_id': 0, '__v':0}, (err, doc)=>{
      if(err){ throw err; res.status(404).json({error:"not found"}) }
      if(doc){ res.status(200).json(doc[0]); }
    })
}

exports.get_user_permission = async(req,res)=>{
  Permission.find({}, req.user.role, {'_id': 0, '__v':0}, (err, doc)=>{
    if(err){ throw err; res.status(404).json({error:"not found"}) }
    if(doc){ res.status(200).json(doc[0]); }
  })
}

exports.check_permission = async(req, res, next)=>{
  Permission.find({}, req.user.role, {'_id': 0, '__v':0}, (err, doc)=>{
    if(err){ throw err; res.status(404).json({error:"not found"}) }
    if(doc){ res.status(200).json(doc[0]); }
  })
}

exports.listRoles = async(req,res)=>{
  var myPromise = new Promise((resolve,reject)=>{
    var myKeys
    Permission.findOne({}, {'_id': 0, '__v':0}, (err,doc)=>{
      if(err){reject(err)}
          console.log("doc: " + JSON.stringify(doc))
          myKeys = Object.keys(doc._doc);
          console.log("keys: "+JSON.stringify(myKeys))
          resolve(myKeys)
    })
  })
  .then((good)=>{res.json({status:"OK", data:good}) })
  .catch((err)=>{res.status(400).json({error:err}) })
}

exports.Permission_model = function() {
  return Permission
};
