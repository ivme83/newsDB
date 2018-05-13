document.addEventListener('DOMContentLoaded', function () {

    // Get all "navbar-burger" elements
    var $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  
    // Check if there are any navbar burgers
    if ($navbarBurgers.length > 0) {
  
      // Add a click event on each of them
      $navbarBurgers.forEach(function ($el) {
        $el.addEventListener('click', function () {
  
          // Get the target from the "data-target" attribute
          var target = $el.dataset.target;
          var $target = document.getElementById(target);
  
          // Toggle the class on both the "navbar-burger" and the "navbar-menu"
          $el.classList.toggle('is-active');
          $target.classList.toggle('is-active');
  
        });
      });
    }

    const $postCommentBtn = $("#post-comment-btn");

    $postCommentBtn.click(e => {
        e.preventDefault();

        let newBody = $("#formNote").val();

        let articleID = $("#articleID").val();
        console.log(articleID);
        let newNote = {
            newBody: newBody,
            articleID: articleID
        };

        $.ajax("/api/addNote", {
            type: "POST",
            data: newNote
            }).then(
                function(data) {
                    console.log("Successful note submission");
                    // console.log(data);
                    // window.location = data.redirect;
                    window.location.reload();
                }
            );
    });

    // const $removeNote = $(".remove-note");

    // $removeNote.click(e => {
    //     e.preventDefault();

    //     let id = $(this).data("id");

    //     console.log(id);
    // });

    $(".remove-note").on("click", function(event){
        event.preventDefault();

        let delId = $(this).data("id");
        let articleID = $("#articleID").val();

        let id = {
            id: delId,
            articleID: articleID
        };

        $.ajax("/api/removeNote", {
            type: "POST",
            data: id
            }).then(
                function(data) {
                    console.log("Successful note deletion");
                    // console.log(data);
                    // window.location = data.redirect;
                    window.location.reload();
                }
            );
    });

    // $(".vote-for").on("click", function(event) {
    //     var id = $(this).data("id");
        
    //     // Send the PUT request.
    //     $.ajax("/api/burgers/" + id, {
    //       type: "PUT"
    //     }).then(
    //       function() {
    //         // Reload the page to get the updated list
    //         location.reload();
    //       }
    //     );
    //   });

});

  

