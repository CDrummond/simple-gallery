/**
 * Gallery WebApp
 * Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
 * Licensed under the MIT license.
 */

const SLIDESHOW_DELAY = 5000;

const GRID_SIZES = [ {sz:133, clz:"image-grid-a"},
                     {sz:138, clz:"image-grid-b"},
                     {sz:143, clz:"image-grid-c"},
                     {sz:148, clz:"image-grid-d"},
                     {sz:153, clz:"image-grid-e"},
                     {sz:158, clz:"image-grid-f"},
                     {sz:163, clz:"image-grid-g"},
                     {sz:168, clz:"image-grid-h"},
                     {sz:173, clz:"image-grid-i"},
                     {sz:178, clz:"image-grid-j"},
                     {sz:183, clz:"image-grid-k"},
                     {sz:188, clz:"image-grid-l"},
                     {sz:193, clz:"image-grid-m"},
                     {sz:198, clz:"image-grid-n"},
                     {sz:203, clz:"image-grid-o"},
                     {sz:208, clz:"image-grid-p"}];
var view;

Vue.component('gallery-view', {
    template: `
<div>
 <div class="image-grid" style="overflow:auto;" id="imageGrid">
  <RecycleScroller :items="grid.rows" :item-size="GRID_SIZES[grid.size].sz" page-mode key-field="id">
   <table slot-scope="{item, index}" :class="[grid.few ? '' : 'full-width', GRID_SIZES[grid.size].clz]">
    <td align="center" style="vertical-align: top" v-for="(idx, cidx) in item.indexes"><v-card flat align="left" class="image-grid-item">
     <div v-if="idx>=items.length" class="image-grid-item"></div>
     <div v-else class="image-grid-item" v-bind:class="{'image-grid-item-few': grid.few}" @click="click(items[idx], idx, $event)" :title="items[idx].name">
      <img class="image-grid-item-img" :key="items[idx].image" :src="'/api/thumb'+items[idx].image"></img>
      <div class="image-grid-text" v-if="items[idx].isfolder">{{items[idx].name}}</div>
      <div class="image-grid-video-overlay" v-else-if="items[idx].isvideo"></div>
     </div>
    </v-card></td>
   </table>
  </RecycleScroller>
 </div>
 <v-progress-circular class="load-progress" v-if="fetchingItems" color="primary" size=72 width=6 indeterminate></v-progress-circular>
</div>
      `,
    data() {
        return {
            items: [],
            fetchingItems: false,
            grid: {numColumns:0, size:GRID_SIZES.length-1, rows:[], few:false}
        }
    },
    created() {
        view = this;
        this.slideshow = { running:false, once:false, timer:undefined, playPause:undefined, download:undefined, star:undefined};
        this.history = [];
        this.starred = new Map();

        bus.$on('setLevel', function(level) {
            this.goTo(level);
        }.bind(this));
        bus.$on('browse', function(type) {
            if ('thisday'==type) {
                this.fetchItems('/?filter=today', 'This day');
            } else if ('starred'==type) {
                this.history.push({path:this.path, name:this.name, items:this.items, pos:this.imageGridElement.scrollTop});
                this.name='Starred';
                bus.$emit('updateHistory', this.name, this.history);
                this.items=[];
                for (var [key, value] of this.starred) {
                    this.items.push(value);
                }
                this.items.sort(function(a, b) { return a.sort<b.sort ? -1 : 1 });
                this.grid = {numColumns:0, size:GRID_SIZES.length-1, rows:[], few:false};
                this.layoutGrid();
                this.$nextTick(function () {
                    setScrollTop(this.imageGridElement, 0);
                });
            }
        }.bind(this));
        bus.$on('windowWidthChanged', function() {
            this.layoutGrid();
        }.bind(this));
    },
    mounted() {
        this.imageGridElement = document.getElementById("imageGrid");
        this.goTo(-1);
    },
    methods: {
        goTo(level) {
            if (level<0) { // -1 == go home
                this.history = [];
                this.fetchItems('/', 'Home');
            } else if (level<this.history.length) {
                var prev = undefined;
                while (this.history.length>level) {
                    prev = this.history.pop();
                }

                this.items = prev.items;
                this.name = prev.name;
                this.path = prev.path;
                bus.$emit('updateHistory', this.name, this.history);
                this.layoutGrid();
                this.$nextTick(function () {
                    setScrollTop(this.imageGridElement, prev.pos);
                });
            }
        },
        fetchItems(path, name) {
            this.fetchingItems = true;
            // TODO: Canceling??
            axios.get('/api/browse'+fixPath(path)+(path.indexOf('?')>0 ? '&' : '?')+'x=time'+(new Date().getTime())).then((resp) => {
                if (path.length>1) { // Don't store history of initiaql state!
                    this.history.push({path:this.path, name:this.name, items:this.items, pos:this.imageGridElement.scrollTop});
                }
                bus.$emit('updateHistory', name, this.history);
                this.fetchingItems = false;
                this.items=[];
                this.path=path;
                this.name=name;

                if (resp && resp.data) {
                    if (resp.data.dirs) {
                        for (var i=0, len=resp.data.dirs.length; i<len; ++i) {
                            this.items.push({path:fixPath(resp.data.dirs[i].url),
                                             sort:resp.data.dirs[i].sort,
                                             name:resp.data.dirs[i].name,
                                             image:fixPath(resp.data.dirs[i].thumb),
                                             isfolder:true});
                        }
                    }
                    if (resp.data.images) {
                        for (var i=0, len=resp.data.images.length; i<len; ++i) {
                            this.items.push({sort:resp.data.images[i].sort,
                                             name:resp.data.images[i].name, 
                                             image:fixPath(resp.data.images[i].url),
                                             isvideo:resp.data.images[i].video});
                        }
                    }
                }
                this.items.sort(function(a, b) { return a.sort<b.sort ? -1 : 1 });
                this.grid = {numColumns:0, size:GRID_SIZES.length-1, rows:[], few:false};
                this.layoutGrid();
                this.$nextTick(function () {
                    setScrollTop(this.imageGridElement, 0);
                });
            }).catch(err => {
                this.fetchingItems = false;
                bus.$emit('showError', 'Failed to obtain photo list');
            });
        },
        click(item, index, event) {
            if (item.isfolder) {
                if (this.fetchingItems) {
                    return;
                }
                this.fetchItems(item.path, item.name);
            } else {
                this.startSlideShow(item, index, event);
            }
        },
        startSlideShow(item, index, event) {
            this.slideshow.running=false;
            this.slideshow.once=false;
            if (!this.slideshow.playPause) {
                this.playPause = document.getElementById("pswpPlayPause");
                this.playPause.addEventListener("click", function() {
                    view.slideshow.running=!view.slideshow.running;
                    view.setSlideShowState();
                });
            }
            if (!this.slideshow.download) {
                this.download = document.getElementById("pswpDownload");
                this.download.addEventListener("click", function() {
                    var idx = view.gallery.getCurrentIndex();
                    var url = view.items[idx].image; // TODO! Actual path
                    var name = url.substring(url.lastIndexOf('/')+1);
                    download(url, name);
                });
            }

            if (!this.slideshow.star) {
                this.star = document.getElementById("pswpStar");
                this.star.addEventListener("click", function() {
                    view.toggleStarred();
                });
            }
            this.setSlideShowState();
            var images = [];
            for (var i=0; i<this.items.length; ++i) {
                images.push({src:'/api/scaled'+this.items[i].image, title:this.items[i].name, w:0, h:0});
            }
            this.gallery = new PhotoSwipe(document.querySelectorAll('.pswp')[0], PhotoSwipeUI_Default, images, {index: index});
            this.gallery.listen('gettingData', function (index, item) {
                if (item.w < 1 || item.h < 1) {
                    var img = new Image();
                    img.onload = function () {
                        item.w = this.width;
                        item.h = this.height;
                        view.gallery.updateSize(true);
                    };
                    img.src = item.src;
                }
            });
            this.gallery.listen('afterChange', function () {
                if (view.slideshow.running && view.slideshow.once) {
                    view.slideshow.once = false;
                    view.setSlideShowTimeout();
                }
                view.setStaredState();
            });
            this.gallery.listen('destroy', function () {
                view.gallery = undefined;
                view.slideshow.running=false;
                view.setSlideShowTimeout();
            });
            this.gallery.init();
        },
        toggleStarred() {
            var idx = view.gallery.getCurrentIndex();
            var url = view.items[idx].image;
            if (this.starred.has(url)) {
                this.starred.delete(url);
            } else {
                this.starred.set(url, view.items[idx]);
            }
            this.setStaredState();
            bus.$emit('haveStarred', this.starred.size>0);
        },
        setStaredState() {
            var idx = view.gallery.getCurrentIndex();
            var url = view.items[idx].image;
            var starred = this.starred.has(url);
            this.star.classList.remove(starred ? "unstarred" : "starred");
            this.star.classList.add(starred ? "starred" : "unstarred");
            this.star.title=starred ? "Un-star" : "Star";
        },
        setSlideShowState() {
            this.setSlideShowTimeout();
            this.playPause.classList.remove(this.slideshow.running ? "play" : "pause");
            this.playPause.classList.add(this.slideshow.running ? "pause" : "play");
            this.playPause.title=this.slideshow.running ? "Pause slideshow" : "Start slideshow";
        },
        setSlideShowTimeout() {
            if (this.slideshow.timer) {
                clearTimeout(this.slideshow.timer);
            }
            if (this.slideshow.running) {
                this.slideshow.timer = setTimeout(function () {
                    view.slideshow.timer = undefined;
                    if (view.slideshow.running && !!view.gallery) {
                        view.slideshow.once = true;
                        view.gallery.next();
                    }
                }, SLIDESHOW_DELAY);
            }
        },
        layoutGrid() {
            const ITEM_BORDER = 8;
            const VIEW_RIGHT_PADDING = 4;
            var changed = false;
            var listWidth = window.innerWidth - ((/*scrollbar*/ IS_MOBILE ? 0 : 20) + VIEW_RIGHT_PADDING);

            // Calculate what grid item size we should use...
            var size = 0;
            for (var i=1; i<GRID_SIZES.length && listWidth>((GRID_SIZES[i].sz+ITEM_BORDER)*2); ++i) {
                size = i;
            }

            // How many columns?
            var numColumns = Math.min(Math.floor(listWidth/(GRID_SIZES[size].sz+ITEM_BORDER)), this.items.length);
            if (numColumns != this.grid.numColumns) { // Need to re-layout...
                changed = true;
                this.grid.rows=[];
                for (var i=0; i<this.items.length; i+=numColumns) {
                    var indexes=[]
                    for (var j=0; j<numColumns; ++j) {
                        indexes.push(i+j);
                    }
                    this.grid.rows.push({id:"row."+i+"."+numColumns, indexes:indexes});
                }
                this.grid.numColumns = numColumns;
            }
            if (this.grid.size != size) {
                this.grid.size = size;
                changed = true;
            }
            var few = 1==this.grid.rows.length && (1==this.items.length || ((this.items.length*GRID_SIZES[size].sz)*1.20)<listWidth);
            if (this.grid.few != few) {
                this.grid.few = few;
                changed = true;
            }
            if (changed) {
                this.$forceUpdate();
            }
        }
    }
});
