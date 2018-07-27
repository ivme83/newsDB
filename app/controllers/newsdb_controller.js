const express           = require('express');
const passport          = require('passport');
const LocalStrategy     = require('passport-local').Strategy;
const bcrypt            = require('bcryptjs');
const path              = require('path');
const axios             = require("axios");
const cheerio           = require("cheerio");
const mongojs           = require("mongojs");

const router            = express.Router();

const mongoose          = require("mongoose");
let db                  = require("../models");
const MONGODB_URI       = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI);


//===============ROUTES=================
//displays our homepage
router.get('/', function(req, res){
    // console.log(req.user);
    res.render('home', {user: req.user});
});

//displays our signin page
router.get('/signin', function(req, res){
    res.render('signin');
});

//displays our signup page
router.get('/signup', function(req, res){
    res.render('signup');
});

/* Handle Logout */
router.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/news/favorites', function(req, res){
    addNewArticles("favorites", req)
        .then(function(articles){

            res.render('news', {fav: true, user: req.user, articles: articles});
        })
        .catch(function(err){
            console.log(err);
            res.end();
        });
});

router.get('/news/:source', function(req, res){
    addNewArticles(req.params.source, req)
        .then(function(articles){

            res.render('news', {fav: false, user: req.user, articles: articles});
        })
        .catch(function(err){
            console.log(err);
            res.end();
        });
});

router.get('/article/:id', function(req, res){
    getArticleAndNotes(req.params.id)
        .then(function(article){
            res.render('articlenotes', {user: req.user, article: article[0]});
        })
        .catch(function(err){
            console.log(err);
            res.end();
        })
});

router.get('/api/addFav/:source/:id', function(req, res){
    let articleID       = req.params.id;
    let userID          = req.user._id;
    let objectId        = mongojs.ObjectId;
    let thisRedirect    = "/news/" + req.params.source;

    db.User.findOne({_id: objectId(userID)})
        .then(function(user){
            let tempArr = user.articles;
            let index   = tempArr.indexOf(articleID);

            if (index >= 0){
                res.redirect(thisRedirect);
            } else {
                db.User.findOneAndUpdate({_id: objectId(userID)}, {$push: {articles: articleID}},{ new: true } , function(err, user){
                    res.redirect(thisRedirect);
                });
            }
        })
        .catch(function(err){
            console.log(err);
            res.redirect(thisRedirect);
        });
    
});

router.get('/api/removeFav/:id', function(req, res){
    let objectId    = mongojs.ObjectId;
    let articleID   = req.params.id;
    let userID      = req.user._id;

    db.User.update({_id: objectId(userID)}, { $pullAll: {articles: [objectId(articleID)] } }, function(err, data){

        res.redirect('/news/favorites');
    });
});

router.post('/api/addNote', function(req, res){
    let newBody = req.body.newBody;
    let articleID = req.body.articleID;
    let userID = req.user._id;
    let objectId = mongojs.ObjectId;


    db.Note.create({
        body: newBody,
        user: userID,
        username: req.user.username
    })
        .then(function(dbNote){
        return db.Article.findOneAndUpdate({_id: objectId(articleID)}, {$push: {notes: dbNote._id}},{ new: true });
        })
        .then(function(dbArticle){
        // res.json(dbArticle);
        let thisRedirect = "/article/" + articleID;
        res.redirect(thisRedirect);
        })
        .catch(function(err){
        res.json(err);
        });
});

router.post('/api/removeNote', function(req, res){
    let objectId = mongojs.ObjectId;
    let noteID = req.body.id;
    let articleID = req.body.articleID;

    db.Note.findOneAndRemove({_id: objectId(noteID), user: req.user._id}, (err, note) => {
        if (note){
            db.Article.update({_id: objectId(articleID)}, { $pullAll: {notes: [objectId(noteID)] } }, function(err, data){

                res.end();
            });
        } else {
            res.end();
        }

    });

});

router.post('/login',
    passport.authenticate('local', { failureRedirect: '/signin' }),
    function(req, res) {
    res.redirect('/');
});

router.post('/signup',
    passport.authenticate('signup', { failureRedirect: '/signin' }),
    function(req, res) {
    res.redirect('/');
});

 
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    db.User.findById(id).then(function(result){
        cb(null, result);
    });
});

