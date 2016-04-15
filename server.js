"use strict";

var express = require('express');
var http = require('http');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;


var app = express();
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(passport.initialize());
app.use(app.router);


app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showstack: true}));
});

app.configure('production', function(){
  app.use(express.errorHandler());
})

var Account = require('./models/account');

passport.use(Account.createStrategy());


mongoose.connect('mongodb://dbuser:traktors4love209@ds023570.mlab.com:23570/waverate-database', function(err) {
    if (err) throw err;
    console.log(err);
});
// mongoose.connect('mongodb://localhost:27017/testDb');
require('./routes/routes')(app, passport);


console.log("Server started");

app.listen(process.env.PORT);