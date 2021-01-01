/**
 * Gallery WebApp
 * Copyright 2019-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * Licensed under the MIT license.
 */

const IS_MOBILE = /Android|webOS|iPhone|iPad|BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);

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

function copyTextToClipboard(text) {
    if (navigator.clipboard) {
        try{
            navigator.clipboard.writeText(text);
            return;
        } catch (err) {
        }
    }
    var textArea = document.createElement("textarea");
    textArea.setAttribute('readonly', true);
    textArea.setAttribute('contenteditable', true);
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = 0;
    textArea.style.left = 0;
    textArea.style.position = 'fixed';
    textArea.style.width = '1px';
    textArea.style.height = '1px';
    textArea.style.padding = 0;
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.select();
    const range = document.createRange();
    range.selectNodeContents(textArea);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    textArea.setSelectionRange(0, textArea.value.length);
    try {
        document.execCommand('copy');
    } catch (err) {
    } finally {
        document.body.removeChild(textArea);
    }
}
