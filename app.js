const express = require("express");
const session = require("express-session");
const path = require("path");
const { MongoClient } = require("mongodb");

const siteRouter = require("./routes/site");

const app = express();

/* BODY PARSER  */
app.use(express.urlencoded({ extended: false }));

/*  SESSION */
app.use(session({
  secret: "secret123",
  resave: false,
  saveUninitialized: false
}));

/* STATIC FILES */
app.use(express.static(path.join(__dirname, "public")));

/*VIEW ENGINE*/
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* MONGODB */
const url = "mongodb://127.0.0.1:27017";
const dbName = "myDB";
let dbClient;

async function connect() {
  if (!dbClient) {
    dbClient = new MongoClient(url);
    await dbClient.connect();
    console.log("✅ MongoDB connected");
  }
  return dbClient.db(dbName);
}

async function getUsersCollection() {
  const db = await connect();
  return db.collection("myCollection");
}

async function getDestinationsCollection() {
  const db = await connect();
  return db.collection("Destinations");
}

app.locals.getUsersCollection = getUsersCollection;
app.locals.getDestinationsCollection = getDestinationsCollection;

/* ROUTES */
app.use("/", siteRouter);

/*  SERVER  */
app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
