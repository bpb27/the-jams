(function () {
	
	'use strict';
	
	//CONNECTION TO FIREBASE ----------------------------------------
	App.ApplicationAdapter = DS.FirebaseAdapter.extend({
		firebase: new Firebase('https://thejams.firebaseio.com')
	});


	//ROUTER ------------------------------------------------------------
	App.Router.map(function(){
		this.resource('listen');
		this.resource('movies');
		this.resource('music');
		this.resource('podcast');
		this.resource('tune', {path: '/tune/:tune_id'});
		this.resource('update');
		this.resource('users');
		this.resource('user', {path: '/users/:user_id'});
		this.resource('writing');
		
	});

	
	//ROUTES ------------------------------------------------------------
	App.ApplicationRoute = Ember.Route.extend({
		controllerName: 'auth'
	});

	App.IndexRoute = Ember.Route.extend({
		controllerName: 'auth'
	});

	App.ListenRoute = Ember.Route.extend({
		model: function () {
			return this.store.findAll('listen');
		}
	});

	App.MusicRoute = Ember.Route.extend({
		model: function () {
			return this.store.findAll('music');
		}
	});

	App.MoviesRoute = Ember.Route.extend({
		model: function () {
			return this.store.findAll('movie');
		}
	});

	App.PodcastRoute = Ember.Route.extend({
		model: function () {
			return this.store.findAll('podcast');
		}
	});	

	App.TuneRoute = Ember.Route.extend({
		model: function (param) {
			return this.store.find('music', param.tune_id);
		}
	})

	App.UsersRoute = Ember.Route.extend({
		model: function(){
			return this.store.findAll('user');
		}
	});

	App.UserRoute = Ember.Route.extend({
		model: function (param) {
			console.log(param);
			return this.store.find('user', param.user_id);
		}
	});

	App.WritingRoute = Ember.Route.extend({
		model: function () {
			return this.store.findAll('writing');
		}
	});

	
	
	//CONTROLLERS ------------------------------------------------------------------

	App.AuthController = Ember.Controller.extend({
	  	authed: false,
	  	currentUser: null,
	  	showRegisterForm: false,
	  	playingAudio: false,
	  	audioFlag: false,
	  	audioPacket: {},

	  	myRef: new Firebase("https://thejams.firebaseio.com"),
	  	
	  	init: function() {
	    	this.authClient = new FirebaseSimpleLogin(this.get('myRef'), function(error, user) {
	      		if (error) {
	        		alert(error.message + " You mendacious fuck.");
	      		}
	      		else if (user) {
	        		this.set('authed', true);
					this.store.findAll('user').then(function(users_list){
						var currentUser = users_list.findBy('email', user.email)
						this.set('currentUser', {
							firstName: currentUser.get('firstName'),
							name: currentUser.get('firstName') + ' ' + currentUser.get('lastName'),
							email: user.email,
							lastVisit: currentUser.get('lastVisit'),
							identity: currentUser.get('id'),
							favorites: currentUser.get('favorites') || '',
							follows: currentUser.get('follows') || ''
						});

						currentUser.set('lastVisit', new Date());
						currentUser.save().then(function(){
							console.log(this.get('currentUser.name'), "status: signed in");
							console.log(App.__container__.lookup('router:main').get('location').location.hash);
							if (App.__container__.lookup('router:main').get('location').location.hash == "#/")
								this.transitionToRoute('music');
						}.bind(this))

					}.bind(this));
	      		
	      		} 
	      		else {
	        		this.set('authed', false);
	      		}
	    	}.bind(this));
	  	},

	  	clearRegistrationForm: function(){
	    	this.set('firstName', '');
	        this.set('lastName', '');
	        this.set('createEmail', '');
	        this.set('createPassword', '');
	        this.set('confirm', '');
		},

	  	actions: {
		    playRequest: function (req) {
		    	this.set('playingAudio', true);
		    	this.set('audioPacket', req);
		    	this.set('audioFlag', !this.get('audioFlag'));
		    },

		    closePlayer: function () {
		    	this.set('playingAudio', false);
		    },

		    toggleRegisterForm: function(){
				this.set('showRegisterForm', true);
			},
		    login: function() {
		        this.authClient.login('password', {
		            email: loginEmail.value,
		            password: loginPassword.value
		            // rememberMe: remember.value
		        });
		    },

		    logout: function() {
		        this.authClient.logout();
		        console.log("logging out");
		        this.transitionToRoute('index');
		    },

		    createUser: function() {
		        var newUser;
		        var that = this;
		        var firstName = this.get('firstName');
		        var lastName = this.get('lastName');
		        var email = this.get('createEmail');
		        var password = this.get('createPassword');
		        var confirm = this.get('confirm');

		        if(!firstName || !lastName){
		        	alert("Your NAME, sir.");
		        	return false;
		        }

		        if(confirm !== password){
		        	alert("Passwords don't match you bumbling twat.")
		        	return false;
		        }
		        
		        console.log(firstName, lastName, email);
		        
		        this.authClient.createUser(email, password, function(error, user) {
		            if (!error) {

		                newUser = that.store.createRecord('user', {
							firstName: firstName,
							lastName: lastName,
							email: email,
						});

						newUser.save().then(function(user){
							console.log("New User added to DS.");
							user.set('follows', user.get('id') + ',');
							user.save();
							that.authClient.login('password', {
		            			email: email,
		            			password: password
		        			});
		        			that.clearRegistrationForm();
						});
		            }
		            else{
		            	alert(error.message);
		            }
		        })  
			}
		}

	});



	App.ListenController = Ember.ArrayController.extend({
		needs: ['auth'],
		isLoggedIn: Ember.computed.alias('controllers.auth.authed'),
		currentUser: Ember.computed.alias('controllers.auth.currentUser'),
		query: '',
		listenTypes: ['Album', 'Playlist', 'Song Set'],
		selectedType: 'Album',
		showingSortButtons: true,
		sortAscending: false,
		sortProperties: ['createdAt'],
		
		showFiveFields: function () {
			if (this.get('selectedType') === 'Song Set') return true;
			return false;
		}.property('selectedType'),

	  	albums: function () {
	  		return this.returnModel('Album');
	  	}.property('arrangedContent', 'query', 'length'),

	  	songsets: function () {
	  		return this.returnModel('Song Set');
	  	}.property('arrangedContent', 'query', 'length'),

	  	playlists: function () {
	  		return this.returnModel('Playlist');
	  	}.property('arrangedContent', 'query', 'length'),

	  	returnModel: function (type) {
			var filter = new String(this.get('query')).toString();
		    var rx = new RegExp(filter, 'gi');//'gi' == global and case-insensitive
		    var music = this.get('arrangedContent');//Ember property referring to current model

		    var tunes = music.filter(function(song) {
		      	if (song.get('type') == type)
		      		return song.get('name').match(rx) || song.get('submittedBy').match(rx) || song.get('type').toString().match(rx);
		    });

		   return tunes;
	  	},
		
		actions: {
			showSortButtons: function(){
				this.set('showingSortButtons', !this.get('showingSortButtons'));
			},
			
			showForm: function () {
				this.set('isShowingForm', !this.get('isShowingForm'));
			},

			submitListen: function () {
				var link = '';
				
				if (this.get('showFiveFields')) link = this.makeFiveSongLink();
				else link = this.get('spotify');

				var newListen = {
					type: this.get('selectedType'),
					name: this.get('name'),
					review: this.get('review'),
					spotifyLink: link,
					submittedBy: this.get('currentUser.name'),
					submittedByEmail: this.get('currentUser.email'),
					createdAt: new Date()
				}

				if (!newListen.name) return alert("A title, sir.");
				if (!newListen.review) return alert("A description, sir.");
				if (!newListen.spotifyLink) return alert("Did you even submit a link, SIR?");

				var listenEntry = this.store.createRecord('listen', newListen);
				listenEntry.save().then(function(){
					this.clearForm();
					this.send('showForm');
				}.bind(this))
			},

			submittingComment: function(text, entryId){
				if (!text) return alert("Don't leave a blank comment you twat.");
				if (!this.get('isLoggedIn')) return this.authMessage();
				
				var newComment = {
					comment: text,
					postedBy: this.get('currentUser.name'),
					createdAt: new Date()
				};

				console.log(newComment, entryId);

				var comm = this.store.createRecord('comment', newComment);
				this.store.find('listen', entryId).then(function(entry){
					entry.get('comments').then(function(comments){
						comments.pushObject(comm)
						entry.save();
					})
				})

				comm.save();
				
			},
		},

		makeFiveSongLink: function () {
			var link = 'spotify:trackset:';

			if (this.get('name')) link = link + this.get('name') + ':';
			else link = link + "5-Jim-Jams:" 

			if (this.get('spotifyOne')) link = link + this.get('spotifyOne').replace('spotify:track:', '');
			if (this.get('spotifyTwo')) link = link + ',' + this.get('spotifyTwo').replace('spotify:track:', '');
			if (this.get('spotifyThree')) link = link + ',' + this.get('spotifyThree').replace('spotify:track:', '');
			if (this.get('spotifyFour')) link = link + ',' + this.get('spotifyFour').replace('spotify:track:', '');
			if (this.get('spotifyFive')) link = link + ',' + this.get('spotifyFive').replace('spotify:track:', '');

			return link;
			
		},

		clearForm: function () {
			this.set('name', '');
			this.set('review', '');
			this.set('spotify', '');
			this.set('spotifyOne', '');
			this.set('spotifyTwo', '');
			this.set('spotifyThree', '');
			this.set('spotifyFour', '');
			this.set('spotifyFive', '');
		},
	
	});

	
	App.MusicController = Ember.ArrayController.extend({
		needs: ['auth'],
		isLoggedIn: Ember.computed.alias('controllers.auth.authed'),
		currentUser: Ember.computed.alias('controllers.auth.currentUser'),
		showingSortButtons: true,
		favorites: false,
		showModal: false,
		sortAscending: false,
		sortProperties: ['createdAt'],
		musicType: ['Song', 'Music Video', 'Live Performance'],
		selectedMusicType: 'Song',
		query: '',
		
		formFields: [
			{name: 'type', select: true, options: ['Song', 'Music Video', 'Live Performance'], selected: 'Song', header: 'Fill this out...', dividerStart: true},
			{name: 'spotifyLink', display: 'Spotify URI', placeholder: 'e.g. spotify:track:4SenxwCmSCIXfklUvmXyNc', videoHelp: '/public/spotify-click-uri.mp4', spotify: true},
			{name: 'youTubeLink', display: 'YouTube Link', placeholder: 'e.g. https://www.youtube.com/watch?v=mKVARXSHZD8', videoHelp: '/public/youtube-click-uri.mp4'},
			{name: 'comment', display: 'Review', textarea: true, placeholder: 'What\'s good...', dividerEnd: true},
			{name: 'title', header: 'And this..', dividerStart: true},
			{name: 'artist'},
			{name: 'album'},
			{name: 'year', dividerEnd: true},
			{name: 'soundCloudLink', header: 'Optional', display: 'SoundCloud Embed Link', placeholder: 'e.g. https://soundcloud.com/titus...', videoHelp: '/public/soundcloud-click-uri.mp4', videoOrientation: 'left', dividerStart: true},
			{name: 'external_source', placeholder: 'Pitchfork, A.V. Club, Rolling Stone...'},
			{name: 'external_score', placeholder: 'Rating...', dividerEnd: true}
		],

	  	filteredContent: function (){
  			var filter = this.get('query');
		    var rx = new RegExp(filter, 'gi');
		    var music = this.get('arrangedContent');

		    var tunes = music.filter(function(song) {
		      	
		      	if (this.get('showOnlyVideos'))
		      		if (song.get('type') === 'Song') return;

		      	if (this.get('favorites'))
		      		if (this.get('currentUser.favorites').indexOf(song.get('id')) == -1) return;

		      	if (this.get('currentUser.follows'))
		      		if (this.get('currentUser.follows').indexOf(song.get('submittedByID')) == -1) return;

		      	return song.get('title').match(rx) || song.get('artist').match(rx) || song.get('album').match(rx) || song.get('submittedBy').match(rx) || song.get('year').toString().match(rx) || song.get('type').toString().match(rx);
		    
		    }.bind(this));

		    tunes = tunes.map(function(tune){
		    	tune.set('dividerStart', false);
		    	tune.set('dividerEnd', false);
		    	return tune;
		    });

		    tunes = tunes.slice(0, 20);

		    this.gatherPlayAllLinks(tunes);

		    var tunes_one = [];
		    var tunes_two = [];
		    var tunes_three = [];

		    for (var i = 0; i < tunes.length; i++) {
				if (tunes_one.length === tunes_two.length && tunes_one.length === tunes_three.length) tunes_one.push(tunes[i]);
				else if (tunes_one.length > tunes_two.length) tunes_two.push(tunes[i]);
				else tunes_three.push(tunes[i]);
			};

			function divide (arr) {
				if (arr.length) {
					arr[0].set('dividerStart', true);
					arr[arr.length - 1].set('dividerEnd', true);
				}
				return arr;
			}

			return divide(tunes_one).concat(divide(tunes_two)).concat(divide(tunes_three));

	  	}.property('arrangedContent', 'query', 'sortAscending', 'length', 'showOnlyVideos', 'currentUser.favorites', 'currentUser.follows', 'favorites'),
		
		actions: {
			closeForm: function () {
				this.set('showingForm', false);
				this.set('showingModal', false);
			},

			closePlayer: function () {
				$('.player-container').html('');
				this.set('playingTracks', false);
				this.set('playingAll', false);
				this.set('playingAllSpotify', false);
				this.set('showingModal', false);
				this.set('showingVideo', false);
			},

			editWhole: function (id) {
				this.transitionToRoute('tune', id);
			},

			favorite: function (songID) {
				var user_id = this.get('currentUser').identity;
				
				this.store.find('user', user_id).then(function(user){
					
					var favorites = user.get('favorites');
					songID += ',';
					
					if (favorites.length < 50) favorites = favorites.replace('null', '');

					if (favorites.indexOf(songID) != -1) favorites = favorites.replace(songID, '');
					else favorites += songID;

					this.set('currentUser.favorites', favorites);
					user.set('favorites', favorites);
					user.save();
					
				}.bind(this));

			},

			formData: function (data) {
				if (!this.get('isLoggedIn')) return alert("Login to make a submission, pooper.");
				if (!data.title) return alert("No title? Goddamn you.");
				if (!data.artist) return alert("No artist? Goddamn you.");
				if (!data.album) return alert("No album? Goddamn you.");
				if (data.youTubeLink || data.spotifyLink || data.soundCloudLink) {
					
					if(data.youTubeLink)
						data['youTubeLink'] = (data['youTubeLink'].indexOf('www') != -1) ? data['youTubeLink'].split('=')[1] : data['youTubeLink'];
					data['year'] = parseInt(data.year);
					data['submittedBy'] = this.get('currentUser.name'),
					data['submittedByEmail'] = this.get('currentUser.email'),
					data['submittedByID'] = this.get('currentUser.identity'),
					data['createdAt'] = new Date();

					var musicEntry = this.store.createRecord('music', data);
					
					musicEntry.save().then(function(){
						this.clearForm();
						this.send('closeForm');
						console.log("New music added!", musicEntry);
					}.bind(this))
				
				}
				else {
					return alert("Submit a music link you abyssopelagic urchin.");
				}

			},

			playAllSpotify: function () {
				

				this.get('controllers.auth').send('playRequest', {embedLink: this.get('playAllSpotifyLinks'), type_of_play: 'all_spotify'});
			},

			playAllYoutube: function () {
				this.get('controllers.auth').send('playRequest', {all_songs_array: this.get('playAllLinks'), type_of_play: 'all_youtube'});
			},

			loadPlayer: function(playObject){
				
				if (playObject.linkType == 'video') {
					this.set('showingModal', true);
					this.set('showingVideo', true);
					this.set('videoWatchLink', playObject.link)
					return;
				}
				else if (playObject.linkType == 'spotify') playObject['embedLink'] = '<iframe id="iframe-player" src="https://embed.spotify.com/?uri=' + playObject.link + '" width="100%" height="80" frameborder="0" allowtransparency="true"></iframe>';
				else if (playObject.linkType == 'youtube') playObject['embedLink'] = '<iframe src="//www.youtube.com/embed/' + playObject.link + '?autoplay=1" width="100%" height="32" frameborder="0" allowfullscreen></iframe>';
				else if (playObject.linkType == 'soundcloud') playObject['embedLink'] = '<iframe id="iframe-player" width="100%" height="120" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=' + playObject.link + '&amp;auto_play=true&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true"></iframe>';
				else return alert('Link is broken');

				playObject['type_of_play'] = 'single';
				this.get('controllers.auth').send('playRequest', playObject);

			},

			playAll: function () {

				
				var playObject = {};
				//playObject['embedLink'] = '<iframe src="https://embed.spotify.com/?uri="' + this.get('playAllSpotifyLinks') + '" width="100%" height="" frameborder="0" allowtransparency="true"></iframe>';
				playObject['embedLink'] = this.get('playAllLinks');
				playObject['type_of_play'] = 'all_youtube';
				this.get('controllers.auth').send('playRequest', playObject);

				return;

				var all_links = this.get('playAllLinks');
				var current_number = this.get('currentTrackNumber');

				if (all_links.length === 0) return;
				if (current_number >= all_links.length - 1) {
					this.set('currentTrackNumber', 0);
					current_number = 0;
				}

				function onPlayerStateChange (event) {
				    if (event.data === YT.PlayerState.ENDED)
				    	$('.play-next-btn').click();
				    if (event.data === YT.PlayerState.PLAYING) {}
				   	if (event.data === YT.PlayerState.PAUSED) {}
    			}

    			var vidId = all_links[current_number]['youTubeLink'];
    			this.set('currentPlay', all_links[current_number]);

    			$('.player-container').html('<iframe id="player_'+vidId+'" width="100%" height="32" src="//www.youtube.com/embed/' + vidId + '?enablejsapi=1&autoplay=1&autohide=0" frameborder="0" allowfullscreen></iframe>');
            
		        new YT.Player('player_'+vidId, {
		            events: {
		                'onStateChange': onPlayerStateChange
		            }
		        });


				// this.send('closePlayer');
				// this.set('playingTracks', true);
				// this.set('playingAll', true);

				// var all_links = this.get('playAllLinks');
				// var current_number = this.get('currentTrackNumber');

				// if (all_links.length === 0) return;
				// if (current_number >= all_links.length - 1) {
				// 	this.set('currentTrackNumber', 0);
				// 	current_number = 0;
				// }

				// function onPlayerStateChange (event) {
				//     if (event.data === YT.PlayerState.ENDED)
				//     	$('.play-next-btn').click();
				//     if (event.data === YT.PlayerState.PLAYING) {}
				//    	if (event.data === YT.PlayerState.PAUSED) {}
    // 			}

    // 			var vidId = all_links[current_number]['youTubeLink'];
    // 			this.set('currentPlay', all_links[current_number]);

    // 			$('.player-container').html('<iframe id="player_'+vidId+'" width="100%" height="32" src="//www.youtube.com/embed/' + vidId + '?enablejsapi=1&autoplay=1&autohide=0" frameborder="0" allowfullscreen></iframe>');
            
		  //       new YT.Player('player_'+vidId, {
		  //           events: {
		  //               'onStateChange': onPlayerStateChange
		  //           }
		  //       });

			},

			// playAllSpotify: function () {
			// 	this.send('closePlayer');
			// 	this.set('playingAllSpotify', true);
			// },

			playNext: function () {
				this.set('currentTrackNumber', (this.get('currentTrackNumber') + 1));
				this.send('playAll');
			},

			playPrevious: function () {
				if (this.get('currentTrackNumber') > 0)
					this.set('currentTrackNumber', (this.get('currentTrackNumber') - 1));
				this.send('playAll');
			},

			scrollUp: function () {
				$("html, body").animate({ scrollTop: 0 }, "slow");
			},

			showSortButtons: function () {
				this.set('showingSortButtons', !this.get('showingSortButtons'));
			},

			sortBy: function(property) {
			    this.set('sortProperties', [property]);
			    this.set('sortAscending', !this.get('sortAscending'));
    		},

    		submittingComment: function (text, entryId) {
				if (!text) return alert("Don't leave a blank comment you twat.");
				if (!this.get('isLoggedIn')) return this.authMessage();
				
				var newComment = {
					comment: text,
					postedBy: this.get('currentUser.name'),
					createdAt: new Date()
				};

				var comm = this.store.createRecord('comment', newComment);
				this.store.find('music', entryId).then(function(entry){
					entry.get('comments').then(function(comments){
						comments.pushObject(comm)
						entry.save();
					})
				})

				comm.save();
				
			},

			toggleShowFavorites: function () {
				this.set('favorites', !this.get('favorites'));
			},

			toggleShowForm: function () {
				if (!this.get('isLoggedIn')) return this.authMessage();
				
				this.clearForm();

				this.set('showingModal', true);
				this.set('showingForm', true);

			},

			toggleShowOnlyVideos: function(){
				this.set('showOnlyVideos', !this.get('showOnlyVideos'));
			},

			updatingEntry: function (update) {
				this.store.find('music', update.identity).then(function(entry){
					if (update.field === 'year')
						entry.set('year', parseInt(update.newValue.replace('(', '').replace(')', '')));
					else 
						entry.set(update.field, update.newValue);

					entry.save();
				});
			}

		},

		authMessage: function () {
			if (!this.get('isLoggedIn')) return alert('Please sign in. Gracias.');
		},

		clearForm: function () {
			this.set('selectedMusicType', 'Song');
			this.set('title', '');
			this.set('artist', '');
			this.set('album', '');
			this.set('year', '');
			this.set('comment', '');
			this.set('youTubeLink', '');
			this.set('spotifyLink', '');
			this.set('soundCloudLink', '');
			this.set('limitSpotifyCalls', false);
		},

		gatherPlayAllLinks: function (filteredModel) {
			var playAllLinks = [];
			var playAllSpotifyLinks = 'spotify:trackset:All Jams:'

		    filteredModel.forEach(function(entry){ 
		    	if (entry.get('youTubeLink')) 
		    		playAllLinks.push({youTubeLink: entry.get('youTubeLink'), title: entry.get('title'), artist: entry.get('artist')})
		    	if (entry.get('spotifyLink')) {
		    		var arr = entry.get('spotifyLink').split(':');
		    		playAllSpotifyLinks += arr[arr.length - 1] + ',';
		    	}
		    		
		    });

		    this.set('playAllSpotifyLinks', playAllSpotifyLinks);
		    this.set('playAllLinks', playAllLinks);
		    this.set('currentTrackNumber', 0);
		},

	});	

	
	App.PodcastController = Ember.ArrayController.extend({
		needs: ['auth'],
		isLoggedIn: Ember.computed.alias('controllers.auth.authed'),
		currentUser: Ember.computed.alias('controllers.auth.currentUser'),
		showingForm: false,
		showingModal: false,
		sortAscending: false,
		sortProperties: ['createdAt'],

		formFields: [
			{name: 'podcastName', display: 'Podcast'},
			{name: 'episodeTitle', display: 'Episode', placeholder: 'Title or subject...'},
			{name: 'embedLink', display: 'Embed Link', textarea: true, placeholder: 'E.g. <embed src="http://www.npr.org/v2/?i=365222419&#...'},
			{name: 'review', display: 'Review', textarea: true, placeholder: 'What\'s good?'},	
		],

		actions: {
			
			closeForm: function () {
				this.set('showingForm', false);
				this.set('showingModal', false);
			},

			formData: function (data) {
				if (!data.podcastName || !data.episodeTitle || !data.embedLink) return alert('Name, title, and link, you quivering codpiece.');

				data['submittedBy'] = this.get('currentUser.name'),
				data['submittedByEmail'] = this.get('currentUser.email'),
				data['submittedByEmail'] = this.get('currentUser.identity'),
				data['createdAt'] = new Date();
				
				var podcastEntry = this.store.createRecord('podcast', data);
				podcastEntry.save().then(function(){
					this.send('closeForm');
				}.bind(this));
				
			},

			play: function (param) {
				param['type_of_play'] = 'podcast';
				this.get('controllers.auth').send('playRequest', param);
			},

			showForm: function () {
				this.set('showingForm', true);
				this.set('showingModal', true);
			}
		}
	});

	
	App.TuneController = Ember.ObjectController.extend({
		
		musicType: ['Song', 'Music Video', 'Live Performance'],

		actions: {
			
			saveUpdate: function () {
				this.store.find('music', this.get('id')).then(function(entry){
					entry.set('type', this.get('type'));
					entry.set('title', this.get('title'));
					entry.set('artist', this.get('artist'));
					entry.set('album', this.get('album'));
					entry.set('year', parseInt(this.get('year')) || 0);
					entry.set('comment', this.get('comment'));
					entry.set('external_source', this.get('external_source'));
					entry.set('external_score', this.get('external_score'));
					entry.set('youTubeLink', (this.get('youTubeLink').indexOf('www') != -1 ) ? this.get('youTubeLink').split('=')[1] : this.get('youTubeLink'));
					entry.set('spotifyLink', this.get('spotifyLink'));
					entry.set('soundCloudLink', this.get('soundCloudLink'));
					entry.save().then(function(){
						this.transitionToRoute('home');
					}.bind(this))
				}.bind(this));
			},
			
			cancelUpdate: function () {
				this.transitionToRoute('music');
			}
		}
	
	});


	App.UsersController = Ember.ArrayController.extend({      
		needs: ['auth'],
		isLoggedIn: Ember.computed.alias('controllers.auth.authed'),
		currentUser: Ember.computed.alias('controllers.auth.currentUser'),
		query: '',

		filteredContent: function () {
			var filter = new String(this.get('query')).toString();
		    var rx = new RegExp(filter, 'gi');//'gi' == global and case-insensitive
		    var music = this.get('arrangedContent');//Ember property referring to current model

		    var users = music.filter(function(user) {
		      	user.set('isFollowing', false);
		      	if (user.get('email') === this.get('currentUser.email')) return;
		      	return user.get('firstName').match(rx) || user.get('lastName').match(rx);
		    }.bind(this));

		    users.map(function(user){
		    	if (this.get('currentUser.follows'))
		    		if (this.get('currentUser.follows').indexOf(user.get('id') + ',') != -1) 
		    			user.set('isFollowing', true);
		    	return user;
		    }.bind(this));

		   return users;
	  	
	  	}.property('arrangedContent', 'query', 'sortAscending', 'length', 'currentUser.follows'),

		actions: {
			follow: function (param) {
				
				this.store.find('user', this.get('currentUser.identity')).then(function(user){
					
					var following = user.get('follows') || '';
					var new_user_to_follow = param.id + ',';
					
					if (following.length < 30) following = following.replace('null', '');

					if (following.indexOf(new_user_to_follow) != -1) 
						following = following.replace(new_user_to_follow, '');
					else 
						following += new_user_to_follow;

					this.set('currentUser.follows', following);
					user.set('follows', following);
					user.save();
					
				}.bind(this));
			},

			toUser: function (id) {
				console.log(id);
				this.transitionToRoute('user', id);
			}
		}
	});

	
	App.UserController = Ember.ObjectController.extend({      
		needs: ['auth'],
		isLoggedIn: Ember.computed.alias('controllers.auth.authed'),
		currentUser: Ember.computed.alias('controllers.auth.currentUser'),
		mySongs: [],

		userSongs: function () {
			this.store.find('music').then(function(data){
				
				var me = data.content.filter(function(song){
					return song.get('submittedByEmail') == this.get('email');
				}.bind(this));
				
				this.set('mySongs', me.reverse());
			
			}.bind(this));
		}.observes('email')
	});

	
	
	






	//HELPERS --------------------
	Ember.Handlebars.registerBoundHelper('format-date', function(date) {
  		return moment(date).fromNow();
	});

	Ember.Handlebars.registerBoundHelper('format-shortdate', function(date) {
  		return moment(date).format('l');
	});


	




















	//GRAVEYARD ---------------------------------
	App.WritingController = Ember.ArrayController.extend({

		isShowingForm: false,

		filteredContent: function(){

		    var filter = this.get('query');
		    var rx = new RegExp(filter, 'gi');
		    var writing = this.get('arrangedContent');

		    var jams = writing.filter(function(piece) {
		      	return piece.get('name').match(rx) || piece.get('author').match(rx) || piece.get('snippet').match(rx) || piece.get('submittedBy').match(rx) || piece.get('review').match(rx);
		    });

			return jams;

	  	}.property('arrangedContent', 'query', 'length'),
		
		actions: {

			showWritingForm: function () { 
				this.toggleProperty('isShowingForm');
			},

			submitWriting: function () {
					
				var newWriting = {
					title: this.get('title'),
					author: this.get('author'),
					snippet: this.get('snippet'),
					review: this.get('review'),
					text: this.get('text')
				}

				newWriting['createdAt'] = new Date();
				newWriting['submittedBy'] = 'Brendan Brown';

				console.log(newWriting);

				var writingEntry = this.store.createRecord('writing', newWriting);

				writingEntry.save().then(function(){
					console.log("Success?");
				}.bind(this))
				
			}
		}
	});

	App.MoviesController = Ember.ArrayController.extend({
		sortAscending: false,

		ajaxHammer: function (obj) {
			 return Em.$.ajax(obj).then(function(results){
				return results;
			});
		},
		
		actions: {
			toggleShowForm: function () {
				this.toggleProperty('showForm');
			},

			grabMovie: function() {
				this.set('poster', false);
				var key = "m3bsv9nk3t6k4xe3yn7qn87x"
				var title = this.get('title');
				var url = "https://api.rottentomatoes.com/api/public/v1.0/movies.json?apikey=" + key + "&q=" + title + "&page_limit=1";
				var obj = {url: url, dataType: 'jsonp'};
				
				this.ajaxHammer(obj).then(function(result){
					this.ajaxHammer({url: 'https://api.rottentomatoes.com/api/public/v1.0/movies/' + result.movies[0].id + '.json?apikey=' + key, dataType: 'jsonp'}).then(function(movie){
						console.log(movie);
						var cast = '';
						movie.abridged_cast.forEach(function(actor){
							cast += actor.name + ', ';
						})
						cast = cast.substring(0, cast.length - 2)
						cast
						var movieObj = {
							rtID: movie.id,
							title: movie.title,
							year: movie.year,
							mpaa_rating: movie.mpaa_rating,
							poster: movie.posters.original,
							critics_rating: movie.critics_rating,
							critics_score: movie.ratings.critics_score,
							runtime: movie.runtime,							
							cast: cast,
							director: movie.abridged_directors[0].name,
							studio: movie.studio,
							synopsis: movie.synopsis
						}
						
						this.set('poster', true);
						this.set('currentMovie', movieObj);

					}.bind(this))
				}.bind(this));
			},

			submitMovie: function(){
				
				var newMovie = this.get('currentMovie');
				newMovie['createdAt'] = new Date();
				newMovie['comment'] = this.get('comment');
				newMovie['submittedBy'] = 'Brendan Brown';
				newMovie['trailer_url'] = this.get('trailer_url');
				newMovie['big_poster'] = this.get('big_poster');

				console.log(newMovie);

				var movieEntry = this.store.createRecord('movie', newMovie);

				movieEntry.save().then(function(){
					this.set('currentMovie', null);
					this.set('title', '');
				}.bind(this))
				
			}
		}
		
	});

	


})();
