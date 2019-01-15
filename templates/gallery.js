/*
  Gallery WebApp
  Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
  Licensed under the MIT license.
*/

'use strict';

var htmlEntityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
};

const THIS_DAY = 'This Day';
const ALL = 'All';
const STARRED = 'Starred';
const HOME = 'Home';
const STARRED_HASH="(Starred)";

function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
        return htmlEntityMap[s];
    });
}

function escapeQuotes(string) {
    return String(string).replace(/["']/g, function (s) {
        return '\\'+s;
    });
}

var path = [];

window.onload = function() {
    if (undefined!==window.location.hash && window.location.hash != '#undefined') {
        navigateTo(window.location.hash);
    } else {
        showRoot();
    }
};

/* Allow history navigation by using URL hash to store position */
var currentHash = '';
window.onhashchange = function() {
    if (currentHash!==window.location.hash && undefined!==window.location.hash && window.location.hash != '#undefined') {
        navigateTo(window.location.hash);
    }
    currentHash = window.location.hash;
}

function navigateTo(hash) {
    var parts = hash.split('/');
    if (''==parts[0]|| undefined===parts[0]) {
       showRoot();
    } else if ('#'==parts[0]) {
        if (''===parts[1] || undefined===parts[1]) {
            showRoot();
        } else {
            parts.shift();
            browseFolder(parts.join('/'), decodeURI(parts[parts.length-1]), undefined, true);
        }
    }
}

function setHash(hash) {
    currentHash=hash;
    window.location.hash=hash;
}

function clear(elem) {
    while (elem.firstChild) {
        elem.removeChild(elem.firstChild);
    }
}

function unveil() {
    $("img").unveil();

    $('video').off('play').on('play', function() {
        var dd = this.id
        $('video').each(function( index ) {
            if(dd != this.id){
                this.pause();
                this.currentTime = 0;
            }
        });
    });
}

function isMobile() {
    return navigator.userAgent.indexOf("Mobile") !== -1 ||
           navigator.userAgent.indexOf("iPhone") !== -1 ||
           navigator.userAgent.indexOf("Android") !== -1 ||
           navigator.userAgent.indexOf("Windows Phone") !== -1;
}

var currentIndex = undefined;
var starred = new Set();

function toggleStar() {
    var star = $('#star-icon');
    var image = $('#imageGallery')[0].childNodes[currentIndex];
    var url = image.attributes['star-url'].nodeValue;
    var filename = url.substring(url.lastIndexOf('/')+1);
    if (undefined==starred[filename]) {
        starred[filename]={url: url, name: image.attributes['data-sub-html'].nodeValue};
        star[0].innerHTML = "<b>&#x2605;</b>";
    } else {
        starred[url]=undefined;
        star[0].innerHTML = "<b>&#9734;</b>";
    }
}

function setStar() {
    var star = $('#star-icon');
    if (undefined==star[0]) {
        $('.lg-toolbar').append('<a class=\"lg-icon star-icon\" href=\"javascript:toggleStar()\" id=\"star-icon\"></a>');
        star = $('#star-icon');
    }
    var url = $('#imageGallery')[0].childNodes[currentIndex].attributes['data-download-url'].nodeValue
    var filename = url.substring(url.lastIndexOf('/')+1);
    if (undefined==starred[filename]) {
        star[0].innerHTML = "<b>&#9734;</b>";
    } else {
        star[0].innerHTML = "<b>&#x2605;</b>";
    }
}

function setContent(content) {
    var div=document.getElementById('content');
    clear(div);
    div.innerHTML=content;

    var imageGallery = $('#imageGallery');

    if (undefined!==imageGallery) {
        imageGallery.lightGallery({
            selector: '.gallery-item',
            pager: true,
            thumbnail: false,
            controls: !isMobile(),
            autoplayFirstVideo: false,
            videojs: true
        });
        var data = imageGallery.data('lightGallery');

        imageGallery.on('onAferAppendSlide.lg', function (event, index) {
            var classToAdd = data.$items.eq(index).attr('image');
            data.$slide.eq(index).find('.lg-').addClass(classToAdd);
        });

        imageGallery.on('onSlideItemLoad.lg', function (event, index) {
            currentIndex = index;
            setStar();
        });

        imageGallery.on('onAfterSlide.lg', function (event, prevIndex, index, fromTouch, fromThumb) {
            currentIndex = index;
            setStar();
        });
    }

    window.scrollTo(0, 0);
    // Call unveil after timeout. Firefox sometmes seems to just show placeholder...
    window.setTimeout(unveil, 5);
}

