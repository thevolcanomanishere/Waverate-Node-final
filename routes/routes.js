var path = require('path');
var Account = require(path.join(__dirname, '..', '/models/account'));
var Token = require(path.join(__dirname, '..', '/models/account')).Token;

module.exports = function (app, passport){
    
    //default test route
    app.get('/', function(req, res){
        res.status(200).send("Hello! all is working");
    })
    
    //get a list of all users for testing
    app.get('/allusers', function(req, res){
    var response = {};
    Account.find({}, function(err, data){
        if(err) {
            response = {"error": true, "message": "Error fetching data"};
        } else {
            response = {"error": false, "message": data};
        }
        res.json(response);
       });
    })
    
    //register a users details
    app.post('/register', function(req, res){
        var username = req.body.username;
        var email = req.body.email;
        var password = req.body.password;
        var user = new Account({username: username, email: email});
        var response;
        
        Account.register(user, password, function(error, account){
            if(error){
                if(error.name === 'BadRequesterroror' && error.message && error.message.indexOf('exists') > -1){
                    response = {"error": true, "message": "Email already exists"};
                    
                } else if (error.name === 'BadRequesterroror' && error.message && error.message.indexOf('argument not set')){
                    
                    response = {"error": true, "message": "You are missing a required argument"};
                    
                } else {
                    
                    response = {"error": true, "message": error.message};
                }
                res.json(response);
            } else {
                
                Account.createUserToken(email, function(err, usersToken){
                    if(err){
                        res.json({"error": true, "message": "Could not create token"});
                    } else {
                        res.json({"error": false, "token": usersToken});
                    }
                })
            }
        });
    });
    
    
    //log a user in by getting a token
    app.post('/login', passport.authenticate('local', {session: false}), function(req, res){
        if(req.user){
            Account.createUserToken(req.user.email, function(err, usersToken){
                if(err){
                    res.json({"error": true, "message": "could not create token"});
                } else {
                    res.json({"error": false, "token": usersToken});
                }
            });
        } else {
            res.json({"error": true, "message": "Auth error"});
        }
    });
    
    //logout
    app.get('/logout', function(req, res){
        var incomingToken = req.headers.token;
        
        if(incomingToken){
            var decoded = Account.decode(incomingToken);
            if(decoded && decoded.email) {
                //destroying token
                Account.invalidateUserToken(decoded.email, function(err, user) {
                    if(err) {
                        res.json({"error": true, "message": "issue finding user"});
                    } else {
                        res.json({"error": false, "message": "logged out"});
                    }
                })
            } else {
                res.json({"error": true, "message": "Issue decoding token"});
            }
        }
    })
    
    //test token check
    app.get('/apitest', function(req, res){
        var incomingToken = req.headers.token;
        console.log("apitest token =" + incomingToken);
        //add some code here to catch error with the token decoding
        var decoded = Account.decode(incomingToken);
        
        //mongodb user check
        if(decoded && decoded.email) {
            Account.findUser(decoded.email, incomingToken, function(err, user){
                if(err) {
                    console.log(err);
                    res.json({"error": "Could not find user"});
                } else {
                    if (Token.hasExpired(user.token.date_created)) {
                        console.log("Token expired. Must login");
                        res.json({"error": "Token expired. log in again"});
                        
                    } else {
                        res.json({
                            "user" : {
                                "email" : user.email,
                                "username" : user.username,
                                "token" : user.token
                            }
                        });
                    }
                }
            });
        } else {
            console.log("Problem decoding token");
            res.json({"error": "Exploded"});
        }
    })
    
    //get a single users information
    app.get('/user/movieswatched', function(req, res){
        console.log("Getting users information");
        var response = {};
        
        //get incoming token, decode it 
        var incomingToken = req.headers.token;
        var decoded = Account.decode(incomingToken);
        console.log(decoded.email);
        
        
        if(decoded && decoded.email){
            
            //check to see if there is an email + token that matches
            Account.findUser(decoded.email, incomingToken, function(err, user) {
                if(err){
                    console.log(err);
                    res.json({"error": "Could not find user or user is logged out"});
                } else {
                    if(Token.hasExpired(user.token.date_created)){
                        console.log("Token expired. Must login");
                        res.json({"error": "Token expired. log in again"});
                    } else {
                        
                        //retrieve information on the single user
                        Account.findUserByEmailOnly(decoded.email, function(err, data) {
                            if(err){
                                response = {"error" : true,"message" : "Error fetching data"};
                            } else {
                                response = {"error": false, "message": data.moviesWatched};
                            }
                            res.json(response);
                        })
                    }
             }
            })
        }
            
        })
    
    
    //adding a movie to user
    app.post('/user/movieswatched', function(req, res){
        console.log("Hit movies");
        var response = {};
        var incomingToken = req.headers.token;
        var decoded = Account.decode(incomingToken);
        
        if(decoded && decoded.email){
            Account.findUser(decoded.email, incomingToken, function(err, user) {
                if(err) {
                    console.log(err);
                    res.json({"error": "Could not find user"});
                } else {
                    if(Token.hasExpired(user.token.date_created)){
                        console.log("Token expired. Must login");
                        res.json({"error": "Token expired. log in again"});
                    } else {
                        
                    Account.update({email: decoded.email},{ $push: {moviesWatched: req.body}}, 
                    function(err, user){
                        if(err) {
                        response = {"error" : true, "message" : err.message};
                        } else {
                           response = {"error" : false, "message" : "movie added"};
                        }
                        res.json(response);
                    })
                    }
                }
            })
        } else {
            console.log("Problem decoding token");
            res.json({"error": "Exploded"});
        }
    
    });

    
    
}