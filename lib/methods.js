
//Declaring raquired modules for node.js
var expressSession = require('express-session');
var mongoUrl = 'mongodb://localhost:27017/docreview';
var MongoStore = require('connect-mongo')(expressSession);
var mongo = require('./mongo');


mongo.connect(mongoUrl, function(){
  console.log('Connected to mongo at: ' + mongoUrl);
  });

var self= {


// to check whether the user is looged in or not while giving access to confidential pages
requireUser:function (req, res, next){
  if (!req.user) {
    res.redirect('/not_allowed');
  } else {
    next();
  }
},

// This middleware checks if the user is logged in and sets req.user and res.locals.user appropriately if so.
 checkIfLoggedIn:function(req, res, next){
  if (req.session.username) {
    var coll = mongo.collection('users');
    coll.findOne({username: req.session.username}, function(err, user){
      if (user) {
        // set a 'user' property on req so that the 'requireUser' middleware can check if the user is logged in
        req.user = user;

        // Set a res.locals variable called 'user' so that it is available to every handlebars template.
        res.locals.user = user;
      }

      next();
    });
  } else {
    next();
  }
},

//function to create password salt
createSalt:function(){
  var crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
},

//Function to create password hash
createHash:function(string){
  var crypto = require('crypto');
  return crypto.createHash('sha256').update(string).digest('hex');
},

//Function to created a new user
createUser:function(firstname, lastname, username, password, password_confirmation, email, userrole, callback){
  var coll = mongo.collection('users');

  if (password !== password_confirmation) {
    var err = 'The passwords do not match';
    callback(err);
  } else {

    if(userrole=="reviewer")
    {
      var review_coll=mongo.collection("reviewer");
      var query1={username:username};
      var reviewObj = {
  	  username: username,
      queuecount:0,
      };

      // make sure this username does not exist already
      review_coll.findOne(query1, function(err, user){
        if (user) {
          err = 'The username you entered already exists';
          callback(err);
        } else {
          // create the new user
          review_coll.insert(reviewObj, function(err,user){
            callback(err,user);
          });
        }
      });
    }
    var query      = {username:username};
    var salt       = self.createSalt();
    var hashedPassword = self.createHash(password + salt);
    var userObject = {
	  firstname: firstname,
	  lastname: lastname,
      username: username,
	  email: email,
	  userrole: userrole,
      salt: salt,
      hashedPassword: hashedPassword,
    };



    // make sure this username does not exist already
    coll.findOne(query, function(err, user){
      if (user) {
        err = 'The username you entered already exists';
        callback(err);
      } else {
        // create the new user
        coll.insert(userObject, function(err,user){
          callback(err,user);
        });
      }
    });
  }
},

submitDoc:function(aname, aid, cid, email, callback){
  var coll = mongo.collection('doclist');
  var review_coll=mongo.collection("reviewer");
  var rev_name="na";
  var sum1,sum2=0;
  review_coll.find({}).toArray(function(err, reviewers){
    if(reviewers.length>0)
    rev_name=reviewers[0]['username'];
    for(var i=1;i<reviewers.length;i++)
    {
        sum1=reviewers[i]["queuecount"];
        sum2=reviewers[i-1]["queuecount"];
        if(sum1<sum2)
        rev_name=reviewers[i]['username'];
    }
    var query      = {aid:aid,cid:cid};
    var doc_details = {
	  aname: aname,
	  aid: aid,
      cid: cid,
	  email: email,
	  status: "Yet to review",
    reviewer: rev_name,
    };



    // make sure this username does not exist already
    coll.findOne(query, function(err, user){
      if (user) {
        coll.update(query,{$set:{status:"Yet to review"}},function(err,user){
          callback(err,user);
        });
        } else {
        // create the new user
        coll.insert(doc_details, function(err,user){
          callback(err,user);
        });
      }
    });
    review_coll.update({username:rev_name},{$inc:{queuecount:1}},function(err,user){
      callback(err,user);
    });
  });



},
submitscore:function(f11,f12,f13,f14,f15,f16,f17,f18,f19,f21,f22,f23,f24,f25,f31,f32,f33,f34,f35,f41,f42,f43,f44,f45,f46,f51,f52,f53,f54,f61,f62,f63,f64,f65,f71,f72,f73,f74,f81,f82,f83,f84,f85,c11,c12,c13,c14,c15,c16,c17,c18,c19,c21,c22,c23,c24,c25,c31,c32,c33,c34,c35,c41,c42,c43,c44,c45,c46,c51,c52,c53,c54,c61,c62,c63,c64,c65,c71,c72,c73,c74,c81,c82,c83,c84,c85,cid,username, callback){
  var coll = mongo.collection('scorecards');
  var review_coll=mongo.collection("reviewer");
  var doc_coll = mongo.collection('doclist');
    var query      = {cid:cid};
    var total= (f11+f12+f13+f14+f15+f16+f17+f18+f19+f21+f22+f23+f24+f25+f31+f32+f33+f34+f35+f41+f42+f43+f44+f45+f46+f51+f52+f53+f54+f61+f62+f63+f64+f65+f71+f72+f73+f74+f81+f82+f83+f84+f85);
    if(total>84)
    var result="Pass";
    else
      var result="Fail";

    var doc_details = {
    cid: cid,
    reviewer:username,
	  f1:f1,
    f2:f2,
    f3:f3,
    f4:f4,
    f5:f5,
    f6:f6,
    f7:f7,
    f8:f8,
    f9:f9,
    f10:f10,
    c1:c1,
    c2:c2,
    c3:c3,
    c4:c4,
    c5:c5,
    c6:c6,
    c7:c7,
    c8:c8,
    c9:c9,
    c10:c10,
    total:total,
    result:result,
    };





        coll.insert(doc_details, function(err,user){
          callback(err,user);
        });


    doc_coll.update(query,{$set:{status:"Review completed"}},function(err,user){
      callback(err,user);
    });

},



// This finds a user matching the username and password that were given.
authenticateUser:function(username, password, callback){
  var coll = mongo.collection('users');

  coll.findOne({username: username}, function(err, user){
    if (err) {
      return callback(err, null);
    }
    if (!user) {
      return callback(null, null);
    }
    var salt = user.salt;
    var hash = self.createHash(password + salt);
    if (hash === user.hashedPassword) {
      return callback(null, user);
    } else {
      return callback(null, null);
    }
  });
}


}
module.exports=self;
