/*
  Gallery WebApp
  Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
  Licensed under the MIT license.
*/

Vue.use(VueLazyload);

var app = new Vue({
    el: '#app',
    data() {
        return { }
    },
    created() {
        // Work-around 100vh behaviour in mobile chrome
        // See https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
        let vh = window.innerHeight * 0.01;
        let lastWinHeight = window.innerHeight;
        let lastWinWidth = window.innerWidth;
        let timeout = undefined;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        window.addEventListener('resize', () => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(function () {
                // Only update if changed
                if (Math.abs(lastWinHeight-window.innerHeight)!=0) {
                    let vh = window.innerHeight * 0.01;
                    document.documentElement.style.setProperty('--vh', `${vh}px`);
                    lastWinHeight = window.innerHeight;
                }
                timeout = undefined;
                if (Math.abs(lastWinWidth-window.innerWidth)>=3) {
                    lastWinWidth = window.innerWidth;
                    bus.$emit('windowWidthChanged');
                }
            }, 50);
        }, false);

        // https://stackoverflow.com/questions/43329654/android-back-button-on-a-progressive-web-application-closes-de-app
        window.addEventListener('load', function() {
            window.history.pushState({ noBackExitsApp: true }, '');
        }, false);

        window.addEventListener('popstate', function(event) {
            if (event.state && event.state.noBackExitsApp) {
                window.history.pushState({ noBackExitsApp: true }, '');
            }
        }, false);
    },
    methods: {
    }
})

