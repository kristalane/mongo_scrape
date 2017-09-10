

// Grab the articles as a json, loop through results and display
$.getJSON("/articles", function(data) {
  for (var i = 0; i < data.length; i++) {
    $("#articles").append("<p data-id='" + data[i]._id + "'>" + data[i].title + "<br />" + data[i].link + "</p>");
  }
});

// Whenever someone clicks a p tag, we want to empty the contents of the id comment and save the id of the clicked item as thisId.
$(document).on("click", "p", function() {
  $("#comment").empty();
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // when done, append the article details and associated comments.
    .done(function(data) {
      console.log(data);
      $("#comment").append("<h2>" + data.title + "</h2>");
      $("#comment").append("<input id='titleinput' name='title' >");
      $("#comment").append("<textarea id='bodyinput' name='body'></textarea>");
      $("#comment").append("<button data-id='" + data._id + "' id='savecomment'>Save Comment</button>");

      // If there's a comment saved to the article, place the text body into the titleinput and bodyinput ids.
      if (data.comment) {
        $("#titleinput").val(data.comment.title);
        $("#bodyinput").val(data.comment.body);
      }
    });
});

// When you click the savecomment button, grab id from the clicked comment
$(document).on("click", "#savecomment", function() {
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs.
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      title: $("#titleinput").val(),
      body: $("#bodyinput").val()
    }
  })
    .done(function(data) {
      console.log(data);
      $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});
