

module.exports = function(app) {

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
        // This effectively passes the result object to the entry (and the title and link) and lets us save that entry to the db.
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
    // Tell the browser that we finished scraping the text
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

}
