/**
 * Gallery WebApp
 * Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
 * Licensed under the MIT license.
 */

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

const THIS_DAY_ACTION = {id:'act:thisday', title:'Show photos from this day', icon:'schedule'};
const STARRED_ACTION  = {id:'act:stared', title:'Show starred photos', icon:'star'};
const SHOW_ALL_ACTION = {id:'act:showall', title:'Show all photos', icon:'filter' };

var view;

window.HELP_IMPROVE_VIDEOJS = false;

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
        this.history = [];
        this.starred = new Map();

        bus.$on('setLevel', function(level) {
            this.goTo(level);
        }.bind(this));
        bus.$on('action', function(id) {
            if (THIS_DAY_ACTION.id==id) {
                this.fetchItems('/?filter=today', 'This day');
            } else if (STARRED_ACTION.id==id) {
                this.history.push({path:this.path, name:this.name, items:this.items, pos:this.imageGridElement.scrollTop});
                this.showStarredItems();
            } else if (SHOW_ALL_ACTION.id==id) {
                this.fetchItems(this.path+'?filter=all', this.name+' (All)');
            }
        }.bind(this));
        bus.$on('windowWidthChanged', function() {
            this.layoutGrid();
        }.bind(this));

        this.serverRoot = "";
        axios.get('/api/config?x=time'+(new Date().getTime())).then((resp) => {
            if (resp && resp.data && resp.data.serverRoot) {
                this.serverRoot = resp.data.serverRoot.replace("0.0.0.0", window.location.hostname);
            }
        });
        var starred = window.localStorage.getItem("starred");
        if (starred) {
            starred = JSON.parse(starred);
            for (var i=0, len=starred.length; i<len; ++i) {
                this.starred.set(starred[i].image, starred[i]);
            }
        }
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
                this.updateToolbar();
                this.layoutGrid();
                this.$nextTick(function () {
                    setScrollTop(this.imageGridElement, prev.pos);
                });
            }
        },
        updateToolbar() {
            var actions = [];
            if (this.path.length>1) {
                if (this.items.length>0 && this.items[0].isfolder) {
                    actions.push(SHOW_ALL_ACTION);
                }
            } else {
                if (this.starred.size>0) {
                    actions.push(STARRED_ACTION);
                }
                actions.push(THIS_DAY_ACTION);
            }
            bus.$emit('updateToolbar', this.name, this.setSubtitle(), this.history, actions);
        },
        fetchItems(path, name) {
            this.fetchingItems = true;
            // TODO: Canceling??
            axios.get('/api/browse'+fixPath(path)+(path.indexOf('?')>0 ? '&' : '?')+'x=time'+(new Date().getTime())).then((resp) => {
                if (path.length>1) { // Don't store history of initiaql state!
                    this.history.push({path:this.path, name:this.name, items:this.items, pos:this.imageGridElement.scrollTop});
                }
                this.fetchingItems = false;
                this.items=[];
                this.path=path;
                this.name=name;
                this.subtitle = "";

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
                this.updateToolbar();
                this.layoutGrid();
                this.$nextTick(function () {
                    setScrollTop(this.imageGridElement, 0);
                });
            }).catch(err => {
                this.fetchingItems = false;
                bus.$emit('showError', 'Failed to obtain photo list ('+err+')');
            });
        },
        setSubtitle() {
            if (0==this.items.length) {
                return 'Nothing found';
            }
            var numFolders = 0;
            var numVideos = 0;
            var numPhotos = 0;
            for (var i=0, len=this.items.length; i<len; ++i) {
                if (this.items[i].isfolder) {
                    numFolders++;
                } else if (this.items[i].isvideo) {
                    numVideos++;
                } else {
                    numPhotos++;
                }
            }
            var subtitle="";
            if (numFolders>0) {
                subtitle+=numFolders==1 ? "1 Folder" : (numFolders + " Folders");
            }
            if (numPhotos>0) {
                subtitle+=(subtitle.length>1 ? ", " : "")+(numPhotos==1 ? "1 Photo" : (numPhotos + " Photos"));
            }
            if (numVideos>0) {
                subtitle+=(subtitle.length>1 ? ", " : "")+(numVideos==1 ? "1 Video" : (numVideos + " Videos"));
            }
            return subtitle;
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
            var items=[];
            for (var i=0, len=this.items.length; i<len; ++i) {
                var item=this.items[i];
                if (item.isvideo) {
                } else {
                    items.push({src:'/api/scaled'+this.items[i].image, subHtml:this.items[i].name,
                                downloadUrl:this.serverRoot+this.items[i].image});
                }
            }
            if (undefined==this.gallery) {
                this.gallery=document.getElementById('lightgallery');
            }
            this.gallery.addEventListener('onCloseAfter', function (event) {
                window.lgData[view.gallery.getAttribute('lg-uid')].destroy(true);
            }, false);
            /*
            this.gallery.addEventListener('onSlideItemLoad', function (event) {
                view.currentIndex = event.detail.index;
                view.setStaredState();
            });

            this.gallery.addEventListener('onAfterSlide', function (event) {
                view.currentIndex = event.detail.index;
                view.setStaredState();
            });
            */
            window.lightGallery(this.gallery, { mode: 'lg-slide',  download: true, thumbnail: false, dynamic: true, dynamicEl: items, index:index });
        },
        showStarredItems() {
            this.name='Starred';
            this.items=[];
            this.path=STARRED_ACTION.id;
            for (var [key, value] of this.starred) {
                this.items.push(value);
            }
            this.items.sort(function(a, b) { return a.sort<b.sort ? -1 : 1 });
            this.grid = {numColumns:0, size:GRID_SIZES.length-1, rows:[], few:false};
            this.updateToolbar();
            this.layoutGrid();
            this.$nextTick(function () {
                setScrollTop(this.imageGridElement, 0);
            });
        },
        toggleStarred() {
        /*
            var idx = view.gallery.getCurrentIndex();
            var url = view.items[idx].image;
            if (this.starred.has(url)) {
                this.starred.delete(url);
            } else {
                this.starred.set(url, view.items[idx]);
            }
            var starred = [];
            for (var [key, value] of this.starred) {
                starred.push(value);
            }
            window.localStorage.setItem("starred", JSON.stringify(starred));
            this.setStaredState();
            */
        },
        setStaredState() {
/*
            var url = this.items[this.currentIndex].image;
            var starred = this.starred.has(url);

            var star = document.getElementById('star-icon');
            if (undefined==star || undefined==star[0]) {
            console.log("ADD");
                document.getElementsByClassName('lg-toolbar')[0].append('<a class="lg-icon star-icon" href="javascript:view.toggleStar()" id="star-icon"></a>');
                star = document.getElementById('star-icon')[0];
            }

            if (starred) {
                star[0].innerHTML = '<b>&#x2605;</b>';
            } else {
                star[0].innerHTML = '<b>&#9734;</b>';
            }
            */
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
            var numColumns = Math.max(Math.min(Math.floor(listWidth/(GRID_SIZES[size].sz+ITEM_BORDER)), this.items.length), 1);
            if (size==GRID_SIZES.length-1) {
                for (var i=size; i>size-(numColumns>=3 ? 4 : 8); i--) {
                    var nc = Math.min(Math.floor(listWidth/(GRID_SIZES[i].sz+ITEM_BORDER)), this.items.length);
                    if (nc>numColumns) {
                        size=i;
                        numColumns=nc;
                        break;
                    }
                }
            }
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