function showRoot() {
    path = [];
    var div=document.getElementById('content');
    clear(div);
    browseFolder(undefined, HOME);
}

function httpGet(url, handler, hash) {
    var req = new XMLHttpRequest();
    document.getElementById("spinner").style.display = "inline";
    req.onreadystatechange = function() {
        if (4==req.readyState) {
            if (200==req.status) {
                handler(JSON.parse(req.responseText), hash, url);
            }
            document.getElementById("spinner").style.display = "none";
        }
    }
    req.open("GET", url, true);
    req.send(null);
}

function addSlash(path) {
    if (undefined===path) {
        return '/';
    } else if (!path.startsWith('/')) {
        return '/'+path;
    }
    return path;
}

function pathHtml(clickCallback, lastName) {
    var html = "";
    if (undefined!==path && path.length>1) {
        var len = path.length;
        html = "<ul id=\"breadcrumb\">";
        for (var i=0; i<len; ++i) {
            if (i===len-1) {
                html+="<li><a>"+escapeHtml(undefined!==lastName ? lastName : path[i].name)+"</a></li>";
            } else {
                html+="<li><a onclick=\""+clickCallback+"('"+escapeQuotes(path[i].url)+"','"+escapeQuotes(path[i].name)+"',"+i+")\">"+escapeHtml(path[i].name)+"</a></li>";
            }
        }
        html+="</ul>";
    }
    return html;
}

function dirsHtml(dirs, url) {
    var html = "";
    var len = dirs.length;
    
    if (url=='/api/browse/') {
        html+="<div class=\"title\">Photo Gallery</div>";
    }
    
    html+= "<div class\=section\" style=\"clear:both\"><div class=\"folder-grid";
    if (((window.innerWidth-16)/150)>=(len*1.2)) {
        html+=" folder-grid-few";
    }
    html+="\">";
    
    for (var i=0; i<len; ++i) {
        html+="<div onclick=\"browseFolder('"+escapeQuotes(dirs[i].url)+"','"+escapeQuotes(dirs[i].name)+"')\">";
        html+="<img src=\"images/placeholder.png\" data-src=\"/api/thumb/"+dirs[i].thumb+"\"></img><div class=\"folder-grid-text\">"+escapeHtml(dirs[i].name)+"</div></div>";
    }
    html+="</div>"
    if (url!='/api/browse/') {
        html+="<div class=\"browse-button\" onclick=\"browseFolder('"+url.replace('/api/browse/', '/')+"?filter=all','"+ALL+"')\">Show All</div>";
    } else {
        html+="<div class=\"browse-button\" onclick=\"browseFolder('/?filter=today','"+THIS_DAY+"')\">"+THIS_DAY+"</div>";
    }
    if (Object.keys(starred).length>0) {
        html+="<div class=\"browse-button\" onclick=\"showStarred()\">"+STARRED+"</div>";
    }
    html+="</div>";
    return html;
}

var serverRootPath = undefined;

function rootPath() {
    if (undefined===serverRootPath) {
        serverRootPath = "{{SERVER_ROOT}}";
        serverRootPath = serverRootPath.replace("0.0.0.0", window.location.hostname);
    }
    return serverRootPath;
}

