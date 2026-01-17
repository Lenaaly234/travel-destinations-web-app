var express = require('express');
var router = express.Router();

function ensureDestinations(db, callback) {
    const destinations = [
        { name: "Paris", slug: "paris" },
        { name: "Rome", slug: "rome" },
        { name: "Bali Island", slug: "bali" },
        { name: "Santorini Island", slug: "santorini" },
        { name: "Inca Trail to Machu Picchu", slug: "inca" },
        { name: "Annapurna Circuit", slug: "annapurna" }
    ];

    db.listCollections({ name: "Destinations" }).toArray(function(err, cols) {
        if (cols.length > 0) {
            return callback();
        }

        db.createCollection("Destinations", function(err, col) {
            col.insertMany(destinations, function() {
                callback();
            });
        });
    });
}

/*  REGISTER PAGE  */
router.get('/register', function(req, res) {
    res.render('register', { message: "" });
});

/* HANDLE REGISTRATION */
router.post('/register', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    if (!username || !password) {
        return res.render("register", { message: "All fields required!" });
    }

    req.app.locals.connectDB(function(db, client) {
        db.collection("myCollection").findOne({ username: username }, function(err, user) {
            if (user) {
                client.close();
                return res.render("register", { message: "Username already taken!" });
            }

            db.collection("myCollection").insertOne(
                { username: username, password: password, list: [] },
                function(err, result) {
                    client.close();
                    return res.redirect("/users/login");
                }
            );
        });
    });
});

/*LOGIN PAGE */
router.get('/login', function(req, res) {
    res.render('login', { message: "" });
});

/*  HANDLE LOGIN  */
router.post('/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    req.app.locals.connectDB(function(db, client) {
        db.collection("myCollection").findOne(
            { username: username, password: password },
            function(err, user) {

                if (!user) {
                    client.close();
                    return res.render("login", { message: "Invalid username or password" });
                }

                req.session.user = username;

                ensureDestinations(db, function() {
                    client.close();
                    return res.redirect("/home");
                });
            }
        );
    });
});

/*HOME PAGE*/
router.get('/home', function(req, res) {
    if (!req.session.user) {
        return res.redirect("/users/login");
    }

    res.send("WELCOME " + req.session.user + "! (Home page coming soon)");
});

module.exports = router;