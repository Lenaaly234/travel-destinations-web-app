const express = require("express");
const router = express.Router();
const destinations = require("../data/destinations");

/*  AUTH MIDDLEWARE  */
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }
  next();
}

/* LOGIN */

router.get("/", (req, res) => {
  res.render("login", { error: null, msg: null });
});

router.post("/", async (req, res) => {
  const { username, password } = req.body;
  const usersCol = await req.app.locals.getUsersCollection();

  if (!username || !password) {
    return res.render("login", {
      error: "Please enter both username and password",
      msg: null
    });
  }

  const user = await usersCol.findOne({ username, password });

  if (!user) {
    return res.render("login", {
      error: "Invalid username or password",
      msg: null
    });
  }

  req.session.user = username;
  res.redirect("/home");
});

/*  REGISTRATION  */

router.get("/registration", (req, res) => {
  res.render("registration", { error: null });
});

router.post("/registration", async (req, res) => {
  const { username, password } = req.body;
  const usersCol = await req.app.locals.getUsersCollection();

  if (!username || !password) {
    return res.render("registration", {
      error: "All fields are required"
    });
  }

  const exists = await usersCol.findOne({ username });
  if (exists) {
    return res.render("registration", {
      error: "Username already taken"
    });
  }

  await usersCol.insertOne({
    username,
    password,
    wantList: []
  });

  res.render("login", {
    error: null,
    msg: "Registration successful. Please log in."
  });
});

/*  HOME */

router.get("/home", requireLogin, (req, res) => {
  res.render("home");
});

/* CATEGORIES  */

router.get("/hiking", requireLogin, (req, res) => res.render("hiking"));
router.get("/cities", requireLogin, (req, res) => res.render("cities"));
router.get("/islands", requireLogin, (req, res) => res.render("islands"));

/* DESTINATION PAGES */

router.get("/:slug", requireLogin, (req, res, next) => {
  const dest = destinations.find(d => d.slug === req.params.slug);
  if (!dest) return next();

  res.render(dest.slug, {
    error: null
  });
});

/*  WANT-TO-GO (ADD) */

router.post("/wanttogo", requireLogin, async (req, res) => {
  const { slug } = req.body;
  const usersCol = await req.app.locals.getUsersCollection();

  if (!slug) return res.redirect("/home");

  const result = await usersCol.updateOne(
    { username: req.session.user },
    { $addToSet: { wantList: slug } }
  );

  if (result.modifiedCount === 0) {
    return res.redirect("/wanttogo?msg=exists");
  }

  res.redirect("/wanttogo?msg=added");
});

/*WANT-TO-GO (VIEW) */

router.get("/wanttogo", requireLogin, async (req, res) => {
  const usersCol = await req.app.locals.getUsersCollection();
  const user = await usersCol.findOne({ username: req.session.user });

  let message = null;
  if (req.query.msg === "exists") {
    message = "⚠️ This destination is already in your Want-to-Go list.";
  }
  if (req.query.msg === "added") {
    message = "✅ Destination added successfully!";
  }

  res.render("wanttogo", {
    items: user.wantList || [],
    message
  });
});

/* SEARCH (FIXED) */

router.post("/search", requireLogin, (req, res) => {
  const keyword = req.body.search;

  if (!keyword || keyword.trim() === "") {
    return res.render("searchresults", {
      results: [],
      message: "Please enter a search keyword"
    });
  }

  const results = destinations.filter(d =>
    d.name.toLowerCase().includes(keyword.toLowerCase())
  );

  if (results.length === 0) {
    return res.render("searchresults", {
      results: [],
      message: "Destination not found"
    });
  }

  res.render("searchresults", {
    results,
    message: null
  });
});

/*  LOGOUT */

router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
