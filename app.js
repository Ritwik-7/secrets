require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}))


app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());

app.use(passport.session());

mongoose.connect("mongodb+srv://admin-ritwik:Rishi_012@cluster0.t2i1d.mongodb.net/userDB", { useNewUrlParser: true }, { useUnifiedTopology: true })
mongoose.set("useCreateIndex", true);


const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});







app.get("/", function (req, res) {
    res.render("home");
});




app.get("/login", function (req, res) {
    res.render("login");
});


app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/secrets", function (req, res) {
    User.find({ "secret": { $ne: null } }, function (err, found) {
        if (err) {
            console.log(err);
        } else {
            if (found) {
                res.render("secrets", { userWithSecrets: found });
            }
        }
    });
});


app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit")
    }
    else {
        res.redirect("/login")
    }
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

app.post("/submit", function (req, res) {
    const submittedSecret = req.body.secret;

    User.findById(req.user.id, function (err, founded) {
        if (err) {
            console.log(err);
        }
        else {
            if (founded) {
                founded.secret = submittedSecret;
                founded.save(function () {
                    res.redirect("/secrets");
                });
            }
        }
    });

});

app.post("/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            });
        }
    });
});


app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            });
        }
    });
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}



app.listen(port, function () {
    console.log("Running!!");
})