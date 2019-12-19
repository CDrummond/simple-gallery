/**
 * Gallery WebApp
 * Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
 * Licensed under the MIT license.
 */

Vue.component('gallery-toolbar', {
    template: `
<div>
 <v-toolbar fixed dense app class="toolbar">
  <v-btn flat icon v-if="history.length>0" @click="bus.$emit('setLevel', -1)" class="toolbar-button"><v-icon>home</v-icon></v-btn>
  <v-btn flat icon v-if="history.length>0" @click="bus.$emit('setLevel', history.length-1)" class="toolbar-button" id="home-button"><v-icon>arrow_back</v-icon></v-btn>
 
  <div v-if="history.length<1" class="v-toolbar__title ellipsis">{{trans.title}}</div>
  <v-menu v-else bottom class="ellipsis">
   <v-toolbar-title slot="activator">
    <div class="ellipsis" v-bind:class="{'titlemod': subtitle.length>1}">{{title}}</div>
    <div v-if="subtitle.length>1" class="ellipsis subtext">{{subtitle}}</div>
   </v-toolbar-title>
   <v-list>
    <template v-for="(item, index) in history">
     <v-list-tile @click="bus.$emit('setLevel', index)">  
      <v-list-tile-content>
       <v-list-tile-title>{{item}}</v-list-tile-title>
      </v-list-tile-content>
     </v-list-tile>
    </template>
   </v-list>
  </v-menu>
  <v-spacer></v-spacer>
  <template v-for="(action, index) in actions">
   <v-btn flat icon @click.stop="bus.$emit('action', action.id)" :title="action.title">
    <v-icon v-bind:class="{'disabled':thumbGenActive && action.id==GEN_ACTION.id}">{{action.icon}}</v-icon>
   </v-btn>
  </template>
 </v-toolbar>
 <v-snackbar v-model="snackbar.show" :multi-line="true" timeout="2500" :color="snackbar.color" top>{{ snackbar.msg }}</v-snackbar>
</div>
    `,
    data() {
        return {
                    title: undefined,
                    subtitle: undefined,
                    history: [],
                    actions: [],
                    snackbar: { show:false, msg:undefined, color:undefined },
                    trans: { title:"Photo Gallery" },
                    thumbGenActive: false
               }
    },
    mounted() {
        bus.$on('updateToolbar', function(title, subtitle, history, actions) {
            this.title = title;
            this.subtitle = subtitle;
            this.history = [];
            for (var i=0, len=history.length; i<len; ++i) {
                this.history.push(history[i].name);
            }
            this.actions=actions;
        }.bind(this));
        bus.$on('thumbGenActive', function(active) {
            this.thumbGenActive = active;
        }.bind(this));
        bus.$on('showError', function(msg) {
            this.snackbar = {msg:msg, show: true, color: 'error' };
        }.bind(this));
        bus.$on('showMessage', function(msg) {
            this.snackbar = {msg: msg, show: true };
        }.bind(this));
    }
})
