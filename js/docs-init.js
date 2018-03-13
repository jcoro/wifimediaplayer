(function($){
	$(function(){


    // Navbar
    $(".button-collapse").sideNav();
    var categories = $('nav .categories-container');
    if (categories.length) {
      categories.pushpin({ top: categories.offset().top });
      var $links = categories.find('li');
      $links.each(function() {
        var $link = $(this);
        $link.on('click', function() {
          $links.removeClass('active');
          $link.addClass('active');
          var hash = $link.find('a').first()[0].hash.substr(1);

          $('.gallery .gallery-expand')
            .addClass('gallery-filter')
            .stop()
            .fadeIn(100);
          if (hash !== 'all') {
            console.log($('.gallery .gallery-expand').not('.' + hash));
            $('.gallery .gallery-expand').not('.' + hash)
              .hide()
              .removeClass('gallery-filter');
          }

        });
      });
    }


    $('a.filter').click(function (e) {
      e.preventDefault();
    });


    // Docs init

    var toc = $('.table-of-contents');
    toc.pushpin({ top: toc.offset().top });
    $('.scrollspy').scrollSpy();

	}); // end of document ready
})(jQuery); // end of jQuery name space