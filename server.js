//Declaring raquired modules for node.js
var express = require('express');
var app = express();

var expressSession = require('express-session');
var expressHbs = require('express3-handlebars');
var mongoUrl = 'mongodb://localhost:27017/docreview';
var MongoStore = require('connect-mongo')(expressSession);
var mongo = require('./lib/mongo');

var methods = require('./lib/methods');


var port = 3333; // port number which we are using for node server


// Use this so we can get access to `req.body` in our posted forms.
app.use( require('body-parser')() );

// We need to use cookies for sessions, so use the cookie parser
app.use( require('cookie-parser')() );

app.use( expressSession({
  secret: 'somesecretrandomstring',
  store: new MongoStore({
    url: mongoUrl
  })
}));

// We must use this middleware _after_ the expressSession middleware,
// because checkIfLoggedIn checks the `req.session.username` value,
// which will not be available until after the session middleware runs.
app.use(methods.checkIfLoggedIn);


//set up of view engine
app.engine('html', expressHbs({extname:'html', defaultLayout:'main.html'}));
app.set('view engine', 'html');

//To get home page
app.get('/', function(req, res){

    res.render('index.html');
});

//To get login page
app.get('/login', function(req, res){
  res.render('login');
});

app.get('/updatescoringpoints', function(req, res){
  res.render('updatescoringpoints');
});

//To get logout page
app.get('/logout', function(req, res){
  delete req.session.username;
  res.redirect('/');
});

//To get a restriction notice page
app.get('/not_allowed', function(req, res){
  res.render('not_allowed');
});

app.get('/selectoption', function(req, res){
  res.render('selectoption');
});

//To get a Reviewer home page
app.get('/reviewer', function(req, res){
  username=req.session.username;
  var doc_Coll=mongo.collection('doclist');


  doc_Coll.find({status:{$ne:"Review completed"},reviewer:username}).toArray(function(err, doc_list){
    req.session.username = username;
  res.render('reviewer',{docs:doc_list});
});
});
app.get('/scoredoc', function(req, res){
  var coll=mongo.collection("standardschema");
  coll.find().toArray(function(err,standards)
{
  res.render('scoredoc',{standards:standards});
});

});

app.get('/changestatus', function(req, res){
  username=req.session.username;
  var doc_Coll=mongo.collection('doclist');


  doc_Coll.findOne({cid:req.session.cid},function(err, record){
    req.session.username = username;
  res.render('changestatus',{record:record});
});
});
// The secret url includes the requireUser middleware.
app.get('/secret', methods.requireUser, function(req, res){
  res.render('secret');
});

//To get signup page
app.get('/signup', function(req,res){
  res.render('signup');
});

app.get('/applicanthome',function(req,res){
  username=req.session.username;
  req.session.username = username;
  res.render('applicanthome');
}
);
app.get('/viewstatus',function(req,res){
  username=req.session.username;
  var doc_Coll=mongo.collection('doclist');


  doc_Coll.find({aid:req.session.username}).toArray(function(err, doc_list){
    req.session.username = username;
  res.render('viewstatus',{docs:doc_list});
});
}
);

app.get('/admin',function(req,res){
  username=req.session.username;
  var doc_Coll=mongo.collection('doclist');


  doc_Coll.find().toArray(function(err, doc_list){
    req.session.username = username;
  res.render('admin',{docs:doc_list});
});
}
);

//To get default user screen
app.get('/userscreen', function(req,res){
username=req.session.username;
req.session.username = username;
    res.render('userscreen');

});

app.get('/submitted', function(req, res){
  username=req.session.username;
  var coll_score=mongo.collection("scorecards");
  coll_score.find({cid:req.session.cid}).toArray(function(err, scores){
    req.session.username = username;
  res.render('submitted',{scores:scores});
});

});