passport.use('local', new LocalStrategy({
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {

    process.nextTick(function() {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        db.User.findOne({username: username})
            .then(function(user){
                if (!user) {
                    return done(null, false);
                }

                let hash = user.password;

                bcrypt.compare(password, hash).then((res) => {
                    if (res) {
                        return done(null, user);
                    } else {
                        return done(null, false);
                    }
                });

            });

    });

}));

passport.use('signup', new LocalStrategy({
    passReqToCallback : true
  },
  function(req, username, password, done) {
    findOrCreateUser = function(){
        db.User.findOne({username: username})
        .then(function(user) {

            if(user){
                console.log('User already exists');
                return done(null, false); 
            } else {
                genHash(password).then(hash => {

                    db.User.create({username: username, password:hash})
                        .then(function(user){
                            return done(null, user);
                        })
                        .catch(function(err){
                            console.log(err);
                        })

                })
            }
        });   
    }

    process.nextTick(findOrCreateUser);
}));


let search = function(nameKey, nameValue, myArray){
    for (var i=0; i < myArray.length; i++) {
        if (myArray[i][nameKey] === nameValue) {
            return myArray[i].snip_content;
        }
    }
}
  
let genHash = function(password) {
    return new Promise(function(resolve, reject) {
        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
            reject(err);
            }
            
            bcrypt.hash(password, salt, (err, hash) => {
            if (err) {
                reject(err);
            }
            resolve(hash);
            });
        });
    });
};

let addNewArticles = function(source, req) {
    // need to create promise here
    return new Promise(function(resolve, reject) {
        switch (source){
            case "boingboing":
            case "BoingBoing":
                boingboingScrape().then(function(articles){
                    resolve(articles);
                });
                break;
            case "favorites":
                getFavorites(req).then(function(articles){
                    resolve(articles);
                });                
                break;
            default:
                break;
        }
    });
}

let boingboingScrape = function(){

    return new Promise(function(resolve, reject) {

        // First, we grab the body of the html with request
        axios.get("https://boingboing.net/grid").then(function(response) {
            // Then, we load that into cheerio and save it to $ for a shorthand selector
            let $ = cheerio.load(response.data, {
                xml: {
                    normalizeWhitespace: true,
                }
            });

            // Now, we grab every h2 within an article tag, and do the following:
            $("div.feature").each(function(i, element) {
                // Save an empty result object
                let result = {};
                result.title =
                    $(this)
                    .find("h2")
                    .children("a.headline")
                    .text();

                result.articleUrl =
                    $(this)
                    .find("h2")
                    .children("a.headline")
                    .attr("href");

                result.imgUrl =
                    $(this)
                    .find("div")
                    .attr("style");
                    
                    result.imgUrl = result.imgUrl.replace("background-image:url('", "");
                    result.imgUrl = result.imgUrl.replace("')", "");

                result.byline =
                    $(this)
                    .find("h2")
                    .children("a.byline")
                    .text();

                result.articleSrc = "BoingBoing";

                db.Article.findOne({articleUrl: result.articleUrl})
                .then(function(article) {
                    if(article){

                        // console.log(article);
                    } else {

                        db.Article.create(result)
                            .then(function(article){
                                // console.log(article);
                            })
                            .catch(function(err){
                                console.log(err);
                            });

                    }
                });   
                

            });

        }).then(function(){

            getArticles("BoingBoing")
                .then(function(articles){
                    resolve(articles);
                })
                .catch(function(err){
                    reject(err);
                });

        });
    });
}

let getArticles = function(source){
    return new Promise(function(resolve, reject){

        // db.Article.find({articleSrc: source})
        //     .then(function(articles){
        //         resolve(articles);
        //     })
        //     .catch(function(err){
        //         reject(err);
        //     });

        db.Article.find({articleSrc: source}).sort('-scrapedOn').exec(function(err, articles){
            resolve(articles);
        });

    });
}

let getFavorites = function(req){
    return new Promise(function(resolve, reject){
        let userID      = req.user._id;
        let objectId    = mongojs.ObjectId;

        db.User.findOne({_id: objectId(userID)})
            .populate("articles")
            .then(function(articles){
                resolve(articles.articles);
            })
            .catch(function(err){
                reject(err);
            });
    });
}

let getArticleAndNotes = function(articleId){
    return new Promise(function(resolve, reject){
        let objectId = mongojs.ObjectId;

        db.Article.find({_id: objectId(articleId)})
            .populate("notes")
            .then(function(article){
                resolve(article);
            })
            .catch(function(err){
                reject(err);
            });
    });
}

// Export routes for server.js to use.
module.exports      = router;