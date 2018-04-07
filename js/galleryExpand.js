/*!
 * WiFi Media Player
 * by John Coronite
 */

(function ($) {


    var methods = {

        init: function (options) {
            var defaults = {
                inDuration: 300, // ms
                outDuration: 200, // ms
                responsiveThreshold: 992, // breakpoint for full width style
                contentPadding: 40, // Padding for content in Custom Modal
                onShow: null, // callback
                defaultColor: '#444', // Fallback color for color thief.
                primaryColor: '', // Primary color that overrides color thief.
                secondaryColor: '', // Secondary color that overrides color thief.
                fillScreen: false, // Modal to full width background transition style.
                dynamicRouting: false, // Add hash id to URL to allow dynamic routing.
            };
            options = $.extend(defaults, options);

            var urlObjectId = window.location.hash.substring(1);

            return this.each(function (i) {
                var originClickable = true;
                var returnClickable = false;
                var overlayActive = false;
                var doneAnimating = true;
                var origin = $(this);
                var objectId = origin.attr('id') || i.toString();
                var $object = origin.find('.gallery-cover');
                var $header = origin.find('.gallery-header');

                // Get attribute options.
                var inDuration = parseInt($(this).attr('data-in-duration')) || options.inDuration;
                var outDuration = parseInt($(this).attr('data-out-duration')) || options.outDuration;
                var responsiveThreshold = parseInt($(this).attr('data-responsive-threshold')) || options.responsiveThreshold;
                var originalContentPadding = parseInt($(this).attr('data-content-padding')) || options.contentPadding;
                var primaryColor = $(this).attr('data-primary-color') || options.primaryColor;
                var fillScreen = !!$object.length && ($(this).attr('data-fill-screen') || options.fillScreen);
                var dynamicRouting = $(this).attr('data-dynamic-routing') || options.dynamicRouting;
                var isHorizontal = $(this).hasClass('gallery-horizontal');
                var fullWidth, objectSizeAdjusted = false;

                // Variables
                var placeholder;
                var origContainerWidth, origContainerHeight;
                var origHeaderRect, origHeaderWidth, origHeaderHeight, origHeaderOffsetTop;
                var origObjectWidth, origObjectHeight, origObjectRect;
                var origScrollTop;
                var offsetTop, offsetLeft, contentOffsetTop;
                var navOffset = 32;
                var cardPadding;
                var contentPadding = originalContentPadding;
                var bezierCurve = 'cubic-bezier(0.420, 0.000, 0.580, 1.000)';
                var modalResizer;
                var animationTimeout, animationEndState;
                var objectInlineStyles;
                var windowWidth = $(document).width();
                var windowHeight = window.innerHeight;
                var bodyScrolls = false;

                // Generate placeholder structure.
                placeholder = origin.children('.placeholder').first();
                if (!placeholder.length) {
                    origin.wrapInner($('<div class="placeholder"></div>'));
                    placeholder = origin.children('.placeholder').first();
                }
                if (!$header.length) {
                    $header = $('<div class="gallery-header invisible"></div>');
                    $object.after($header);
                }

                // Setup fillScreen.
                var gradient = $object.find('.gradient').first();
                if (fillScreen) {
                    if (!gradient.length) {
                        //gradient = $('<div class="gradient"></div>');
                        //$object.append(gradient);
                    }
                    origin.attr('data-fillscreen', true);
                }

                var resetSelectors = function () {
                    $object = origin.find('.gallery-cover');
                    $header = origin.find('.gallery-header');
                    placeholder = origin.find('.placeholder');
                };

                var setOrigDimensions = function () {
                    origContainerRect = origin[0].getBoundingClientRect();
                    origContainerWidth = origContainerRect.width;
                    origContainerHeight = origin.height();
                    origHeaderRect = $header[0].getBoundingClientRect();
                    origHeaderWidth = origHeaderRect.width;
                    origHeaderHeight = origHeaderRect.height || 1;
                    origObjectWidth = $object.width();
                    origObjectHeight = $object.height();
                    origObjectRect = $object.length ? $object[0].getBoundingClientRect() : {
                        top: origObjectRect.top,
                        left: 0
                    };

                    origScrollTop = $(window).scrollTop();
                };

                origin.off('click.galleryExpand').on('click.galleryExpand', function (e) {
                    // If already modal, do nothing
                    if (!originClickable) {
                        return;
                    }

                    // If is child of ancestor that has attr data-stop-propagation, do nothing
                    var target = $(e.target);
                    if (target.attr('data-stop-propagation') ||
                        target.closest('[data-stop-propagation="true"]').length) {
                        return;
                    }

                    originClickable = false;

                    // Cancel timeout.
                    window.clearTimeout(animationTimeout);
                    animationTimeout = null;

                    setOrigDimensions();

                    // Set URL param
                    if (dynamicRouting) {
                        window.location.hash = objectId;
                    }

                    // Card vars
                    var headerOffsetTop, newCardWidth, newCardHeight;
                    var recalculateVars = function () {
                        windowWidth = $(document).width();
                        windowHeight = window.innerHeight;

                        // States
                        fullWidth = windowWidth <= responsiveThreshold;
                        bodyScrolls = document.body.scrollHeight > document.body.clientHeight;
                        // Get the computed style of the body element
                        var bodyStyle = document.body.currentStyle || window.getComputedStyle(document.body, "");
                        // Check the overflow and overflowY properties for "auto" and "visible" values
                        bodyScrolls = bodyScrolls &&
                            (bodyStyle.overflow == "visible" ||
                                bodyStyle.overflowY == "visible" ||
                                bodyStyle.overflow == "auto" ||
                                bodyStyle.overflowY == "auto");

                        // Dimensions
                        navOffset = 32;
                        offsetTop = -origin[0].getBoundingClientRect().top;
                        offsetLeft = offsetLeft === undefined ? -placeholder[0].getBoundingClientRect().left : offsetLeft + -placeholder[0].getBoundingClientRect().left;
                        contentPadding = fullWidth ? 20 : originalContentPadding;
                        contentOffsetTop = Math.round((origObjectHeight / 2) + contentPadding + navOffset);

                        // Card vars
                        headerOffsetTop = (origObjectHeight / 2) - contentPadding;
                        newCardWidth = windowWidth * 0.7;
                        newCardHeight = windowHeight - headerOffsetTop - navOffset;
                        cardPadding = Math.max(((windowWidth - newCardWidth) / 2), contentPadding);


                    };

                    // Recalculate
                    recalculateVars();

                    // INITIAL SETUP
                    animationEndState = placeholder.clone(true);

                    // Disable scrolling.
                    $('body').css('overflowX', 'hidden');
                    $('body').on('scroll.disable-scroll mousewheel.disable-scroll touchmove.disable-scroll', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    });


                    // Set wrapper dimensions.
                    origin.css({
                        height: origContainerHeight,
                        width: origContainerWidth
                    });

                    var transformString = 'translate3d(';

                    transformString += (origObjectRect.left) + 'px, ' +
                        (origObjectRect.top) + 'px, 0)';


                    // Object animation.
                    if ($object.length) {

                        // Shared properties.
                        $object.css({
                            height: origObjectHeight,
                            width: origObjectWidth,
                            transform: transformString,
                        });
                    }


                    // Set header dimensions.
                    origHeaderOffsetTop = isHorizontal ? contentPadding - origHeaderHeight : contentPadding;
                    $header.css({
                        height: origHeaderHeight,
                        width: origHeaderWidth,
                        transform: 'translate3d(' + origHeaderRect.left + 'px,' + origHeaderOffsetTop + 'px,0)'
                    });

                    // Set positioning for placeholder
                    placeholder.css({
                        height: windowHeight,
                        width: windowWidth,
                        transform: 'translate3d(' + Math.round(offsetLeft) + 'px, ' + (Math.round(offsetTop)) + 'px, 0)',
                    });

                    // add active class
                    origin.addClass('active');
                    if (origin.css('position') !== 'absolute') {
                        origin.css({
                            position: 'relative'
                        });
                    }

                    // Set states
                    overlayActive = true;
                    doneAnimating = false;

                    // Add overlay
                    var overlay = $('#placeholder-overlay');
                    if (!overlay.length) {
                        overlay = $('<div id="placeholder-overlay"></div>');
                        placeholder.prepend(overlay);
                    }
                    overlay
                        .off('click.galleryExpand')
                        .on('click.galleryExpand', function () {
                            // returnToOriginal();
                        })
                    if (fillScreen) {
                        overlay
                            .off('mouseenter.galleryExpand')
                            .off('mouseleave.galleryExpand')
                            .on('mouseenter.galleryExpand', function () {
                                $object.addClass('hover');
                            })
                            .on('mouseleave.galleryExpand', function () {
                                $object.removeClass('hover');
                            });
                    }
                    setTimeout(function () {
                        overlay.addClass('visible');
                    }, 0);

                    // Add Navbar
                    var navbar = $('<nav id="placeholder-navbar"></nav>');
                    var navWrapper = $('<div class="nav-wrapper"></div>');
                    var container = $('<div class="container"></div>');
                    var backBtn = $('<button class="back-btn"><i class="material-icons">arrow_back</i><span>Back</span></button>');
                    var originalNavColor = 'transparent';
                    if ($('nav').length) {
                        originalNavColor = $('nav').css('background-color');
                        $('nav').addClass('fadeOut');
                    }
                    navbar.css({'background-color': 'transparent'});
                    container.append(backBtn);
                    navWrapper.append(container);
                    navbar.append(navWrapper);
                    placeholder.prepend(navbar);
                    backBtn.click(function () {
                        returnToOriginal();
                    });

                    primaryColor = primaryColor || options.defaultColor;

                    // Style overlay and gradient
                    overlay.css({
                        backgroundColor: primaryColor
                    });
                    if (fillScreen && gradient.length) {
                        gradient.css({
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, ' + primaryColor + ' 100%)'
                        });
                    }


                    /*****************************************
                     * Actual transformations and animations *
                     *****************************************/

                    // Animate object
                    var moveTo;
                    if ($object.toArray()[0].tagName.toUpperCase() === "VIDEO") {
                        moveTo = 0;
                       // console.log($object.toArray()[0].tagName.toUpperCase());
                    } else {
                        moveTo = Math.round(windowHeight/2);
                    }


                    var objectCssObject = {};

                    objectCssObject.width = windowWidth;
                    objectCssObject.height = 'auto';
                    objectCssObject.transform = 'translate3d(' + 0 + 'px, ' + moveTo + 'px, 0)';
                    objectCssObject.transition = 'transform ' + (outDuration / 1000) + 's, width ' + (outDuration / 1000) + 's, height ' + (inDuration / 1000) + 's';
                    objectCssObject['-webkit-transition'] = '-webkit-transform ' + (outDuration / 1000) + 's, width ' + (outDuration / 1000) + 's, height ' + (inDuration / 1000) + 's';


                    $object.css(objectCssObject);

                    // Reset gradient.
                    gradient.css({background: ''});


                    $object.css(objectCssObject);


                    // Animate header into card

                    $header.children().css('opacity', 0);

                    var transformHeader = function () {

                        $header.css({
                            opacity: '0',
                            transition: 'opacity' + outDuration,
                        });
                    };
                    transformHeader();


                    // Set throttled window resize calculations.
                    modalResizer = Materialize.throttle(function () {
                        recalculateVars();
                    }, 150);

                    $(window).resize(modalResizer);

                    animationTimeout = setTimeout(function () {

                        var setStaticState = function () {
                            // Save animationEndState
                            animationEndState = placeholder.clone(true);
                            var setTop;
                            if ($object.toArray()[0].tagName.toUpperCase() === "AUDIO") {
                                setTop = 32;
                            } else {
                                setTop = 0;
                            }
                            // Static placeholder.
                            placeholder.css({
                                transform: '',
                                position: 'fixed',
                                width: '100%',
                                height: '100%',
                                top: 0,
                                left: 0,
                                overflow: 'auto'
                            });

                            // Swap scrollbars if needed
                            if (bodyScrolls) {
                                $('body').css('overflow', 'hidden');
                                placeholder.css('overflowY', 'scroll');
                            }

                            // Enable scrolling
                            $('body').off('scroll.disable-scroll mousewheel.disable-scroll touchmove.disable-scroll');

                            // Static object.

                            if ($object.toArray()[0].tagName.toUpperCase() === "VIDEO") {
                                $object.css({
                                    width: '100%',
                                    height: '100%',
                                    transform: '',
                                    transition: ''
                                });
                            } else {
                                $object.css({
                                    width: '100%',
                                    height: '50%',
                                    transform: '',
                                    transition: ''
                                });
                            }


                            $object.addClass('static');
                            if ($object.toArray()[0].tagName.toUpperCase() === "VIDEO") {
                                $object.prop('controls', true);
                            }
                            // Static header.
                            $header.hide();
                        };


                        setStaticState();


                        // Callback animation. Reveal content
                        doneAnimating = true;
                        returnClickable = true;

                        // Execute callback
                        if (typeof(options.onShow) === "function") {
                            options.onShow.call(this, origin);
                        }

                    }, inDuration);

                });


                // Return on ESC
                $(document).keyup(function (e) {
                    if (e.keyCode === 27) {   // ESC key
                        if (overlayActive) {
                            returnToOriginal();
                        }
                    }
                });


                // This function returns the modaled image to the original spot
                function returnToOriginal() {
                    // Only Call Once
                    if (!returnClickable) {
                        return;
                    }

                    returnClickable = false;

                    // Clear hash
                    if (dynamicRouting) {
                        window.location.hash = '!';
                    }

                    // Cancel timeout.
                    var cancelledTimeout = !doneAnimating;
                    window.clearTimeout(animationTimeout);
                    animationTimeout = null;
                    doneAnimating = true;
                    offsetLeft = undefined;

                    var overlay = $('#placeholder-overlay').first();

                    // Use animationEndState to reset to animationEndState.
                    placeholder.scrollTop(0);
                    placeholder.attr('style', animationEndState.attr('style'));
                    $object
                        .css('left', animationEndState.find('.gallery-cover').css('left'))
                        .removeClass('static hover');
                    resetSelectors();

                    // Reset scrollbars
                    $('body').css('overflow', '');
                    placeholder.css('overflowY', '');

                    // Set overlay pre animation state.
                    overlay.css({
                        transition: 'none',
                        opacity: 0.9
                    });

                    // Show header.
                    $header.show();

                    setTimeout(function () {

                        // Off resize event.
                        $(window).off('resize', modalResizer);

                        // Fade out child elements
                        origin.find('.gallery-body').css('display', 'none');

                        // Reset navbar
                        $('nav').removeClass('fadeOut');
                        $('#placeholder-navbar').fadeOut(outDuration, 'easeInQuad', function () {
                            $(this).remove();
                        });

                        // Remove Overlay
                        overlayActive = false;

                        overlay.fadeOut(outDuration, 'easeInQuad', function () {
                            $(this).remove();
                        });

                        if (!cancelledTimeout) {
                            // Resize
                            origin.css({
                                width: origContainerWidth,
                                height: origContainerHeight,
                                transform: 'translate3d(0,0,0)',
                                transition: 'transform ' + (outDuration / 1000) + 's ' + bezierCurve,
                                '-webkit-transition': '-webkit-transform ' + (outDuration / 1000) + 's ' + bezierCurve
                            });

                            // Return object
                            var objectCssObject = {};


                            objectCssObject.width = origObjectWidth;
                            objectCssObject.height = origObjectHeight;
                            objectCssObject.transform = 'translate3d(' + origObjectRect.left + 'px, ' + origObjectRect.top + 'px, 0)';
                            objectCssObject.transition = 'transform ' + (outDuration / 1000) + 's, width ' + (outDuration / 1000) + 's, height ' + (outDuration / 1000) + 's';
                            objectCssObject['-webkit-transition'] = '-webkit-transform ' + (outDuration / 1000) + 's, width ' + (outDuration / 1000) + 's, height ' + (outDuration / 1000) + 's';


                            // Reset gradient.
                            gradient.css({background: ''});


                            $object.css(objectCssObject);

                            if ($object.toArray()[0].tagName.toUpperCase() === "VIDEO") {
                                $object.prop('controls', false);
                            }

                            // Return header
                            $header.css({
                                opacity: '1',
                                top: origObjectRect.top - origObjectHeight,
                                transform: 'translate3d(' + origHeaderRect.left + 'px,' + origHeaderRect.top + 'px,0)',
                                transition: 'transform' + (outDuration / 1000),

                            });

                        }

                        animationTimeout = setTimeout(function () {
                            placeholder.removeAttr('style');
                            origin.css({
                                width: '',
                                height: '',
                                overflow: '',
                                'z-index': '',
                                transform: '',
                                transition: '',
                                '-webkit-transition': ''
                            });
                            $object.removeAttr('style').attr('style', objectInlineStyles);
                            $header.removeAttr('style');
                            $header.children().removeAttr('style');

                            // Remove active class
                            origin.removeClass('active');

                            // Enable origin to be clickable once return animation finishes.
                            originClickable = true;

                            // Layout masonry
                            if (!!$('.gallery').data('masonry')) {
                                $('.gallery').masonry('layout');
                            }

                        }, outDuration);

                    }, 0);

                }


                // If correct URL param, open corresponding gallery
                if (dynamicRouting &&
                    urlObjectId === objectId) {
                    origin.trigger('click.galleryExpand');
                }
            });


        },
        // Custom methods.
        open: function () {
            $(this).trigger('click.galleryExpand');
        },
        close: function () {
            var overlay = $('#placeholder-overlay');
            if (overlay.length) {
                overlay.trigger('click.galleryExpand');
            }
        },
    };


    $.fn.galleryExpand = function (methodOrOptions) {
        if (methods[methodOrOptions]) {
            return methods[methodOrOptions].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
            // Default to "init"
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + methodOrOptions + ' does not exist on jQuery.galleryExpand');
        }
    }; // Plugin end
}(jQuery));
