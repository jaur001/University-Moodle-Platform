var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
var http = require ("http");
var url = require ("url");
var fs = require ("fs");

var db;
var username;
var password;


MongoClient.connect('mongodb://jaur001:jualbur001@ds259463.mlab.com:59463/school-database',{ useNewUrlParser: true },(err,client)=>{
  if (err) return console.log(err);
  db = client.db('school-database');
  app.listen(3000, () => {
    console.log('Database ready');
  });
});
var THistory = 0;
var TMaths = 0;
var TInformatics = 0;
var TEnglish = 0;
var logged = 0;
var registered;



app.use(bodyParser.urlencoded({extended: true}));
console.log("The server was started on port 3000");
console.log("To end the server, press 'CTRL + C'");



app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');
app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/home.html'));
});

app.get('/register',function(req,res){
  res.sendFile(path.join(__dirname+'/register.html'));
});

app.get('/register/students', (req, res) => {
  db.collection('users').find({"Type":"0"}).toArray(function(err, result) {
    if (err) return console.log(err);
    res.render('registerStudents.ejs',{users:result});
  });
});

app.get('/register/teachers', (req, res) => {
  db.collection('users').find({"Type":"1"}).toArray(function(err, result) {
    if (err) return console.log(err);
    res.render('registerTeachers.ejs', {users: result});
  });
});

app.get('/login',function(req,res){
  res.sendFile(path.join(__dirname+'/login.html'));
});

app.get('/teacher',function(req,res){
  if(logged == 1){
  	db.collection('users').find({"Type":"0"}).toArray(function(err, result) {
      if (err) return console.log(err);
  		res.render('teachersFiles.ejs', {users: result});
  	});
  } else {
  	res.end('You have to log in first to view the rating');
  }
});

app.get('/student',function(req,res){
  if(logged == 1){
    db.collection('users').find({"Type":"1"}).toArray(function(err, result) {
      if (err) return console.log(err);
      res.render('studentFiles.ejs', {users: result});
    });
  } else {
    res.end('You have to log in first to view the rating');
  }
});

app.get('/login/students',function(req,res){
  logged = 0;
  db.collection('users').find({"Type":"0"}).toArray(function(err, result) {
    if (err) return console.log(err);
    res.render('loginStudents.ejs', {users: result});
  });
});

app.get('/login/teachers',function(req,res){
  db.collection('users').find({"Type":"1"}).toArray(function(err, result) {
    if (err) return console.log(err);
    res.render('loginTeachers.ejs', {users: result});
  });
});




app.post('/logout', (req, res) => {
  logged = 0;
  console.log("You logged out successfully");
  res.redirect('/');
});




app.post('/reStu', (req, res) => {
  if(req.body.Username == "" || req.body.Password == ""){
    console.log("Write an username and a password");
  } else {
    db.collection('users').find({"Username":req.body.Username}).toArray(function(err, result) {
      if(result.length > 0){
        console.log("Username is already used");
        res.redirect('/register/students');
      } else {
        console.log("--------------------------------------");
        console.log("The relative URL of the current request: /submit\n");
        console.log("message sent:" + req.body.Username + ": " + req.body.Password);
        var result = register(req.body.Username,req.body.Password);
        db.collection('users').insertOne(result, (err, result) => {
          if (err) return console.log(err);
        console.log('saved to database');
          res.redirect('/login/students');
        });
      }
    });
  }
});


app.post('/reTea', (req, res) => {
  if(req.body.Username == "" || req.body.Password == ""){
    console.log("Write an username and a password");
  } else {
    db.collection('users').find({"Username":req.body.Username}).toArray(function(err, result) {
      if(result.length > 0){
        console.log("Username is already used");
        res.redirect('/register/teachers');
      } else {
        console.log("--------------------------------------");
        console.log("The relative URL of the current request: /submit\n");
        console.log("message sent:" + req.body.Username + ": " + req.body.Password);
        var result = register2(req.body.Username,req.body.Password,req.body.Subject);
        db.collection('users').insertOne(result, (err, result) => {
          if (err) return console.log(err);
        console.log('saved to database');
          res.redirect('/login/teachers');
        });
      }
    });
  }

  
});
app.post('/student', (req, res) => {
  db.collection('users').find({"Username":req.body.Username,"Password":req.body.Password,"Type":"0"}).toArray(function(err, result) {
  	if(err) return console.log(err);
  	if (result.length == 0){
  		console.log('Username or Password not correct');
  		res.redirect('/login/students');
  	} else {
  		console.log('You logged in successfully');
  		res.render('studentsFiles.ejs', {users: result});
  	}
  });
});


