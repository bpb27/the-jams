(function () {
	
	'use strict';

	//EMBER VIEWS ------------------------------------------------------------
	App.AudioPlayerView = Ember.Component.extend({

		layoutName: 'audio-player',
		audioPacket: Em.computed.alias('_parentView._parentView.controller.audioPacket'),
		currentTrackNumber: 0,
		playingAudio: Em.computed.alias('_parentView._parentView.controller.playingAudio'),
		playingAllSpotify: false,
		playAllSpotifyLinks: '',
		showButtons: false,
		
		_onLoad: function () {
			this.packetWatch();
		}.on('didInsertElement'),

		clearPlayerSettings: function () {
			this.set('playingAllSpotify', false);
			this.set('showButtons', false);
			this.$('.player-container').html('');
			
			if (this.get('player')) 
				this.get('player').stopVideo();
		},
		
		packetWatch: function () {
			
			this.clearPlayerSettings();
			
			if (this.get('audioPacket')['type_of_play'] === 'podcast') return this.setPodcastAudio(this.get('audioPacket'));
			if (this.get('audioPacket')['type_of_play'] === 'single') return this.setSingleAudio(this.get('audioPacket'));
			if (this.get('audioPacket')['type_of_play'] === 'all_spotify') return this.setPlayAllSpotifyAudio(this.get('audioPacket'));
			if (this.get('audioPacket')['type_of_play'] === 'all_youtube') return this.setPlayAllYoutubeAudio(this.get('audioPacket'));
		
		}.observes('_parentView._parentView.controller.audioFlag'),

		setPodcastAudio: function (data) {
			this.set('title', data.get('episodeTitle'));
			this.set('artist', data.get('podcastName'));
			this.$('.player-container').html(this.substituteWidthAndHeight(data.get('embedLink')));
		},

		setSingleAudio: function (data) {
			this.set('title', data.title);
			this.set('artist', data.artist);
			this.$('.player-container').html(data.embedLink);
		},

		setPlayAllSpotifyAudio: function (data) {
			this.set('playAllSpotifyLinks', data.embedLink);
			this.set('playingAllSpotify', true);
		},

		substituteWidthAndHeight: function (line) {
			var link = line.split(' ');
			for (var i = 0; i < link.length; i++) {
				if (link[i].indexOf('width=') != -1) 
					link[i] = 'width=100%';
				// if (link[i].indexOf('height=') != -1) 
				// 	link[i] = 'height=100';
			}
			return link.join(' ');
		},

		actions: {
			playNext: function () {
				this.incrementProperty('currentTrackNumber');
				this.packetWatch();
			},
			playPrev: function () {
				if (this.get('currentTrackNumber') > 0) {
					this.decrementProperty('currentTrackNumber');
					this.packetWatch();
				}
					
			}
		}
 
	
	});

	App.NavbarView = Ember.View.extend({
		templateName: 'nav-bar',
		controller: App.AuthController
	});


	
	//EMBER COMPONENTS ------------------------------------------------------------
	App.CommentButtonComponent = Ember.Component.extend({
		classNames: ['comment-component'],
		actions: {
	    	submitComment: function() {
	    		this.sendAction('submittingComment', this.get('commentText'));
	    		this.set('commentText', '');
	    	}
		}
	});


	App.FormTemplateComponent = Ember.Component.extend({
		
		classNames:['form-component'],
		customClass: null,
		spotifyLink: '',
		spotifyCallCount: 0,

		fieldsFormatted: function () {
			return this.get('fields').map(function(field){

				if (!field.display)
					field['display'] = field.name.replace('_', ' ').replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
				if (!field.placeholder) 
					field['placeholder'] = field.display;
				
				return field;
			}.bind(this));
		
		}.property(),

		spotifyAPI: function () {

			if (this.get('spotifyCallCount') === 1) return;
			this.incrementProperty('spotifyCallCount');

			var spotId = '';
			var spotLink = this.get('spotifyLink');

			if (spotLink.indexOf('http') != -1) {
				spotId = spotLink.split('/')[4];
			} else if (spotLink.indexOf(':') != -1) {
				spotId = spotLink.split(':')[2];
			} else {
				spotId = spotLink;
			}
				
			this.set('spotifyLink', spotId);

			Em.$.ajax('https://api.spotify.com/v1/tracks/' + spotId).then(function(data){
				
				console.log("Success", data);

				if (data.name) Em.$(".musicFormComponent span.title .form-control").val(data.name);
				if (data.artists) Em.$(".musicFormComponent span.artist .form-control").val(data.artists[0].name);
				if (data.album) Em.$(".musicFormComponent span.album .form-control").val(data.album.name);

				var albumImg = data.album.images[0].url;
				var albumLink = data.album.href

				if (albumImg) {
					Em.$('#bgimg').attr('src', albumImg);
					Em.$('#bgimg').css({'width': '75%', 'position': 'fixed', 'z-index': '-100%', 'left': '50%', 'margin': '0 0 0 -37.5%'});
				}

				if (albumLink) {
					Em.$.ajax(albumLink).then(function(album){
						if (album.release_date) Em.$(".musicFormComponent span.year .form-control").val(moment(album.release_date).format('YYYY'));
					}.bind(this));
				}
				
			}.bind(this), function(error){
				console.log(error);
			});
			
		}.observes('spotifyLink'),

		actions: {
			
			submit: function () {
				var obj = {};
				
				this.get('fields').forEach(function(entry){
					var text = $("." + this.get('customClass') + " span." + entry.name + " .form-control").val();
					if (text) obj[entry.name] = text;
				}.bind(this));
				
				if (obj.spotifyLink)
					if (obj.spotifyLink.indexOf('track') == -1)
						obj['spotifyLink'] = 'spotify:track:' + obj['spotifyLink'];

				this.sendAction('formData', obj);
			},
			
			close: function () {
				this.sendAction('closeForm');
			}
		
		}		
	});

	App.ListenEntryComponent = Ember.Component.extend({
	  	classNames: ['listen-component'],
	  	actions: {
		    
		    showPlayer: function () {
				this.set('isShowingPlayer', !this.get('isShowingPlayer'));
			},
			
			isShowingCommentForm: function () {
				this.toggleProperty('isShowingCommentForm');
			},
			
			submittingComment: function (param) {
				this.sendAction('submittingComment', param, this.get('identity'));
				this.send('showCommentForm');
			}
		
		}
	});


	App.MusicEntryComponent = Ember.Component.extend({
	  	
	  	tagName: 'span',
	  	textElements: ['title', 'artist', 'album', 'year', 'review'],
	  	currentUserEmail: Em.computed.alias('currentUserInfo.email'),
	  	currentUserFavs: Em.computed.alias('currentUserInfo.favorites'),
	  	currentUserId: Em.computed.alias('currentUserInfo.identity'),
	  	lastVisit: Em.computed.alias('currentUserInfo.lastVisit'),

	  	canEdit: function () {
	  		if (this.get('isCreator')) return "Click to Edit"
	  	}.property(),

		isCreator: function () {
			return this.get('currentUserEmail') === this.get('submittedByEmail') || this.get('currentUserEmail') === 'brendanbrown27@gmail.com';
		}.property(),

		isFavorite: function () {
			return this.get('currentUserFavs').indexOf(this.get('identity')) != -1;
		}.property('currentUserFavs'),

		isNew: function () {
			return (this.get('createdAt') > this.get('lastVisit')) && !this.get('isCreator');
		}.property('lastVisit'),
			
		needsVideo: function () {
			return (this.get('type') === "Live Performance" || this.get('type') === "Music Video");
		}.property(),

		newestDate: function () {
			var date = new Date('1/1/2000');
			this.get('comments').forEach(function(comment){
				if (comment.get('createdAt') > date) date = comment.get('createdAt');
			});
			
			if (date.getFullYear() === 2000) return this.get('createdAt');
			else return date;

		}.property('comments.length'),
	  		
	  	actions: {
	  		
	  		edit: function (param) {
				if (!this.get('isCreator')) return;
				this.restoreTextElements();
				var element = this.$('.music-item .' + param);
				var text = this.$('.music-item .' + param).text();

				if (param === "review")
					element.after("<div class='edit-container'><textarea class='edit-input' autofocus='autofocus' rows='5'>"+text+"</textarea><div class='confirm edit-btn'>&#10003;</div><div class='discard edit-btn'>X</div></div>");
				else
					element.after("<div class='edit-container'><input type='text' value='"+text+"' class='edit-input' autofocus='autofocus'><div class='confirm edit-btn'>&#10003;</div><div class='discard edit-btn'>X</div></div>");

				this.applyDimensions(element, this.$('.music-item .edit-container'));
				element.hide();

				this.$('.music-item .confirm').click(function(){
					if (param === 'review') param = 'comment';

					var newText = this.$('.music-item .edit-input').val();
					var obj = {identity: this.get('identity'), field: param, newValue: newText};
					
					this.set(param, newText);
					this.sendAction('updatingEntry', obj);
					this.$('.music-item .edit-container').remove();
					
					element.show();
			
				}.bind(this));

				this.$('.music-item .discard').click(function(){
					this.$('.music-item .edit-container').remove();
					element.show();
				}.bind(this));

	  		},

	  		editComment: function (comment) {
	  			if (comment.get('submittedByID') === this.get('currentUserId')) {
	  				var element = this.$('.comment-list .' + comment.get('id'));
	  				element.hide();
	  				element.after("<div class='edit-container'><textarea class='edit-input' rows='5'>"+comment.get('comment')+"</textarea><div class='confirm edit-btn'>&#10003;</div><div class='discard edit-btn'>X</div></div>");
	  			
	  				this.$('.music-item .confirm').click(function(){
						
						var newText = this.$('.comment-list .edit-input').val();
						comment.set('comment', newText);
						comment.save();

						this.$('.music-item .edit-container').remove();
						
						element.show();
				
					}.bind(this));

					this.$('.music-item .discard').click(function(){
						this.$('.music-item .edit-container').remove();
						element.show();
					}.bind(this));
	  			}
	  		},

			favorite: function () {
				this.sendAction('favorite', this.get('identity'));
			},

			editWhole: function () {
				if (!this.get('isCreator')) return;
				this.sendAction('editWhole', this.get('identity'));
			},

			loadPlayer: function(obj, link, type){
				var playObject = {link: link, linkType: type, title: obj.get('title'), artist: obj.get('artist'), identity: this.get('identity')};
				this.sendAction('loadPlayer', playObject);
				this.set('isNew', false);
				//this.sendAction('addToNotNewList', this.get('identity'));
			},

			searchTag: function (name) {
				this.sendAction('searchTag', name);
			},

			submittingComment: function (param) {
				this.sendAction('submittingComment', param, this.get('identity'));
				this.send('showCommentForm');
			},

			submittingTag: function (param) {
				this.sendAction('submittingTag', param, this.get('identity'));
			},

			showCommentForm: function () {
				this.set('isShowingCommentForm', !this.get('isShowingCommentForm'));
			},

			showTagForm: function () {
				this.set('isShowingTagForm', !this.get('isShowingTagForm'));
			}
	  	},

	  	applyDimensions: function (element, input) {
	  		input.css('height', (parseInt(element.css('height').replace('px', '')) * 2).toString() + 'px');
	  		input.css('fontSize', element.css('fontSize'));
	  	},

	  	restoreTextElements: function () {
	  		this.$('.music-item .edit-container').remove();
	  		this.get('textElements').forEach(function(param){
				this.$('.music-item .' + param).show();
	  		}.bind(this));
	  	}

	});

	App.TagButtonComponent = Ember.Component.extend({
		classNames: ['tag-component'],
		tagText: '',

		collectTags: function () {
			this.set('tagsCollections', App.__container__.lookup("controller:auth").get('tagsCollections'));
		}.on('init'),

		suggestText: function () {
			if (!this.get('tagText')) return this.set('suggestedText', '');
			var suggestion = '';
			
			this.get('tagsCollections').forEach(function(tag){
				if (tag.indexOf(this.get('tagText').toLowerCase()) === 0 && !suggestion) {
					suggestion = tag;			
					this.set('suggestedText', suggestion);
				}
				
			}.bind(this));

			if (!suggestion) this.set('suggestedText', '');

			if (this.get('tagText') === 'ra' || this.get('tagText') === 'rap')
				this.set('suggestedText', 'hip-hop');

		}.observes('tagText'),

		actions: {

			setSuggestion: function () {
				if (this.get('suggestedText'))
					this.set('tagText', this.get('suggestedText'));
			},
	    	
	    	submitTag: function() {
	    		this.sendAction('submittingTag', this.get('tagText'));
	    		this.set('tagText', '');
	    	}
		}
	});



	

})();