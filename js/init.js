(function ($) {
    $(function () {


        // Navbar
        $(".button-collapse").sideNav();
        var categories = $('nav .categories-container');
        if (categories.length) {
            categories.pushpin({top: categories.offset().top});
            var $links = categories.find('li');
            $links.each(function () {
                var $link = $(this);
                $link.on('click', function () {
                    $links.removeClass('active');
                    $link.addClass('active');
                    var hash = $link.find('a').first()[0].hash.substr(1);
                    var $galleryItems = $('.gallery .gallery-item');

                    $galleryItems.stop().addClass('gallery-filter').fadeIn(100);

                    if (hash !== 'all') {
                        var $galleryFilteredOut = $galleryItems.not('.' + hash).not('.all');
                        $galleryFilteredOut.removeClass('gallery-filter').hide();
                    }

                    // transition layout
                    $masonry.masonry({
                        transitionDuration: '.3s'
                    });
                    // only animate on layout
                    $masonry.one('layoutComplete', function (event, items) {
                        $masonry.masonry({
                            transitionDuration: '0'
                        });
                    });
                    setTimeout(function () {

                        $masonry.masonry('layout');
                    }, 1000);
                });
            });
        }

        // Masonry Grid
        var $masonry = $('.gallery');
        $masonry.masonry({
            // set itemSelector so .grid-sizer is not used in layout
            itemSelector: '.gallery-filter',
            // use element for option
            columnWidth: '.gallery-filter',
            // no transitions
            transitionDuration: 0
        });

        $('a.filter').click(function (e) {
            e.preventDefault();
        });

        // Load Masonry after Window loads to make sure the margins work properly
        $(window).load(function () {
        // layout Masonry after each image loads
            $masonry.imagesLoaded(function () {
                $masonry.masonry('layout');
            });
        });



        $('.gallery-expand').galleryExpand({
            fillScreen: true,
            outDuration: 500,
            inDuration: 500
        });

        $('.blog .gallery-expand').galleryExpand({
            fillScreen: true,
            inDuration: 500
        });

    }); // end of document ready
})(jQuery); // end of jQuery name space