function imagesHtml(images, url) {
    var isToday = url=="/api/browse/?filter=today";
    var len = images.length;
    var videos = 0;
    var html = "";
    for (var i=0; i<len; ++i) {
        if (images[i].video) {
            html+="<div style=\"display:none;\" id=\"video"+i+"\">";
            html+="<video class=\"lg-video-object lg-html5 video-js vjs-default-skin\" controls preload=\"none\"><source src=\""+rootPath()+addSlash(images[i].url)+"\" type=\"video/mp4\">";
            html+="<track kind=\"subtitles\" src=\""+rootPath()+addSlash(images[i].url.split('.').slice(0, -1).join('.'))+".vtt\" label=\"Subtitles\" default></track>";
            html+="</video></div>";
            videos++;
        }
    }

    var photos = len-videos;
    html += "<p class=\"header\">";
    if (photos>0) {
        html+="Photos: "+photos;
    }
    if (videos>0) {
        if (photos>0) {
            html+=", ";
        }
        html+="Videos: "+videos;
    }
    var lastYear = "0000";

    html+="</p><div class=\"section\"><div id=\"imageGallery\" class=\"image-grid";
    if (((window.innerWidth-16)/120)>=(len*1.2)) {
        html+=" image-grid-few";
    }
    html+="\">";
    for (var i=0; i<len; ++i) {
        if (isToday) {
            var year = images[i].year;
            if (year && lastYear!=year) {
                html+="<div class=\"image-grid-year\">"+year+"</div>";
                lastYear = year;
            }
        }
        if (images[i].video) {
            html+="<div  class=\"gallery-item video-container\" data-poster=\"/api/scaled"+addSlash(images[i].url)+"\" data-sub-html=\""+escapeQuotes(images[i].name)+"\" data-html=\"#video"+i+"\" star-url=\""+images[i].url+"\">";
            html+="<img data-html=\"#video"+i+"\" class=\"image-grid-thumb\" src=\"images/placeholder.png\" data-src=\"/api/thumb"+addSlash(images[i].url)+"\"/>";
            html+="<img class=\"video-overlay\" src=\"images/video-overlay.png\"/>";
            html+="</div>";
        } else {
            html+="<div class=\"gallery-item\" data-download-url=\""+rootPath()+addSlash(images[i].url)+"\" data-src=\"/api/scaled"+addSlash(images[i].url)+"\" data-sub-html=\""+escapeQuotes(images[i].name)+"\" star-url=\""+images[i].url+"\"><a href=\"\">";
            html+="<img class=\"image-grid-thumb\" src=\"images/placeholder.png\" data-src=\"/api/thumb"+addSlash(images[i].url)+"\"/></a></div>";
        }
    }
    html+="</div>";
    
    return html;
}

function showStarred() {
    var images = [];
    Object.keys(starred).sort().forEach(function(key) {
        images.push(starred[key]);
    });
    var html = "<ul id=\"breadcrumb\"><li><a onclick=\"browseFolder('/','"+HOME+"',9)\">"+HOME+"</a></li>"+
               "<li><a>"+STARRED+"</a></i></ul>";
    html+=imagesHtml(images, undefined);
    setContent(html);
    setHash("#"+STARRED_HASH);
}

function browseResponseHandler(resp, hash, url) {
    var html=pathHtml('browseFolder');
    if (undefined!==resp.dirs && resp.dirs.length>0) {
        html+=dirsHtml(resp.dirs, url);
    }
    if (undefined!==resp.images && resp.images.length>0) {
        html+=imagesHtml(resp.images, url);
    }
    setContent(html);
    setHash(hash);
}

function setPath(folder, name, level, setFullPath) {
    // setFullPath is ONLY set to true if location hash is chaged in BROWSE mode
    if (undefined!==setFullPath && setFullPath) {
        path=[];
        var parts = folder.split('/');
        for (var i=0; i<parts.length; ++i) {
            var url = parts.slice(0, i+1).join('/');
            var partName = decodeURI(parts[i]);
            var allUrl = undefined;
            if (undefined==url || 0==url.length) {
                url='/';
            }
            if (undefined==partName || 0==partName.length) {
                partName='Home';
            } else if (partName.endsWith("?filter=all")) {
                allUrl = url;
                url = url.replace("?filter=all", "");
                partName = partName.replace("?filter=all", "");
            } else if (partName == "?filter=today") {
                partName = THIS_DAY;
            }
            path.push({name: partName, url: url });
            if (allUrl) {
                path.push({name: ALL, url: allUrl });
            }
        }
        return;
    }

    if ('/'===folder || 0===folder) {
        path=[];
    }
    // If level is set, then user has clicked on breadcrumb bar, and we need to remove entries from path
    if (undefined!==level && level<path.length) {
        for (var i=path.length-1; i>level; --i) {
            path.pop();
        }
    } else {
        path.push({name: name, url: folder });
    }
}

function browseFolder(folder, name, level, setFullPath) {
    folder=addSlash(folder);
    setPath(folder, name, level, setFullPath);
    httpGet('/api/browse'+folder, browseResponseHandler, '#'+folder);
}

