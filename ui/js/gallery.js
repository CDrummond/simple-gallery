/**
 * Gallery WebApp
 * Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
 * Licensed under the MIT license.
 */

const SLIDESHOW_TIME = 5;
const GRID_MIN_SIZE = 135;
const GRID_MAX_SIZE = 260;  // 235
const GRID_STEP = 5;
const GRID_PADDING = 4;
const THIS_DAY_ACTION = {id:'act:thisday', title:'Show photos from this day', icon:'schedule'};
const STARRED_ACTION  = {id:'act:stared', title:'Show starred photos', icon:'star'};
const SHOW_ALL_ACTION = {id:'act:showall', title:'Show all photos', icon:'filter' };
const INFO_ACTION     = {id:'act:info', title:'Show information', icon:'info'};
const CLEAR_ACTION    = {id:'act:clear', title:'Clear', icon:'delete'};
const GEN_ACTION      = {id:'act:gen', title:'Generate thumbnails', icon:'photo'};

var view;

Vue.component('gallery-view', {
    template: `
<div>
 <v-menu v-model="menu.show" :position-x="menu.x" :position-y="menu.y" absolute offset-y>
  <v-list>
   <v-list-tile @click="setThumbnail(menu.item, menu.index)">
    <v-list-tile-avatar :tile="true"><v-icon>photo</v-icon></v-list-tile-avatar>
    <v-list-tile-title>Use as thumbnail</v-list-tile-title>
   </v-list-tile>
  </v-list>
 </v-menu>
 <v-progress-linear height="3" background-color="transparent" v-if="slideshow.slides.length>0 && slideshow.open && !slideshow.zoom && slideshow.playing" class="np-slider np-slider-desktop" class="slideshow-progress" :value="slideshow.playpc"></v-progress-linear>
 <v-toolbar v-if="slideshow.slides.length>0 && (slideshow.open || slideshow.zoom)" class="slideshow-toolbar">
  <div class="ellipsis slideshow-text">{{slideshow.title}}</div>
  <v-spacer></v-spacer>
  <v-btn flat icon v-if="wide" v-bind:class="{'disabled':slideshow.isvideo}" @click.stop="toggleZoom()"><v-icon class="slideshow-text">{{slideshow.zoom ? 'zoom_out' : 'zoom_in'}}</v-icon></v-btn>
  <v-btn flat icon v-if="wide" @click.stop="toggleStarred()"><v-icon class="slideshow-text">{{slideshow.starred ? 'star' : 'star_border'}}</v-icon></v-btn>
  <v-btn flat icon v-if="wide" @click.stop="downloadItem()"><v-icon class="slideshow-text">cloud_download</v-icon></v-btn>
  <v-btn flat icon v-bind:class="{'disabled':slideshow.zoom}" v-if="slideshow.slides.length>1" @click.stop="playPause()"><v-icon class="slideshow-text">{{slideshow.playing ? 'pause_circle_outline' : 'play_circle_outline'}}</v-icon></v-btn>
  <v-btn v-if="wide" flat icon @click.stop="closeSlideShow(); closeViewer();"><v-icon class="slideshow-text">close</v-icon></v-btn>
  <v-menu v-if="!wide" bottom>
   <v-btn flat icon slot="activator"><v-icon class="slideshow-text">more_vert</v-icon></v-btn>
   <v-list>
    <v-list-tile v-bind:class="{'disabled':slideshow.isvideo}" @click="toggleZoom()">
     <v-list-tile-avatar><v-icon>{{slideshow.zoom ? 'zoom_out' : 'zoom_in'}}</v-icon></v-list-tile-avatar>
     <v-list-tile-content>{{slideshow.zoom ? "Restore" : "Allow zooming"}}</v-list-tile-content>
    </v-list-tile>
    <v-list-tile @click="toggleStarred()">
     <v-list-tile-avatar><v-icon>{{slideshow.starred ? 'star' : 'star_border'}}</v-icon></v-list-tile-avatar>
     <v-list-tile-content>{{slideshow.starred ? "Remove star" : "Mark with star"}}</v-list-tile-content>
    </v-list-tile>
    <v-list-tile @click="downloadItem()">
     <v-list-tile-avatar><v-icon>cloud_download</v-icon></v-list-tile-avatar>
     <v-list-tile-content>Download</v-list-tile-content>
    </v-list-tile>
    <v-divider></v-divider>
    <v-list-tile @click="closeSlideShow(); closeViewer();"">
     <v-list-tile-avatar><v-icon>close</v-icon></v-list-tile-avatar>
     <v-list-tile-content>Close</v-list-tile-content>
    </v-list-tile>
   </v-list>
  </v-menu>
 </v-toolbar>v

 <div id="blueimp-gallery" class="blueimp-gallery blueimp-gallery-controls">
  <div class="slides"></div>
  <v-btn flat icon class="prev" v-if="!IS_MOBILE && !slideshow.zoom"><v-icon class="slideshow-text">keyboard_arrow_left</v-icon></v-btn>
  <v-btn flat icon class="next" v-if="!IS_MOBILE && !slideshow.zoom"><v-icon class="slideshow-text">keyboard_arrow_right</v-icon></v-btn> 
 </div>
 <div class="image-grid" style="overflow:auto;" id="imageGrid">
  <RecycleScroller :items="grid.rows" :item-size="grid.ih + GRID_PADDING" page-mode key-field="id">
   <table slot-scope="{item, index}" :class="[grid.few ? '' : 'full-width']">
    <td align="center" style="vertical-align: top" v-for="(idx, cidx) in item.indexes"><v-card flat align="left" class="image-grid-item">
     <div v-if="idx>=items.length" class="image-grid-item"></div>
     <div v-else class="image-grid-item" v-bind:class="{'image-grid-item-few': grid.few}" @click="click(items[idx], idx, $event)" @contextmenu="context(items[idx], idx, $event)" :title="items[idx].name">
      <img class="image-grid-item-img" :key="items[idx].image" :src="'/api/thumb'+items[idx].image"></img>
      <div class="image-grid-text" v-if="items[idx].isfolder">{{items[idx].name}}</div>
      <div class="image-grid-year" v-else-if="items[idx].year">{{items[idx].year}}</div>
      <div class="image-grid-video-overlay" v-else-if="items[idx].isvideo"></div>
     </div>
    </v-card></td>
   </table>
  </RecycleScroller>
 </div>
 <v-progress-circular class="load-progress" v-if="fetchingItems" color="primary" size=72 width=6 indeterminate></v-progress-circular>
 <v-dialog v-model="showInfo" v-if="showInfo" persistent scrollable width="600">
  <v-card>
   <v-textarea auto-grow readonly :rows="items.length>9 ? 10 : items.length+2" :value="infoText" style="margin:8px; min-height:64px"></v-textarea>
   <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn flat @click.native="copyInfo()">Copy to clipboard</v-btn>
    <v-btn flat @click.native="showInfo=false; infoText=undefined">Close</v-btn>
   </v-card-actions>
  </v-card>
 </v-dialog>
</div>
      `,
    data() {
        return {
            items: [],
            fetchingItems: false,
            grid: {numColumns:0, size:GRID_MIN_SIZE, rows:[], few:false},
            showInfo: false,
            infoText: undefined,
            slideshow: {gallery:undefined, viewer:undefined, slides:[], title:undefined, starred:false, open:false, playing:false, zoom:false, isvideo:false, playpc:0},
            menu: { show: false, x:0, y:0 }
        }
    },
    created() {
        view = this;
        this.history = [];
        this.starred = new Map();
        this.admin = window.location.href.indexOf('?admin')>0;
        this.thumbGen = false;
        if (this.admin) {
            this.checkThumbStatus();
        }

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
            } else if (INFO_ACTION.id==id) {
                this.infoText="";
                for (var i=0, len=this.items.length; i<len; ++i) {
                    this.infoText+=this.items[i].image+"\n";
                }
                this.showInfo = true;
            } else if (CLEAR_ACTION.id==id) {
               this.$confirm('Unstar all photos and videos?', {buttonTrueText:'Unstar all', buttonFalseText:'Cancel'}).then(res => {
                    if (res) {
                        this.starred = new Map();
                        window.localStorage.removeItem('starred');
                        this.goTo(-1);
                    }
                });
            } else if (GEN_ACTION.id==id) {
                this.generateThumbnails();
            }
        }.bind(this));
        this.wide = window.innerWidth>=500;
        bus.$on('windowWidthChanged', function() {
            this.layoutGrid();
            var wide = window.innerWidth>=500;
            if (wide!=view.wide) {
                view.wide=wide;
            }
        }.bind(this));

        this.serverRoot = '';
        axios.get('/api/config?x=time'+(new Date().getTime())).then((resp) => {
            if (resp && resp.data && resp.data.serverRoot) {
                this.serverRoot = resp.data.serverRoot.replace('0.0.0.0', window.location.hostname);
            }
        });
        var starred = window.localStorage.getItem('starred');
        if (starred) {
            try {
                starred = JSON.parse(starred);
                for (var i=0, len=starred.length; i<len; ++i) {
                    this.starred.set(starred[i].image, starred[i]);
                }
            } catch(e) {
                window.localStorage.removeItem('starred');
            }
        }
    },
    mounted() {
        this.imageGridElement = document.getElementById('imageGrid');
        this.goTo(-1);
    },
    methods: {
        copyInfo() {
            copyTextToClipboard(this.infoText);
        },
        goTo(level) {
            if (level<0) { // -1 == go home
                this.history = [];
                this.fetchItems('/', 'Home');
            } else if (level<this.history.length) {
                var prev = undefined;
                while (this.history.length>level) {
                    prev = this.history.pop();
                }
                if (prev.refresh) {
                    this.fetchItems(prev.path, prev.name);
                } else {
                    this.items = prev.items;
                    this.name = prev.name;
                    this.path = prev.path;
                    this.updateToolbar();
                    this.destroySlideShow();
                    this.layoutGrid(true);
                    this.$nextTick(function () {
                        setScrollTop(this.imageGridElement, prev.pos);
                    });
                }
            }
        },
        updateToolbar() {
            var actions = [];
            if (this.path.length>1) {
                if (this.items.length>0 && this.items[0].isfolder) {
                    actions.push(SHOW_ALL_ACTION);
                }
                if (this.path==STARRED_ACTION.id) {
                    actions.push(CLEAR_ACTION);
                    actions.push(INFO_ACTION);
                }
            } else {
                if (this.admin) {
                    actions.push(GEN_ACTION);
                }
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
            axios.get('/api/browse'+fixPath(path)+(path.indexOf('?')>0 ? '&' : '?')+'short='+(window.innerWidth<520 ? 1 : 0)+'&x=time'+(new Date().getTime())).then((resp) => {
                if (path.length>1) { // Don't store history of initiaql state!
                    this.history.push({path:this.path, name:this.name, items:this.items, pos:this.imageGridElement.scrollTop});
                }
                this.fetchingItems = false;
                this.items=[];
                this.path=path;
                this.name=name;
                this.subtitle = '';

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
                        var isThisDay = path.indexOf('?filter=today')>=0;
                        var lastYear = undefined;
                        for (var i=0, len=resp.data.images.length; i<len; ++i) {
                            var year = isThisDay && resp.data.images[i].year && resp.data.images[i].year!=lastYear ? resp.data.images[i].year : undefined;
                            lastYear = resp.data.images[i].year;
                            this.items.push({sort:resp.data.images[i].sort,
                                             name:resp.data.images[i].name, 
                                             image:fixPath(resp.data.images[i].url),
                                             isvideo:resp.data.images[i].video,
                                             year:year});
                        }
                    }
                }

                this.items.sort(function(a, b) { return a.sort<b.sort ? -1 : 1 });
                this.grid = {numColumns:0, size:GRID_MIN_SIZE, rows:[], few:false};
                this.updateToolbar();
                this.destroySlideShow();
                this.layoutGrid(true);
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
            var subtitle='';
            if (numFolders>0) {
                subtitle+=numFolders==1 ? '1 Folder' : (numFolders + ' Folders');
            }
            if (numPhotos>0) {
                subtitle+=(subtitle.length>1 ? ', ' : '')+(numPhotos==1 ? '1 Photo' : (numPhotos + ' Photos'));
            }
            if (numVideos>0) {
                subtitle+=(subtitle.length>1 ? ', ' : '')+(numVideos==1 ? '1 Video' : (numVideos + ' Videos'));
            }
            this.haveVideos = numVideos>0;
            return subtitle;
        },
        click(item, index, event) {
            if (item.isfolder) {
                if (this.fetchingItems) {
                    return;
                }
                this.fetchItems(item.path, item.name);
            } else {
                this.createSlideShow(index);
            }
        },
        context(item, index, event) {
            if (this.admin && this.path.length>1 && this.path!=STARRED_ACTION.id && this.path.indexOf('?filter=')<0) {
                this.menu={show:true, item:item, x:event.clientX, y:event.clientY, index:index};
            }
            event.preventDefault();
        },
        setThumbnail(item, index) {
            var data = {thumb:item.image.substring(this.path.length+(this.path.endsWith('/') ? 0 : 1))};
            axios.post('/api/thumb'+fixPath(this.path)+'?cmd=set', data).then((resp) => {
                bus.$emit('showMessage', 'Thumbnail set');
                this.history[this.history.length-1].refresh=true;
            });
        },
        generateThumbnails() {
            if (this.thumbGen) {
                return;
            }
            this.$confirm('Generate missing thumbnails?', {buttonTrueText:'Generate', buttonFalseText:'Cancel'}).then(res => {
                if (res) {
                    axios.post('/api/thumb/?cmd=gen', {}).then((resp) => {
                        this.checkThumbStatus();
                    });
                }
            });
        },
        checkThumbStatus() {
            axios.get('/api/thumb/?cmd=status&x=time'+(new Date().getTime())).then((resp) => {
                if (resp && resp.data && undefined!=resp.data.thumbgenThreadRunning) {
                    var thumbGen = resp.data.thumbgenThreadRunning;
                    if (thumbGen!=this.thumbGen) {
                        this.thumbGen = thumbGen;
                        bus.$emit('thumbGenActive', this.thumbGen);
                        if (this.thumbGen) {
                            this.startThumbGenTimer();
                        } else {
                            this.cancelThumbGenTimer();
                        }
                    }
                }
            });
        },
        cancelThumbGenTimer() {
            if (undefined!==this.thumbGenTimer) {
                clearInterval(this.thumbGenTimer);
                this.thumbGenTimer = undefined;
            }
        },
        startThumbGenTimer() {
            if (undefined==this.thumbGenTimer) {
                this.thumbGenTimer = setInterval(function () {
                    this.checkThumbStatus();
                }.bind(this), 2000);
            }
        },
        closeSlideShow() {
            if (this.slideshow.open) {
                this.slideshow.gallery.close();
                this.slideshow.open=false;
                this.slideshow.playing=false;
            }
            this.stopSlideTimer();
        },
        closeViewer() {
            this.slideshow.zoom=false;
            if (undefined!=this.slideshow.viewer) {
                this.slideshow.viewer = this.slideshow.viewer.destroy();
            }
        },
        destroySlideShow() {
            if (!this.slideshow) {
                return;
            }
            if (this.slideshow.gallery) {
                this.closeSlideShow();
                this.slideshow.gallery = undefined;
            }
            this.closeViewer();
            this.slideshow.slides = [];
            this.stopSlideTimer();
        },
        createSlideShow(index) {
            if (this.slideshow.slides.length<1) {
                for (var i=0, len=this.items.length; i<len; ++i) {
                    var item=this.items[i];
                    if (item.isvideo) {
                        this.slideshow.slides.push({href:this.serverRoot+this.items[i].image, poster:'/api/scaled'+this.items[i].image,
                                                    title:this.items[i].name, type:'video/mp4'});
                    } else {
                        this.slideshow.slides.push({href:'/api/scaled'+this.items[i].image, title:this.items[i].name, type:'image/jpeg'});
                    }
                }
            }
            this.slideshow.gallery = blueimp.Gallery(this.slideshow.slides,
                {closeOnSlideClick:false,
                 onopened: function() { view.slideshow.open=true; view.addVideoSubtitles() },
                 onslide: function() { view.setCurrentSlideShowItem() },
                 onclosed: function() { view.slideshow.open=false; view.slideshow.playing=false } });
            this.slideshow.gallery.slide(index);
            this.slideshow.playing=false;
            this.slideshow.zoom=false;
        },
        addVideoSubtitles() {
            if (!this.haveVideos) {
                return;
            }
            var list = document.getElementsByTagName("video");
            if (undefined==list) {
                return;
            }
            for (var i=0, len=list.length; i<len; ++i) {
                var sub = document.createElement('track');
                sub.setAttribute('kind', 'subtitles');
                sub.setAttribute('src', list[i].src.split('.').slice(0, -1).join('.')+'.vtt');
                sub.setAttribute('label', 'Subtitles');
                sub.setAttribute('default', '');
                list[i].appendChild(sub);
            }
        },
        setCurrentSlideShowItem() {
            this.slideshow.title = this.items[this.slideshow.gallery.index].name;
            this.slideshow.starred = this.starred.has(this.items[this.slideshow.gallery.index].image);
            this.slideshow.isvideo = this.items[this.slideshow.gallery.index].isvideo;
        },
        showStarredItems() {
            this.name='Starred';
            this.items=[];
            this.path=STARRED_ACTION.id;
            for (var [key, value] of this.starred) {
                this.items.push(value);
            }
            // Sort by filename here, as sorts are per-folder
            this.items.sort(function(a, b) { return a.image<b.image ? -1 : 1 });
            this.grid = {numColumns:0, size:GRID_MIN_SIZE, rows:[], few:false};
            this.updateToolbar();
            this.destroySlideShow();
            this.layoutGrid(true);
            this.$nextTick(function () {
                setScrollTop(this.imageGridElement, 0);
            });
        },
        toggleZoom() {
            if (this.items[this.slideshow.gallery.index].isvideo) {
                return;
            }
            if (this.slideshow.playing) {
                this.playPause();
            }
            this.slideshow.zoom=!this.slideshow.zoom;
            if (this.slideshow.zoom) {
                if (undefined==this.slideshow.viewer) {
                    this.slideshow.viewer = new ImageViewer.FullScreenViewer({snapView:!IS_MOBILE});
                }
                var img = this.items[this.slideshow.gallery.index].image;
                this.slideshow.viewer.show('/api/scaled'+img, '/api/view'+img);
            } else {
                this.closeViewer();
            }
        },
        toggleStarred() {
            var url = this.items[this.slideshow.gallery.index].image;
            if (this.starred.has(url)) {
                this.starred.delete(url);
                this.slideshow.starred = false;
            } else {
                this.starred.set(url, this.items[this.slideshow.gallery.index]);
                this.slideshow.starred = true;
            }
            var starred = [];
            for (var [key, value] of this.starred) {
                starred.push(value);
            }
            window.localStorage.setItem('starred', JSON.stringify(starred));
        },
        playPause() {
            if (this.slideshow.zoom) {
                return;
            }
            if (this.slideshow.playing) {
                this.stopSlideTimer();
            } else {
                this.starSlideTimer();
            }
            this.slideshow.playing=!this.slideshow.playing;
        },
        downloadItem() {
            if (this.slideshow.playing) {
                this.playPause();
            }
            var url = this.serverRoot + this.items[this.slideshow.gallery.index].image;
            var name = url.substring(url.lastIndexOf('/')+1);
            download(url, name);
        },
        stopSlideTimer() {
            if (undefined!==this.slideTimer) {
                clearInterval(this.slideTimer);
                this.slideTimer = undefined;
            }
            this.slideshow.playpc = 0;
        },
        starSlideTimer() {
            const SLIDESHOW_TIME_STEP = 2;
            this.slideshow.playpc = 0;
            this.slideTimer = setInterval(function () {
                this.slideshow.playpc += SLIDESHOW_TIME_STEP;
                if (this.slideshow.playpc>100) {
                    this.slideshow.playpc = 0;
                    var index = this.slideshow.gallery.index + 1;
                    this.slideshow.gallery.slide(index >=this.items.length ? 0 : index);
                }
            }.bind(this), (SLIDESHOW_TIME*1000)/(100/SLIDESHOW_TIME_STEP));
        },
        calcSizes(quantity, listWidth) {
            var size = GRID_MIN_SIZE;
            var steps = 0;
            while (listWidth>((size+GRID_STEP)*quantity) && (size+GRID_STEP)<=GRID_MAX_SIZE) {
                size += GRID_STEP;
                steps++;
            }
            // How many columns?
            var maxColumns = Math.floor(listWidth / size    );
            var numColumns = Math.max(Math.min(maxColumns, 20), 1);
            return {size: size, steps: steps, nc: numColumns}
        },
        layoutGrid(force) {
            const VIEW_RIGHT_PADDING = 8;
            var changed = false;
            var viewWidth = window.innerWidth;
            var listWidth = viewWidth - ((/*scrollbar*/ IS_MOBILE ? 0 : 20) + VIEW_RIGHT_PADDING);

            // Calculate what grid item size we should use...
            var sz = undefined;
            for (var i=4; i>=1; --i) {
                sz = this.calcSizes(i, listWidth);
                if (sz.nc>=i) {
                    break;
                }
            }
            if (force || sz.nc != this.grid.numColumns) { // Need to re-layout...
                changed = true;
                this.grid.rows=[];
                for (var i=0; i<this.items.length; i+=sz.nc) {
                    var indexes=[]
                    for (var j=0; j<sz.nc; ++j) {
                        indexes.push(i+j);
                    }
                    this.grid.rows.push({id:"row."+i+"."+sz.nc, indexes:indexes});
                }
                this.grid.numColumns = sz.nc;
            }

            if (this.grid.ih != sz.size) {
                this.grid.ih = sz.size;
                changed = true;
                document.documentElement.style.setProperty('--image-grid-factor', sz.steps);
            } else if (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--image-grid-factor'))!=sz.steps) {
                changed = true;
                document.documentElement.style.setProperty('--image-grid-factor', sz.steps);
            }

            var few = 1==this.grid.rows.length && (1==this.items.length || ((this.items.length*sz.size)*1.20)<listWidth);
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
