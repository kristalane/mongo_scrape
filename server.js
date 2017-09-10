// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Comment = require("./models/Comment.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;


// Initialize Express
var app = express();

var PORT = process.env.PORT || 3000;

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

mongoose.connect("mongodb://heroku_4s24jqq7:jlunngp72jlt1ivfihh4nspru2@ds133084.mlab.com:33084/heroku_4s24jqq7");
var db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function() {
  console.log("Mongoose connection successful.");
});

// Routes:
app.get("/", function(req, res) {
  res.send("Hello world");
});

// A GET request to scrape the nytimes website
app.get("/scrape", function(req, res) {
  request("http://www.nytimes.com", function(error, response, html) {
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {

      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      // Using our Article model, create a new entry
      // This passes the result object to the entry (and the title and link) and lets us save that entry to the db.
      var entry = new Article(result);
      entry.save(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          console.log(doc);
        }
      });

    });
  });
  res.send("Scrape Complete");
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  Article.find({}, function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});

// This route grabs an article by its ObjectId, then w/ the id passed in the id parameter, prepares a query that finds the matching one in our db, populates comments associated with it, and executes the query.

app.get("/articles/:id", function(req, res) {
  Article.findOne({ "_id": req.params.id })
  .populate("comment")
  .exec(function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});

// Create a new comment or replace an existing comment
app.post("/articles/:id", function(req, res) {
  var newComment = new Comment(req.body);
  newComment.save(function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      // Use the article id to find and update its comment
      Article.findOneAndUpdate({ "_id": req.params.id }, { "comment": doc._id })
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          res.send(doc);
        }
      });
    }
  });
});





// Listen on port 3000
app.listen(PORT, function() {
  console.log("App running on port " + PORT);
});