app.post('/teacher', (req, res) => {
  db.collection('users').find({"Username":req.body.Username,"Password":req.body.Password,"Type":"1"}).toArray(function(err, result) {
  	if(err) return console.log(err);
  	if (result.length == 0){
  		console.log('Username or Password not correct');
  		res.redirect('/login/teachers');
  	} else {
  		logged = 1;
  		THistory = result[0].History;
  		TMaths = result[0].Maths;
  		TInformatics = result[0].Informatics;
  		TEnglish = result[0].English;
  		console.log('You logged in successfully');
  		db.collection('users').find({"Type":"0"}).toArray(function(err, result) {
  			res.render('teachersFiles.ejs', {users: result});
  		});
  	}
  });
});


app.post('/change', (req, res) => {
  db.collection('users').find({"Username":req.body.Username,"Type":"0"}).toArray(function(err, result) {
  	if(err) return console.log(err);
  	if (result.length == 0){
  		console.log('Username not found');
  		res.redirect('/teachers');
  	} else {
  		if(THistory == 1){
		  db.collection('users').updateOne({"Username": req.body.Username},{$set: {"History": req.body.Rating}},(err, result) => {
		    if (err) return console.log(err);
		  });
  		} else if (TMaths == 1){
  			db.collection('users').updateOne({"Username": req.body.Username},{$set: {"Maths": req.body.Rating}},(err, result) => {
		    	if (err) return console.log(err);
		  	});
  		} else if (TInformatics == 1){
  			db.collection('users').updateOne({"Username": req.body.Username},{$set: {"Informatics": req.body.Rating}},(err, result) => {
		    	if (err) return console.log(err);
		  	});
  		} else {
  			db.collection('users').updateOne({"Username": req.body.Username},{$set: {"English": req.body.Rating}},(err, result) => {
		    	if (err) return console.log(err);
		  	});
  		}
  		console.log('You changed the rating successfully');
  		res.redirect('back');

  	}
  });
});




app.post('/login', (req, res) => {
    res.sendFile(path.join(__dirname+'/login.html'));
});

app.post('/loginT', (req, res) => {
  res.redirect('/login/teachers');
});

app.post('/loginS', (req, res) => {
  res.redirect('/login/students');
});


app.post('/register', (req, res) => {
    res.sendFile(path.join(__dirname+'/register.html'));
});

app.post('/registerT', (req, res) => {
  res.redirect('/register/teachers');
});

app.post('/registerS', (req, res) => {
  res.redirect('/register/students');
});


app.get('*',function(req,res){
  res.end("You must log in first");
});



function register(u,p){
  var registered = {
    Username: u,
    Password: p,
    Type: "0",
    History:"-",
    Maths:"-",
    Informatics:"-",
    English:"-"
  };
  return registered;
}
function register2(u,p,s){
  if (s == "History"){
    var registered = {
      Username: u,
      Password: p,
      Type: "1",
      History:"1",
      Maths:"0",
      Informatics:"0",
      English:"0"
    };
  } else if (s == "Maths"){
    var registered = {
      Username: u,
      Password: p,
      Type: "1",
      History:"0",
      Maths:"1",
      Informatics:"0",
      English:"0"
    };
  } else if (s == "Informatics"){
    var registered = {
      Username: u,
      Password: p,
      Type: "1",
      History:"0",
      Maths:"0",
      Informatics:"1",
      English:"0"
    };
  } else {
    var registered = {
      Username: u,
      Password: p,
      Type: "1",
      History:"0",
      Maths:"0",
      Informatics:"0",
      English:"1"
    };
  }
  return registered;
}
module.exports = app;