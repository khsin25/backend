//libraries
const express = require('express')
// const app = express();
const routes = require('express').Router();
// var path = require('path');
var bodyParser = require('body-parser')
// var fs = require('fs')
// var fsPromises = require('fs').promises
var passport = require('passport');
// var LocalStrategy = require('passport-local').Strategy;
// var cookieparser = require('cookie-parser')
var session = require('express-session')
var passWare = require('../passport/middleware.js')

//schemas
var machine_s = require('../schemas/machine.js');
var actionTree_s = require('../schemas/actionTree.js');
var user_s = require('../schemas/user.js');
var permission_s = require('../schemas/permissions.js');
var approvalQueue_s = require('../schemas/approvalQueue.js');
var reporting_s = require('../schemas/reporting.js')
User = user_s.User_model();
var template_s = require('../schemas/templates.js');

//middleware
routes.use(require('cookie-parser')());
routes.use(require('body-parser').urlencoded({
  extended: true
}));
routes.use(session({
    secret: 'tomato paste parm marge simpson valley horse rockstar coffee barack hussein obama florida gargantuan',
    cookie: {maxAge: 10 * 60 * 1000}, //10 minutes},
    resave: true,
    rolling:true,
    saveUninitialized: false
  }));
routes.use(passport.initialize());
routes.use(passport.session());
routes.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
//middleware
routes.use(bodyParser.json());
routes.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//test
routes.get('/testRoute', (req,res)=>{
  res.json({success:"ok"})
})
//fill the permissions DB
routes.get('/v1/fill/permission', permission_s.PermissionSchema_prepopulate)

//routes.get('/test/:modelslug', template_s.get_template_parts)
routes.get('/v1/actionTree', passWare.isVetted, actionTree_s.get_ActionTree)
routes.get('/v1/machine/:barcode', passWare.isVetted, machine_s.reportOneMachineUniversal) //use this to check if machine exists in (warrantyInstall) module
routes.post('/v1/singleMachine', passWare.isVetted, machine_s.saveMachine) //PERMISSION DONE!
routes.post('/v1/checkAndSaveMachine', passWare.isVetted, machine_s.checkThenSaveMachine)

// routes.get('v1/report/warranty/fleet/:distributor')
routes.get('/v1/report/machine/one/serial/:serial', passWare.isVetted, passWare.loggedIn, machine_s.reportOneMachineUniversal) //report single machine
routes.get('/v1/report/machine/one/barcode/:barcode', passWare.isVetted, passWare.loggedIn, machine_s.reportOneMachineUniversal) //report single machine


//authentication
routes.post('/v1/login',
  passport.authenticate('local'),
  (req,res)=> {
    if(req.user){
      res.json({success:"logged in successfully!"});
    }
    else{
      res.json({error:"unable to log in"})
    }
  }
);
routes.get('/v1/logout', function(req, res) {
  if(req.user){
    console.log(req.user + " has logged out!")
    req.logout();
    res.json({success:"logged out successfully!"})
  }else{
    console.log("user is not logged in!")
    res.json({success:"You were not logged in anyways"})
  }
});
routes.post('/v1/register', (req, res) => { //deprecate this. use queue routes
  var temp = new User({
    email: req.body.email,
    password: req.body.password
  })
  temp.save()
  .then((doc) => { res.json({status:"Registered!"})  })
  .catch((err)=>{ res.json({error:"Unable to register!", mongoErr: err}) })
})
routes.get('/v1/test/auth',  passWare.loggedIn, (req,res)=>{res.json({success:"logged in!"})}) //good
routes.get('/v1/refreshSession', passWare.loggedIn, passWare.refreshSession) //good

//authorization
routes.get('/v1/ACL', permission_s.get_Permission)
routes.get('/v1/ACL/user', passWare.isVetted, passWare.loggedIn, permission_s.get_user_permission)
routes.get('/v1/user', user_s.getUserInfo)
// routes.get('v1/ACL/:user/:permission') //returns boolean -- THIS IS a route for front end user validation

//approvalQueue
routes.post('/v1/queue/rapiscanEmployee', approvalQueue_s.rapiscanEmployee) //use this to submit a rapiscanEmployee on (Register)
routes.get('/v1/roles/list', permission_s.listRoles) //user this to get the list of roles in (Register: rapiscanEmployee)
routes.get('/v1/queue/rapiscan_manager', passWare.isVetted, approvalQueue_s.listRapiscanRequests) //use this to get the list of pending rapiscan user requests as a rapiscan manager
routes.post('/v1/queue/approve/:approvalId', passWare.isVetted, passWare.loggedIn, passWare.isManager, approvalQueue_s.approveUser) //made this a POST because we would need some extra info for distributors in the req.body
routes.get('/v1/queue/deny/:approvalId', passWare.isVetted, passWare.loggedIn, passWare.isManager, approvalQueue_s.denyUser)
routes.get('/v1/queue/count/rapiscan', passWare.isVetted, passWare.loggedIn, passWare.isManager, approvalQueue_s.countUnapprovedRapiscan)



//test functions
routes.get('/v1/checkPage', (req,res)=>{console.log(passWare.hasPermission("system_install", req.user.permissions)); res.json({hi:"hi"})})


//GODMODE ROUTES
routes.get('/v1/godmode/all-users', user_s.getAllUserInfo) //Get All Users
//'/v1/ACL' Get Access Control List does not need an API key. just call it.
routes.post('/v1/godmode/modifyUser/:id', user_s.modifyUser)


//TODO: POST routes for lead_service distributors and rapiscan managers whether they approve or deny requests
//approving requests should add the user to the database

module.exports = routes;
