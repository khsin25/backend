var mongoose = require('mongoose');
// var fs = require("fs");
var bcrypt = require('bcrypt');
// var ObjectId = mongoose.Schema.Types.ObjectId;
const User_Schema = new mongoose.Schema({ //add phone number, company name, country
  firstName: {type:String},
  lastName: {type:String},
  approved: {type:Boolean, default:false},
  active: {type:Boolean, default:false},
  email: { type: String, required: true, index: { unique: true }},
  phone: {type: String},
  companyName: {type:String},
  country: {type:String},
  password: { type: String, required: true },
  role: String, //important for permissions
  admin: Boolean,
  lockUntil: Number //10 * 60 * 1000 10 minutes
});
User_Schema.pre('save', function(next) {
  console.log("pre-saving password...")
  var User = this;
  var SALT_FACTOR = 5;

  if (!User.isModified('password')) {
    return next();
  }

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    console.log("password is salting...")
    console.log(salt)
    if (err) {
      console.log("err: "+ err)
      return next(err);
    }

    bcrypt.hash(User.password, salt, function(err, hash) {
      if (err) {
        console.log("err: "+ err)
        return next(err);
      }
      console.log("salted password is saving...")
      User.password = hash;
      next();
    });
  });
});

const User = mongoose.model('User', User_Schema);



exports.comparePassword = function(enteredPassword, hashedPassword, next) {
  console.log("enteredPassword: "+ enteredPassword)
  console.log("hashedPassword "+ hashedPassword)
  bcrypt.compare(enteredPassword, hashedPassword, function(err, isMatch) {
    console.log("comparing passwords...")
    if (err) {
      return next(err);
    } else {
      next(null, isMatch);
    }
  });
}

exports.getUserInfo = async(req,res)=>{
  var myPromise = new Promise((resolve,reject)=>{
    if(req.user){
      User.findOne({email:req.user.email}, {'password':0, '_id': 0, '__v':0}, (err,doc)=> {
        if(err){reject({error:err})}
        if(!doc){reject({error:"No such user exists!"})}
        if(doc){resolve(doc)}
      })
    }
  })
  .then((good)=>{res.json({user:good})})
  .catch((err)=>{res.status(400).json(err)})
}

exports.getAllUserInfo = async(req,res)=>{
  var key = "924672AAE4A3FB2DD01ABB46D18555325C468AE2247B7876F79409484E4165B4"
  var myPromise = new Promise((resolve,reject)=>{
    if(req.query.key == key){
      User.find({}, {'password':0, '_id': 0, '__v':0}, (err,doc)=> {
        if(err){reject({error:err})}
        if(doc){resolve(doc)}
      })
    }
    else{reject({error:"Wrong API key"})}
  })
  .then((good)=>{res.json({users:good})})
  .catch((err)=>{res.status(400).json(err)})
}


exports.modifyUser = async(req,res)=>{
  var myPromise = new Promise((resolve,reject)=>{
    if(req.params.id && req.query.key == "8D11ADDA158A81038CF12BB74226C6DD23052ACBE197966E3E58469EFA0B7906"){
      User.findOne({_id:req.params.id}, (err,doc)=>{
        if(err){reject(err)}
        if(doc){
          Object.assign(doc, req.body)
          //doc = req.body
          doc.save()
            .then((good)=>{resolve({status:"OK", data:good})})
            .catch((bad)=>{reject({error:bad})})
        }
        if(!doc){reject({error:"There is no user with that user id"})}
      })
    }else{
      reject({error:"No ID in params or KEY is invalid"})
    }
  })
  .then((good)=>{res.json(good)})
  .catch((bad)=>{res.json(bad)})
}

exports.User_model = function() {
  return User
};
exports.User_schema = function(){
  return User_Schema
}
