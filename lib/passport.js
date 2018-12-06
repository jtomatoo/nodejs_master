var db = require('./db.js');
var bcrypt = require('bcryptjs');
var shortid = require('shortid');
module.exports = function(app) {
    // var authData = {
    //     email: 'test@test.com',
    //     password: '1234',
    //     nickname: 'test'
    // }
    //

    var passport = require('passport');
    var LocalStrategy = require('passport-local').Strategy;
    var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
    var FacebookStrategy = require('passport-facebook').Strategy;

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function(user, done) {
        console.log('serializeUser >>', user);
        done(null, user.id);
        // done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        console.log('deserializeUser <<', id);
        var user = db.get('users').find({id:id}).value();
        done(null, user);
    });

    var googleCredentials = require('../config/google.json');
    passport.use(new GoogleStrategy({
        clientID: googleCredentials.web.client_id,
        clientSecret: googleCredentials.web.client_secret,
        callbackURL: googleCredentials.web.redirect_uris[0]
    } , function(accessToken, refreshToken, profile, done) {
            // console.log('GoogleStrategy', accessToken, refreshToken, profile);
            var email = profile.emails[0].value;
            var user = db.get("users").find({email: email}).value();
            if(user) {
                user.googleId = profile.id;
                db.get('users').find({id:user.id}).assign(user).write();
            } else {
                user = {
                    id:shortid.generate(),
                    email:email,
                    displayName:profile.displayName,
                    googleId:profile.id
                };
                db.get('users').push(user).write();
            }        
            done(null, user);
        }
    ));
    
    var facebookCredentials = require('../config/facebook.json');
    facebookCredentials.profileFields = ['id', 'emails', 'name', 'displayName'];
    passport.use(new FacebookStrategy(facebookCredentials, 
        function(accessToken, refreshToken, profile, done) {
            console.log('FacebookStrategy', accessToken, refreshToken, profile);
            var email = profile.emails[0].value;
            var user = db.get('users').find({'email':email}).value();
            if(user) {
                user.facebookId = profile.id;
                db.get('users').find({email:email}).assign(user).write();
            } else {
                user = {
                    id:shortid.generate(),
                    email: email,
                    displayName: profile.displayName,
                    facebookId:profile.id
                }
                db.get('users').push(user).write();
            }

            done(null, user);
    }));


    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'pwd'
    }
    , function(username, password, done) {
        console.log('LocalStratgy >>', username, password);
        var user = db.get('users').find({email:username}).value();
        if(user) {
            bcrypt.compare(password, user.password, function(err, result) {
                if(result) {
                    return done(null, user, {message: 'Welcome.'});
                } else {
                    return done(null, false, {message: 'Incorrect info. A'});        
                }
            });
        } else {
            return done(null, false, {message: 'Incorrect info. B'});
        }
        // if(email === user.email) {
        //     console.log('1');
        // if(password === authData.password) {
        //     console.log('2');
        //     return done(null, authData, {
        //         message: 'Welcome.'
        //     });
        // } else {
        //     console.log('3');
        //     return done(null, false, {
        //         message: 'Incorrect email.'
        //     });
        // }
        // } else {
        //     console.log('4');
        //     return done(null, false, {
        //         message: 'Incorrect email.'
        //     });
        // }
    }));

    return passport;
}