//To Submit a document for review
app.post('/submitdoc',function(req,res)
{
  username=req.session.username;
  var aname=req.body.aname;
  var aid=req.session.username;
  var cid=req.body.cid;
  var email=req.body.email;
  methods.submitDoc(aname, aid,cid, email, function(err, user){
    if (err) {
      res.render('userscreen', {error: err});
    } else {

      // This way subsequent requests will know the user is logged in.
      req.session.username = username;

      res.redirect('/applicanthome');
    }
  });
});
//To Submit a document for review
app.post('/scoredoc',function(req,res)
{
  username=req.session.username;
  var cid=req.body.selected;
  req.session.cid=cid;
      // This way subsequent requests will know the user is logged in.
      req.session.username = username;

      res.redirect('/selectoption');

});
app.post('/inputstandard',function(req,res)
{
  username=req.session.username;
  var standardtype=req.body.standardtype;
  var standardnum=req.body.standardnum;
  var standardname=req.body.standard;
  var maxpoints=req.body.maxpoints;

  coll=mongo.collection('standardschema');
  var standardObject={
    standardtype:standardtype,
    standard:[{
      standardnum:standardnum,
      standardname:standardname,
      maxpoints:maxpoints
    }]
  }
var query={standardtype:standardtype};
  coll.findOne(query, function(err, doc){
      if (doc) {
        coll.update(query,{$push:{standard:{standardnum:standardnum,standardname:standardname,maxpoints:maxpoints}}}, function(err,user){
        });
      } else {
        coll.insert(standardObject, function(err,user){});
      }
    });
      // This way subsequent requests will know the user is logged in.
      req.session.username = username;

      res.render('updatescoringpoints',{done:"yes"});

});
app.post('/changestatus',function(req,res)
{
  username=req.session.username;
  var status=req.body.status;
  var coll=mongo.collection("doclist");
  if(status=="inreview")
  coll.update({cid:req.session.cid},{$set:{status:"In Review"}},function(err,user){});
      req.session.username = username;

      res.redirect('/reviewer');

});

app.post('/viewscore',function(req,res){
  username=req.session.username;
  var cid=req.body.courseid;
  var score_coll=mongo.collection("scorecards");

  score_coll.find({cid:cid}).toArray(function(err,scores){

    req.session.username = username;

    res.render('viewscore',{scores:scores});


  });


});


app.post('/submitscore',function(req,res)
{
  username=req.session.username;
  var coll=mongo.collection("standardschema");
  coll.find().toArray(function(err,fields){
  /*var scores[][];
  var comments[][]
    for(var i=0;i<fields.length;i++)
    for(var j=0;j<fields[i]['standard'].length;j++)
    {
     scores[i][j]=req.body."s"+fields[i]['standard'][j]['standardnum'];
     comments[i][j]=req.body."c"+fields[i]['standard'][j]['standardnum'];
    }
      console.log(scores);
      console.log(comments);
*/

          req.session.username = username;
          res.redirect('/submitted');
  });
    /*var f11 = parseInt(req.body.s11);
    var c85 = req.body.c85;

    cid=req.session.cid;
    methods.submitscore(f11,c85,cid,username, function(err, user){
      if (err) {
        res.render('scoredoc', {error: err});
      } else {

        // This way subsequent requests will know the user is logged in.
        req.session.username = user.username;
        res.redirect('/submitted');
      }
    });*/

});

//To get the data from signup form
app.post('/signup', function(req, res){
  // The variables below all come from the form in views/signup.html
   var firstname = req.body.firstname;
    var lastname = req.body.lastname;
  var username = req.body.username;
  var password = req.body.password;
  var password_confirmation = req.body.password_confirmation;
  var email = req.body.email;
   var userrole = req.body.userrole;

  methods.createUser(firstname, lastname,username, password, password_confirmation, email, userrole, function(err, user){
    if (err) {
      res.render('signup', {error: err});
    } else {

      // This way subsequent requests will know the user is logged in.
      req.session.username = user.username;

      res.redirect('/');
    }
  });
});



app.post('/login', function(req, res){
  // These two variables come from the form on
  // the views/login.hbs page
  var username = req.body.username;
  var password = req.body.password;

  methods.authenticateUser(username, password, function(err, user){
    if(user)
    {
      if(user.userrole==='admin')
	     {
		// This way subsequent requests will know the user is logged in.
          req.session.username = user.username;

            res.redirect('/admin');
	         }
	          else if(user.userrole==='student'){
              // This way subsequent requests will know the user is logged in.
              req.session.username = user.username;

              res.redirect('/applicanthome');
    }
    else {
      req.session.username = user.username;

      res.redirect('/reviewer');
    }
  }
   else {
      res.render('login', {badCredentials: true});
    }
  });
});

app.use('/public', express.static('public'));

mongo.connect(mongoUrl, function(){
  console.log('Connected to mongo at: ' + mongoUrl);
  app.listen(port, function(){
    console.log('Server is listening on port: '+port);
  });
})
