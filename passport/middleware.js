var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
// var cookieparser = require('cookie-parser')
// var session = require('express-session')
var userSchema = require('../schemas/user.js')
var permissionSchema = require('../schemas/permissions.js')
User = userSchema.User_model();
Permission = permissionSchema.Permission_model();

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
    console.log("verifying...")
    User.findOne({
      email: email
    }, function(err, user) {
      if (err) {
        console.log(err);
        return done(err);
      }
      if (!user) {
        console.log("no such user")
        return done(null, false, {
          message: 'Incorrect email.'
        });
      }
      console.log("USER!!!!!!!!!: "+user)
      //check password here
      userSchema.comparePassword(password, user.password, function(err, isMatch) {
        if (err) {
          return done(err);
        }
        if (!isMatch) {
          return done(null, false, {
            message: 'Login failed. Please try again.'
          });
        }
        //Check if they are vetted HERE
        if(isVettedUser(user))
        {
          return done(null, user);
        }
        else{
          return done(null, false, {
            message: 'You are not a vetted user'
          });
        }

      });
    });
  }
));

passport.serializeUser(function(user, done) {
  console.log("serializing...")
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  console.log("deserializing...")
  User.findById(id, async function(err, user) {
    await getPermission(user.role)
      .then((val)=>{
        user.permissions = val[user.role]
        done(err,user)
      })
      .catch((err1)=>{
        done(err1,user)
      })
  });
});

isVettedUser = function(user){
  if(user.active && user.approved){
    return true
  }
  else{
    return false
  }
}

getPermission = function(role){
  return new Promise((resolve,reject)=>{
    Permission.find({}, role, {'_id': 0, '__v':0}, (err, doc)=>{
      if(err){ throw err; reject(null) }
      if(doc){ resolve(doc[0]) }
    })
  })
}

exports.requireAdmin = function() {
  return function(req, res, next) {
    var good = true
    User.findOne({
      email: req.body.email
    }, function(err, user) {
      if (err) {
        res.status(401).json({
          error: err
        });
      }
      if (!user) {
        console.log(req.body.email + " does not exist")
        good = false
        res.status(401).json({
          error: 'You are not authorized to view this content'
        });
      }
      if (!user.admin) {
        console.log(req.body.email + " is not an admin")
        good = false
        res.status(401).json({
          error: 'You are not authorized to view this content'
        });
      }
      if (good) {
        next();
      }
    });
  }
}

exports.loggedIn = function(req, res, next) { //deprecated. use isVetted
  if (req) {
    if (req.user) {
      console.log(req.user)
      next();
    } else {
      //res.redirect('/login');
      res.status(401).json({failed:"you have not logged in!"})
    }
  }
}

exports.loggedInAsAdmin = function(req, res, next) {
  if (req) {
    if (req.user) {
      if (req.user.admin) {
        next();
      } else {
        res.status(401).json({
          error: 'You are not authorized to view this content'
        });
      }
    } else {
      res.status(401).json({
        error: 'You are not authorized to view this content'
      });
    }
  } else {
    res.status(401).json({
      error: 'You are not authorized to view this content'
    });
  }
}

exports.refreshSession = function(req,res){
  if(req.session){
    req.session.touch()
    console.log("Session refreshed by user: " + req.user.email + " & new MaxAge is: " + req.session.cookie.maxAge)
    console.log("Permissions are: "+ JSON.stringify(req.user.permissions))
    res.json({refreshed:true})
  }
  else{
    res.json({refreshed:false})
  }
}

exports.hasPermission = function(page, permissions){
  if(permissions){
    if(permissions[page] == 1){
      console.log(page+ " is Allowed!")
      return true
    }
    else{
      console.log("You are not allowed to access "+ page + "!")
      return false
    }
  }
  else{return false}

}

exports.isVetted = function(req, res, next){
  if(req.user){
    if(req.user.active && req.user.approved){
      next()
    }
    else{
      res.status(401).json({error:"You are not approved to access this page!"})
    }
  }
  else{
    req.status(401).json({error:"You are not authorized to access this page or you may have been logged out!"})
  }

}

exports.isManager = function(req,res,next){
  if(req.user && req.user.role)
  {
    console.log(req.user.role)
    if(req.user.role == "rapiscan_manager")
    {
      console.log("good")
      next()
    }
    else{
      console.log("bad")
      res.json({error:"You are not authorized to access this page!!"})
    }
  }
  else{
    res.json({error:"You are not authorized to access this page!"})
  }
}