var mongoose = require('mongoose');
// var fs = require("fs");
var ObjectId = mongoose.Schema.Types.ObjectId;
// const assert = require("assert");
// var check = require('../passport/middleware.js').hasPermission
var User = require('./user.js').User_model()
// var UserSchema = require('./user.js').User_schema()
const ApprovalQueueSchema = new mongoose.Schema({
  approved: {type:Boolean, default:false},
  denied: {type:Boolean, default: false},
  deniedBy: {type:String},
  deniedOn: {type:Date},
  userId: {type: ObjectId, ref: 'user'},
  approveeFirstName: {type:String, required:true},
  approveeLastName: {type:String, required:true},
  approveeEmail: {type:String, required:true},
  requestedRole: {type:String, required:true},
  requestedDate: {type:Date, default:Date.now, index:true},
  approvedDate: {type:Date}, //add phone number, company name, country
  approver: {type:String},
  phone: {type: String},
  companyName: {type:String},
  country: {type:String},
})
const ApprovalQueue = mongoose.model('ApprovalQueue', ApprovalQueueSchema);


exports.rapiscanEmployee = async(req,res)=>{
  return new Promise(async(resolve,reject)=>{
    if(req.body){
      if(!req.body.user){
        await saveUser(req.body) //save to user db
          .then((user)=>{
            newDist = new ApprovalQueue(transformUser(req.body))
            console.log(JSON.stringify(user))
            newDist.userId = user.user._id
            newDist.save() //save to approvalqueue db
              .then((good)=>{res.json( {success:"Your Rapiscan Employee: " +req.body.role+ ", request has been added to the queue. Please await admin approval"} )})
              .catch((err)=>{res.json( {error:"Unable to fill your Rapiscan Employee request... "+err} )})
          })
          .catch((err)=>{res.json( {error:"Unable to save user... "+JSON.stringify(err)} )})
      }
    }
  })
}


exports.listRapiscanRequests = async(req,res)=>{
  var myPromise = new Promise((resolve,reject)=>{
    console.log("before checking if rapiscan manager")
    if(req.user && req.user.role == "rapiscan_manager")
    {
      console.log("before finding approvalqueue")
      ApprovalQueue.find({approved:false, denied: false}, {'__v':0})
        .sort({requestedDate: 'asc'})
        .exec((err,doc)=>{
          if(err){console.log("ERROR! in finding approvalqueue: "+ err); reject(err)}
          console.log("doc: "+doc)
          if(!doc){reject({error:"no document"})}
          if(doc && doc[0]){resolve({status:"OK", data:doc })}
          if(doc && !doc[0]){resolve({status:"OK", data:doc })}
        })
    }
    else{ reject({error:"You do not have permission to access this page!"}) }
  })
  .then((good)=>{res.json(good)})
  .catch((err)=>{res.status(400).json(err)})
}



exports.approveUser = function(req,res){
  console.log("in approve user")
  var myPromise = new Promise((resolve,reject)=>{
    if(req.user && req.params && req.params.approvalId){
      console.log("about to find approvalqueue")
      console.log(req.params.approvalId)
      ApprovalQueue.findById(req.params.approvalId, (err,doc)=>{
        if(err){reject(err)}
        console.log("found approvalqueue")
        doc.approved = true
        doc.approvedDate = Date.now()
        doc.approver = req.user.email
        doc.save()
        console.log(doc)
        User.findById(doc.userId, (err1,doc1)=>{
          if(err){reject({error:err1})}
          console.log("finding userschema")
          console.log(doc1)
          doc1.approved = true
          doc1.active = true
          doc1.save()
            .then(async()=>{
              if(doc1.distributor){ //if the user is requesing the distributor position
                await distributor.injectDistributor(req,res) //create a new distributor object (after you check it of course.)
                  .then((doc1)=>{
                    console.log("successfully approved user and added to distributor db")
                    resolve(doc1)
                  })
                  .catch((bad)=>{
                    reject({error:bad})
                  })
              }
            })
            .catch((err)=>{reject(err)})
        })
      })
    } 
    else{
      reject("Make sure you have approvelId as a param and you must also be logged in")
    }
  })
  .then((user)=>{res.json({status:"User approved!"})})
  .catch((err)=>{res.json({error:err})})
}


exports.denyUser = function(req,res){
  console.log("in deny user")
  var myPromise = new Promise((resolve,reject)=>{
    if(req.user && req.params && req.params.approvalId){
      console.log("about to find approvalqueue")
      console.log(req.params.approvalId)
      ApprovalQueue.findById(req.params.approvalId, (err,doc)=>{ //change this to modify Deleted boolean & deleteOn
        if(err){reject(err)}
        doc.denied = true;
        doc.deniedBy = req.user.email
        doc.deniedOn = Date.now()
        console.log(doc)
        User.findByIdAndDelete(doc.userId, (err1,doc1)=>{
          if(err){reject(err1)}
          console.log("deleting user")
          console.log(doc1)
          resolve(doc1) //return the document (it should be null/empty)
        })
      })
    }
    else{
      res.send({error:"Make sure you have approvelId as a param and you must also be logged in"})
    }
  })
  .then((user)=>{res.json({status:"User " + user.firstName +" deleted!"})})
  .catch((err)=>{res.json({error:err})})
}

exports.countUnapprovedRapiscan = function(req,res){
  var myPromise = new Promise((resolve,reject)=>{
    ApprovalQueue.countDocuments({ approved: false, denied: false }, function (err, count) { //todo: distributor:false
      if(err){reject({err})}
      resolve(count)
    });
  })
  .then((count)=>{res.send({status:"OK", count:count})})
  .catch((err)=>{res.send({error:err})})
}

saveUser = function(user){
  return new Promise((resolve,reject)=>{
    myUser = new User(user)
    myUser.save()
      .then((good)=>{console.log("added new user! "+ good);resolve({status:"OK", user:good})})
      .catch((bad)=>{console.log("could not add new user ... "+bad);reject({error:bad})})
  })
}

transformUser = function(user){
  var approval = Object.assign({},user)
  approval.approveeEmail = user.email
  approval.approveeFirstName = user.firstName
  approval.approveeLastName = user.lastName
  approval.requestedRole = user.role
  approval.email = approval.firstName = approval.lastName = approval.role = undefined
  return approval
}

exports.ApprovalQueue_model = function() {
  return ApprovalQueue
};
