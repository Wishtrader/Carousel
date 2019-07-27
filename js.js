$(function() {

    $('.cierra-carousel').each(function() {
        /*-------------------------------------------------*/
        // ESSENTIAL SETTINGS
        // Speed of carousel (bigger value means slower motion)
        var duration = 7000;
        // time until carousel continues its motion, after it was stopped. Must be >= 0
        var restoreTimeout = 2000;
        // Speed of changing popup content, when popup is already opened
        var popupUpdateDuration = 400;
        /*-------------------------------------------------*/
        var cierra = $(this);
        var markup = cierra.html();
        var cssFocused = 'focused';
        var cssClicked = 'clicked';
        var initialized = false;
        var popupIsShown = false;
        var carouselIdleTimer;
        var windowResizeTimer;

        // reinitialize carousel, when window is resized
        $(window).on('resize.cierra-carousel', function() {
            if (initialized) {
                clearTimeout(windowResizeTimer);
                windowResizeTimer = setTimeout(init, 200);
            }
            initialized = true;
        });

        init();

        function init() {
            cierra.html(markup);

            var carousel = cierra.find('.arsen-carousel');
            var owl = carousel.find('.owl-carousel');
            var popup = $('.cierra-popup');
            var popupBox = popup.find('.popup-container');
            var slidesNumber = owl.children('div').length;
            var slidesToShow = slidesNumber * 2;
            var slideWidth1 = cierra.width();
            var slideWidth2 = cierra.width() / 2;
            var slideWidth3 = cierra.width() / 3;
            var isDragging = false;

            if (popupIsShown) {
                popup.fadeOut();
                popupIsShown = false;
            }

            if (slidesNumber < 4) return;

            var responsiveWidth = parseInt(cierra.css('text-indent'));
            switch (responsiveWidth) {
                case 1260 : carousel.width(slidesNumber * slideWidth3); break; // everything above 1050 will be considered 1260
                case 1050 : carousel.width(slidesNumber * slideWidth2); break; // below 1050px: actual slide width (420) * 2.5
                case 630  : carousel.width(slidesNumber * slideWidth1); break; // below 630px:  actual slide width (420) * 1.5
            }

            carousel.carousel({
                slidesToShow: 1,
                slideMargin: 0,
                endless: true,
                endlessDirection: 'left',
                duration: duration * slidesToShow,
                responsive: false,
                restoreTimeout: restoreTimeout
            });

            owl.owlCarousel({
                items: slidesToShow,
                loop: true,
                dots: false,
                slideTransition: 'linear',
                onDrag: function() {
                    isDragging = true;
                },
                onDragged: function() {
                    setTimeout(function() {
                        isDragging = false;
                    }, 10);
                }
            });

            // calculate, how each image should be scaled
            owl.find('img').each(function(i) {
                var imgWidth  = $(this)[0].naturalWidth;
                var imgHeight = $(this)[0].naturalHeight;
                var parentWidth  = $(this).parent().width();
                var parentHeight = $(this).parent().height();
                // image width, if its height was set to 100% of parent
                var fullHeightImgWidth = parentHeight * imgWidth / imgHeight;
                // image height, if its width was set to 100% of parent
                var fullWidthImgHeight = parentWidth * imgHeight / imgWidth;
                if (fullHeightImgWidth > parentWidth) {
                    $(this).addClass('horizontal');
                } else if (fullWidthImgHeight > parentHeight) {
                    $(this).addClass('vertical');
                }
            });

            // add/remove active class
            owl.find('.item div')
                .mouseenter(function() {
                    owl.find('.' + cssFocused).removeClass(cssFocused);
                    $(this).addClass(cssFocused);
                }).mouseleave(function() {
                    $(this).removeClass(cssFocused);
                });

            // calculate the popup scrollable content height (for mobile devices)
            function calculateScrollableHeight() {
                var height;
                if (responsiveWidth === 1260) {
                    height = '';
                } else {
                    var popupHeader = popup.find(popupBox).filter(':visible').find('header');
                    var otherElements = parseInt(popupHeader.outerHeight(true)) +
                        parseInt(popup.css('padding-top')) +
                        parseInt(popup.css('padding-bottom'));
                    height = popup.innerHeight() - otherElements;
                }
                popup.find('.content').height(height);
            }

            // call a popup
            owl.find('img').click(function() {
                if (popupBox.is(':animated') || isDragging) return;

                var popupIdx = parseInt($(this).attr('data-popup')) - 1;

                // update popup content
                if (popupIsShown) {
                    var oldBox = popupBox.filter(':visible');
                    var newBox = popupBox.eq(popupIdx);

                    if (oldBox.index() === popupIdx) return;

                    // update clicked class
                    owl.find('.' + cssClicked).removeClass(cssClicked);
                    $(this).parent('div').addClass(cssClicked);

                    newBox.show();

                    // get new height
                    var oldHeight = oldBox.height();
                    var newHeight = newBox.height();

                    newBox.css({height: oldHeight, opacity: 0}).animate({height: newHeight, opacity: 1}, popupUpdateDuration, function() {
                        newBox.css({height: '', opacity: ''});
                    });
                    oldBox.css({height: oldHeight, opacity: 1}).animate({height: newHeight, opacity: 0}, popupUpdateDuration, function() {
                        oldBox.css({height: '', opacity: ''}).hide();
                    });
                }
                // show new popup
                else {
                    popupIsShown = true;
                    $(this).parent('div').addClass(cssClicked);
                    popupBox.hide().eq(popupIdx).show();
                    popup.fadeIn();
                    calculateScrollableHeight();
                }
                carouselIdleTimer = setInterval(function() {
                    if (popupIsShown) carousel.mouseenter();
                    else clearInterval(carouselIdleTimer);
                }, restoreTimeout);
            });

            // close the popup
            popup.each(function() {
                var popup = $(this);
                popup.find('.close').click(function() {
                    popupIsShown = false;
                    owl.find('.' + cssClicked).removeClass(cssClicked);
                    popup.fadeOut();
                    carousel.mouseleave();
                });
            });
        }
    });


    $('.calendar').each(function() {
        /*-------------------------------------------------*/
        // ESSENTIAL SETTINGS
        // the width value is taken from CSS and is required for calculations
        var desktopTabMaxWidth = '32%';
        // duration must be the same as in CSS
        var duration = 400; // !!! ANIMATION DURATION !!!
        /*-------------------------------------------------*/
        var calendar = $(this);
        var items = calendar.find('li');
        var cssFirstSelected = '.first-selected';
        var cssLastSelected = '.last-selected';
        var cssWideBox = '.wide-box';
        var cssWideBoxIn = '.inner';
        var cssActive = '.active';
        var cssText = '.text';
        var cssDesktopLayoutBuilt = '.desktop-layout-built';
        var cssTransitionReady = '.transition-ready';
        var wideBox, wideBoxIn, resizeTimer;


        function desktopLayout() {
            if (wideBox && ! wideBox.is(':visible') && ! calendar.is(cssDesktopLayoutBuilt)) {
                // find height of each element
                items.each(function() {
                    var li = $(this);
                    var inner = li.children('.in');
                    li.css('width', desktopTabMaxWidth);
                    inner.height(inner.height());
                    li.css('width', '');
                });
                calendar.addClass(cssDesktopLayoutBuilt.substring(1));
            }
        }


        function mobileVersion(item) {
            var mobDeviceInit = false;

            // add container for mobile version, if needed
            if ( ! calendar.find(cssWideBox).length) {
                calendar.append('<div class="' + cssWideBox.substring(1) + '">\
                    <div class="' + cssWideBoxIn.substring(1) + '" />\
                </div>');
                wideBox = calendar.find(cssWideBox);
                wideBoxIn = wideBox.find(cssWideBoxIn);
                mobDeviceInit = true;
            }

            // css class for styling
            var idx = item.index();
            calendar.removeClass(cssFirstSelected.substring(1) + ' ' + cssLastSelected.substring(1));
            if (idx === 0) {
                calendar.addClass(cssFirstSelected.substring(1));
            } else if (idx === items.length - 1) {
                calendar.addClass(cssLastSelected.substring(1));
            }

            // copy new tab content
            wideBoxIn.append(item.find(cssText).clone());

            if ( ! mobDeviceInit) {
                var oldText = wideBox.find(cssText).filter(':first');
                var newText = wideBox.find(cssText).filter(':last');

                // get new height
                var oldHeight = oldText.height();
                var newHeight = newText.height();

                newText.css({height: oldHeight, opacity: 0}).animate({height: newHeight, opacity: 1}, duration, function() {
                    newText.css({height: '', opacity: ''});
                });
                oldText.css({height: oldHeight, opacity: 1}).animate({height: newHeight, opacity: 0}, duration, function() {
                    oldText.remove();
                });
            }
        }


        // first init for mobile version
        mobileVersion(calendar.find(cssActive));


        items.click(function() {
            if ($(this).is(cssActive) || wideBox.find(cssText).is(':animated')) return;

            // change active class
            $(this).addClass(cssActive.substring(1))
                .siblings().removeClass(cssActive.substring(1));

            // this will make mob version synchronized if we are on desktop
            // and do all animations if we are on mobile
            mobileVersion($(this));
        });


        // if window is resized, we should disable all CSS animations,
        // so that the layout was updated instantly
        $(window).on('resize.calendar', function() {
            calendar.removeClass(cssTransitionReady.substring(1));
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                desktopLayout();
                setTimeout(function() {
                    calendar.addClass(cssTransitionReady.substring(1));
                }, 10);
            }, 200);
        }).resize();
    });

});