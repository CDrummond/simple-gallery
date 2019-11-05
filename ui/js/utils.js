/**
 * Gallery WebApp
 * Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
 * Licensed under the MIT license.
 */

const IS_MOBILE  = /Android|webOS|iPhone|iPad|BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);

var bus = new Vue();

function download(url, name) {
    var element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', name);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function setScrollTop(el, val) {
    // When using RecycleScroller we need to wait for the next animation frame to scroll, so
    // just do this for all scrolls.
    window.requestAnimationFrame(function () {
        // https://popmotion.io/blog/20170704-manually-set-scroll-while-ios-momentum-scroll-bounces/
        el.style['-webkit-overflow-scrolling'] = 'auto';
        el.scrollTop=val>0 ? val : 0;
        el.style['-webkit-overflow-scrolling'] = 'touch';
    });
}

function fixPath(path) {
    return path.startsWith('/') ? path : ('/'+path);
}

