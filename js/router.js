(function () {
	
	'use strict';
	
	//CONNECTION TO FIREBASE --------------------------------------------
	App.ApplicationAdapter = DS.FirebaseAdapter.extend({
		firebase: new Firebase('https://thejams.firebaseio.com')
	});


	//ROUTER ------------------------------------------------------------
	App.Router.map(function(){
		this.resource('listen');
		this.resource('movie');
		this.resource('film', {path: '/movies/:movie_id'});
		this.resource('music');
		this.resource('netflix');
		this.resource('podcast');
		this.resource('tune', {path: '/tune/:tune_id'});
		this.resource('update');
		this.resource('users');
		this.resource('user', {path: '/users/:user_id'});
	});

	
	//ROUTES ------------------------------------------------------------
	App.ApplicationRoute = Ember.Route.extend({
		controllerName: 'auth'
	});

	App.FilmRoute = Ember.Route.extend({
		model: function (param) {
			return this.store.find('movie', param.movie_id);
		}
	});

	App.IndexRoute = Ember.Route.extend({
		controllerName: 'auth'
	});

	App.ListenRoute = Ember.Route.extend({
		model: function () {
			return this.store.findAll('listen');
		}
	});

	App.MovieRoute = Ember.Route.extend({
		model: function () {
			return this.store.findAll('movie');
		}
	});

	App.MusicRoute = Ember.Route.extend({
		model: function () {
			return this.store.findAll('music');
		}
	});

	App.NetflixRoute = Ember.Route.extend({
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
			return this.store.find('user', param.user_id);
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

	  	tagsFinder: function () {
	  		this.store.findAll('tag').then(function(tags){
	  			var collection = tags.map(function(tag){
	  				return tag.get('name');
	  			});
	  			this.set('tagsCollections', collection);
	  		}.bind(this));
	  	}.on('init'),

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
		        });
		    },

		    logout: function() {
		        this.authClient.logout();
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

		        if (!firstName || !lastName) return alert("Your NAME, madam.");
		        if (confirm !== password) return alert("Passwords don't match you bumbling rump-roast.")
		        
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


	App.FilmController = Ember.ObjectController.extend({
		formFields: function () {
			var fields = this.get('model').get('_data');
			var ne = ['Response', 'createdAt', 'reviews', 'id'];
			var arr = [];

			for (var prop in fields) {
				if (ne.indexOf(prop) == -1) 
					if (prop == 'Plot' || prop == 'tomatoConsensus')
						arr.pushObject({name: prop, text: fields[prop], textarea: true});
					else
						arr.pushObject({name: prop, text: fields[prop]});
			}

			return arr;
		}.property('willInsertElement'),

		actions: {
			
			formData: function (data) {
				var model = this.get('model');
				for (var prop in data) {
					this.set(prop, data[prop]);
				}
				model.save().then(function(){
					this.transitionToRoute('movie');
				}.bind(this));
			},
			
			closeForm: function () {
				this.transitionToRoute('movie');
			},
			
			deleteMovie: function () {
				this.get('model').destroyRecord().then(function(){
					this.transitionToRoute('movie');
				}.bind(this));
			}
		}
	});



	App.ListenController = Ember.ArrayController.extend({
		needs: ['auth'],
		isLoggedIn: Ember.computed.alias('controllers.auth.authed'),
		currentUser: Ember.computed.alias('controllers.auth.currentUser'),
		query: '',
		showingForm: false,
		showingModal: false,
		sortAscending: false,
		sortProperties: ['createdAt'],

		formFields: [
			{name: 'type', select: true, options: ['Album', 'Playlist', 'Song Set'], selected: 'Album', dividerStart: true, header: 'Fill this out...'},
			{name: 'name'},
			{name: 'artist'},
			{name: 'review', display: 'Thoughts?', textarea: true},
			{name: 'spotifyLinkOne', display: 'Spotify URI', dividerEnd: true},
			{name: 'spotifyLinkTwo', display: '2nd Spotify URI', dividerStart: true, header: 'For Song Set Only'},
			{name: 'spotifyLinkThree', display: '3rd Spotify URI'},
			{name: 'spotifyLinkFour', display: '4th Spotify URI'},
			{name: 'spotifyLinkFive', display: '5th Spotify URI', dividerEnd: true}
		],

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
		    var rx = new RegExp(filter, 'gi');
		    var music = this.get('arrangedContent');

		    var tunes = music.filter(function(song) {
		      	if (song.get('type') == type)
		      		return song.get('name').match(rx) || song.get('artist') ? song.get('artist').match(rx) : false || song.get('submittedBy').match(rx) || song.get('type').toString().match(rx);
		    });

		   return tunes;
	  	},
		
		actions: {
			closeForm: function () {
				this.set('showingForm', false);
				this.set('showingModal', false);
			},

			showForm: function () {
				if (!this.get('isLoggedIn')) return this.authMessage();
				this.set('showingModal', true);
				this.set('showingForm', true);
			},

			formData: function (data) {
				if (!data.name) return alert("A title, madam.");
				if (!data.review) return alert("A description, madam.");
				if (!data.spotifyLinkOne) return alert("Did you even submit a link, madam?");

				if (data.type === 'Album' || data.type === 'Playlist') data['spotifyLink'] = data['spotifyLinkOne']
				else data['spotifyLink'] = this.makeFiveSongLink(data);

				data['submittedBy'] = this.get('currentUser.name'),
				data['submittedByEmail'] = this.get('currentUser.email'),
				data['submittedByID'] = this.get('currentUser.identity'),
				data['createdAt'] = new Date();
				['spotifyLinkOne', 'spotifyLinkTwo', 'spotifyLinkThree', 'spotifyLinkFour', 'spotifyLinkFive'].forEach(function(field){
					delete data[field];
				});

				this.submitListen(data);
				this.send('closeForm');

			},

			submittingComment: function(text, entryId){
				if (!text) return alert("Don't leave a blank comment you twat.");
				if (!this.get('isLoggedIn')) return this.authMessage();
				
				var newComment = {
					comment: text,
					postedBy: this.get('currentUser.name'),
					submittedByID: this.get('currentUser.identity'),
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

		makeFiveSongLink: function (data) {
			var link = 'spotify:trackset:Song-Set:';

			if (data['spotifyLinkOne']) link = link + data['spotifyLinkOne'].replace('spotify:track:', '');
			if (data['spotifyLinkTwo']) link = link + ',' + data['spotifyLinkTwo'].replace('spotify:track:', '');
			if (data['spotifyLinkThree']) link = link + ',' + data['spotifyLinkThree'].replace('spotify:track:', '');
			if (data['spotifyLinkFour']) link = link + ',' + data['spotifyLinkFour'].replace('spotify:track:', '');
			if (data['spotifyLinkFive']) link = link + ',' + data['spotifyLinkFive'].replace('spotify:track:', '');

			return link;	
		},

		submitListen: function (newListen) {
			var listenEntry = this.store.createRecord('listen', newListen);
			listenEntry.save().then(function(data){
				console.log("Success!", data);
			}.bind(this))
		},
	
	});


	App.MovieController = Ember.ArrayController.extend({
		needs: ['auth'],
		currentUser: Ember.computed.alias('controllers.auth.currentUser'),
		query: '',
		results: 0,
		resultsLimit: 35,
		sortAscending: false,
		sortProperties: ['createdAt'],
		year: '',

		activatePopovers: function () {
			Em.run.later(function(){
				$("[data-toggle='popover']").popover();
			}, 2000);
		}.on('init'),

		filteredContent: function () {
			var filter = new String(this.get('query')).toString();
		    var rx = new RegExp(filter, 'gi');
		    var movies = this.get('arrangedContent').filter(function(movie) {

		      	if (!movie.get('Title') || movie.get('Type') !== 'movie') return;
		      	if (this.get('sortProperties')[0] === 'tomatoMeterNumeric' && movie.get('tomatoMeter') === 'N/A') return;

		      	if (this.get('year')) {
		      		var filterYear = new String(this.get('year')).toString();
		    		var rxY = new RegExp(filterYear, 'gi');
		    		if (!movie.get('Year').match(rxY)) return;
		      	}
		      	return movie.get('Title').match(rx) || movie.get('Year').match(rx) || movie.get('Director').match(rx) || movie.get('Genre').match(rx) || movie.get('Actors').match(rx);
		    
		    }.bind(this));

		    this.set('results', movies.length);
		    this.activatePopovers();
		    return movies.slice(0, this.get('resultsLimit'));
	  	
	  	}.property('arrangedContent', 'query', 'year', 'sortAscending', 'length', 'resultsLimit'),

	  	actions: {
	  		
	  		addRating: function (id, title) {
	  			
	  			var selector = '#' + id + '-movie-review'; //empty movie review div
	  			var elementAlreadyPresent = $(selector + ' .submit-rating'); // if you double click a rate button, it should appear, then disappear
	  			var info = {text: '', rating: '0', selector: selector, movie: null, review: null}

	  			this.store.find('movie', id).then(function(movie){
		  			movie.get('reviews').then(function(reviews){
		  				var existingReview = reviews.findBy('submittedByID', this.get('currentUser.identity'));
	  					if (existingReview) {
	  						info.text = existingReview.get('review') || '';
	  						info.rating = existingReview.get('rating').toString();
	  						info.review = existingReview;	
	  					}
	  					
	  					info.movie = movie;
	  					info.id = id;
	  					$('.movie-review-box').html('');
	  					if (!elementAlreadyPresent.length) this.appendingRatingForm(info);	

		  			}.bind(this));
		  		}.bind(this));
	  			
	  		},

	  		checkMovie: function () {	
	  			if (this.get('filteredContent').findBy('title', this.get('query')) || !this.get('query').length) return;
	  			
	  			var link = this.get('year') ? "http://www.omdbapi.com/?t=" + this.get('query') + "&y=" + this.get('year') + "&plot=short&tomatoes=true&r=json" : "http://www.omdbapi.com/?t=" + this.get('query') + "&y=&plot=short&tomatoes=true&r=json";

	  			$.get(link).then(function(result){
			    	result['createdAt'] = new Date();

			    	var movieEntry = this.store.createRecord('movie', result);
					movieEntry.save().then(function(data){
						console.log("Success!", data);
					}.bind(this))

			  	}.bind(this), function (error) {
			  		console.log(error);
			  	}.bind(this));

	  		},

	  		editMovie: function (param) {
	  			this.transitionToRoute('film', param);
	  		},

	  		loadMore: function () {
	  			this.set('resultsLimit', this.get('resultsLimit') + 10);
	  		},

	  		sortBy: function (field) {
	  			this.set('sortProperties', [field]);
	  			this.set('sortAscending', !this.get('sortAscending'));
	  		}
	  	},

	  	appendingRatingForm: function (info) {
	  		var that = this;
	  		$(info.selector).append('<textarea placeholder="Review (Optional)">' + info.text + '</textarea><input type="number" value="' + info.rating + '" placeholder="Out of 5"/><button class="submit-rating">Done</button>');
  			$(info.selector + ' .submit-rating').click(function(){
  				var review = $(info.selector + ' textarea').val();
  				var rating = $(info.selector + ' input').val();
  				var obj = {review: review, rating: parseInt(rating), title: info.movie.get('Title'), createdAt: new Date()};
  				that.submitReview(obj, info);
  			});
	  	},

	  	submitReview: function (newReview, info) {
	  		if (info.review) {
	  			info.review.set('review', newReview.review);
	  			info.review.set('rating', parseInt(newReview.rating));
	  			info.review.save();
	  		} 
	  		else {
	  			newReview['submittedBy'] = this.get('currentUser.name');
				newReview['submittedByEmail'] = this.get('currentUser.email');
				newReview['submittedByID'] = this.get('currentUser.identity');

		  		var rev = this.store.createRecord('review', newReview);

		  		info.movie.get('reviews').then(function(reviews){
	  				reviews.pushObject(rev);
	  				info.movie.save();
	  			});

		  		rev.save();
	  		}

	  		this.send('addRating', info.id);
	  	}
	});

	App.NetflixController = Ember.ArrayController.extend({
		needs: ['auth'],
		currentUser: Ember.computed.alias('controllers.auth.currentUser'),
		netflixData: '',
		uploadComplete: false,

		transformToArray: function (data) {
			var arr = [];
			var name = this.get('currentUser.name');
			var email = this.get('currentUser.email');
			var identity = this.get('currentUser.identity');
			
			for (var prop in data) {
				var obj = {
					title: prop,
					rating: data[prop],
					submittedByID: identity,
					submittedByEmail: email,
					submittedBy: name,
					createdAt: new Date()
				}
				arr.pushObject(obj);
			}
			return arr;
		},

		actions: {
			submitRatings: function () {
				var data;

				try {
					data = JSON.parse(this.get('netflixData'));
				} catch (error) {
					return alert("Didn't quite work...\n" + error.name + " : " + error.message);
				}

				if (!data) return alert("There doesn't seem to be any data...");

				var list = this.transformToArray(data);
				list.forEach(function(entry){
					var movie = this.get('model').findBy('Title', entry.title);
					if (movie) {
						var newReview = this.store.createRecord('review', entry);
						movie.get('reviews').then(function(reviews){
							reviews.pushObject(newReview);
						});
						movie.save()
						newReview.save();
					}
					else {
						console.log(entry);
					}
				}.bind(this));

				this.set('netflixData', '');
				this.set('uploadComplete', true);
			}
		}
	});

	
	App.MusicController = Ember.ArrayController.extend({
		needs: ['auth'],
		isLoggedIn: Ember.computed.alias('controllers.auth.authed'),
		currentUser: Ember.computed.alias('controllers.auth.currentUser'),
		showingSortButtons: true,
		favorites: false,
		songLimit: 20,
		showModal: false,
		sortAscending: false,
		sortProperties: ['createdAt'],
		query: '',
		
		formFields: [
			{name: 'type', select: true, options: ['Song', 'Music Video', 'Live Performance'], selected: 'Song', header: 'Enter one or more links...', dividerStart: true},
			{name: 'comment', display: 'Review', textarea: true, placeholder: 'What\'s good...'},
			{name: 'spotifyLink', display: 'Spotify URI', placeholder: 'e.g. spotify:track:4SenxwCmSCIXfklUvmXyNc', videoHelp: '/media/spotify-click-uri.mp4', spotify: true},
			{name: 'youTubeLink', display: 'YouTube Link', placeholder: 'e.g. https://www.youtube.com/watch?v=mKVARXSHZD8', videoHelp: '/media/youtube-click-uri.mp4'},
			{name: 'soundCloudLink', display: 'SoundCloud Embed Link', placeholder: 'e.g. https://soundcloud.com/titus...', videoHelp: '/media/soundcloud-click-uri.mp4', dividerEnd: true},
			{name: 'title', header: 'Add info:', dividerStart: true},
			{name: 'artist'},
			{name: 'album'},
			{name: 'year', dividerEnd: true},
			
		],

		newestDate: function (song) {
			var date = new Date('1/1/2000');
			song.get('comments').forEach(function(comment){
				if (comment.get('createdAt') > date) date = comment.get('createdAt');
			});
			
			if (date.getFullYear() === 2000) return song.get('createdAt');
			else return date;

		},

	  	filteredContent: function (){
  			var filter = this.get('query');
		    var rx = new RegExp(filter, 'gi');
		    var music = this.get('arrangedContent');

		    var tunes = music.filter(function(song) {
		      	
		      	if (this.get('currentUser.follows'))
		      		if (this.get('currentUser.follows').indexOf(song.get('submittedByID')) == -1) return;

		      	if (this.get('showOnlyVideos'))
		      		if (song.get('type') === 'Song') return;

		      	if (this.get('favorites'))
		      		if (this.get('currentUser.favorites').indexOf(song.get('id')) == -1) return;

		      	if (this.get('showRecent'))
		      		song.set('newestDate', this.newestDate(song));

		      	if (song.get('tags')) {
		      		var tags = [];
		      		song.get('tags').forEach(function(tag){
		      			tags.push(tag.get('name'));
		      		})
		      	}
		      		
		      	return song.get('title').match(rx) || song.get('artist').match(rx) || song.get('album').match(rx) || song.get('submittedBy').match(rx) || song.get('year').toString().match(rx) || song.get('type').toString().match(rx) || tags.join().match(rx);
		    
		    }.bind(this));

		    if (this.get('showRecent')) tunes = tunes.sortBy('newestDate').reverse()
		    tunes = tunes.slice(0, this.get('songLimit'));

		    tunes = tunes.map(function(tune){
		    	tune.set('dividerStart', false);
		    	tune.set('dividerEnd', false);
		    	return tune;
		    });

		    this.gatherPlayAllLinks(tunes);

		    if ($(window).width() <= 990)
				return divide(tunes);

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

	  	}.property('arrangedContent', 'query', 'sortAscending', 'length', 'showOnlyVideos', 'currentUser.favorites', 'currentUser.follows', 'favorites', 'songLimit', 'showRecent'),
		
		actions: {
			closeForm: function () {
				this.set('showingForm', false);
				this.set('showingModal', false);
			},

			editWhole: function (id) {
				this.transitionToRoute('tune', id);
			},

			favorite: function (songID) {
				var user_id = this.get('currentUser').identity;
				
				this.store.find('user', user_id).then(function(user){
					
					var favorites = user.get('favorites') || '';
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

			loadMoreSongs: function () {
				this.set('songLimit', this.get('songLimit') + 15);
			},

			loadPlayer: function(playObject){
				
				if (playObject.identity) {
					this.store.find('music', playObject.identity).then(function(song){
						var total = song.get('totalPlays');
						if (!total) total = 1
						else total = total + 1;
						song.set('totalPlays', total);
						song.save();
					})
				}

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
				playObject['embedLink'] = this.get('playAllLinks');
				playObject['type_of_play'] = 'all_youtube';
				this.get('controllers.auth').send('playRequest', playObject);

				return;
			},

			searchTag: function (tag) {
				if (this.get('query') === tag) this.set('query', '');
				else this.set('query', tag);

				this.send('scrollUp');
			}, 

			scrollUp: function () {
				$("html, body").animate({ scrollTop: 0 }, "slow");
			},

			showSortButtons: function () {
				this.set('showingSortButtons', !this.get('showingSortButtons'));
			},

			sortBy: function(property) {
			    this.set('sortProperties', [property]);

			    if (property === 'newestDate') this.set('sortAscending', true); 
			    else this.set('sortAscending', !this.get('sortAscending'));
    		},

    		submittingComment: function (text, entryId) {
				if (!text) return alert("Don't leave a blank comment you twat.");
				if (!this.get('isLoggedIn')) return this.authMessage();
				
				var newComment = {
					comment: text,
					postedBy: this.get('currentUser.name'),
					submittedByID: this.get('currentUser.identity'),
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

			submittingTag: function (text, entryId) {
				if (!text) return alert("Don't submit a blank tag you twat.");
				if (!this.get('isLoggedIn')) return this.authMessage();
				text = text.toLowerCase();

				var newTag = {name: text};
				var existingTag = null;
				var tag;

				this.store.find('tag').then(function(tags){
					if (tags.findBy('name', text)) existingTag = tags.findBy('name', text);
					else tag = this.store.createRecord('tag', newTag);
				
					this.store.find('music', entryId).then(function(entry){
						entry.get('tags').then(function(tags){
							if (existingTag)
								tags.pushObject(existingTag)
							else
								tags.pushObject(tag)
							entry.save();
						})
					})

					if (existingTag) existingTag.save();
					else tag.save();

				}.bind(this));

				
			},

			showForm: function () {
				if (!this.get('isLoggedIn')) return this.authMessage();
				this.set('showingModal', true);
				this.set('showingForm', true);
			},

			toggleSortOptions: function (field) {
				if (field === 'showRecent' && this.get('showRecent')) return this.removeSort();;
				this.removeSort(field);
				this.set(field, !this.get(field));
				if (field === 'showRecent') this.send('sortBy', 'newestDate');
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

		removeSort: function (field) {
			if (field !== 'favorites') this.set('favorites', false);
			if (field !== 'showOnlyVideos') this.set('showOnlyVideos', false);
			if (field !== 'showRecent') this.set('showRecent', false);
			this.set('query', '');
			this.set('sortAscending', false);
			this.set('sortProperties', ['createdAt']);
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
		query: '',

		formFields: [
			{name: 'podcastName', display: 'Podcast'},
			{name: 'episodeTitle', display: 'Episode', placeholder: 'Title or subject...'},
			{name: 'embedLink', display: 'Embed Link', textarea: true, placeholder: 'E.g. <embed src="http://www.npr.org/v2/?i=365222419&#...'},
			{name: 'review', display: 'Review', textarea: true, placeholder: 'What\'s good?'},	
		],

		filteredContent: function () {
			var filter = new String(this.get('query')).toString();
		    var rx = new RegExp(filter, 'gi');
		    var podcast = this.get('arrangedContent');
		    
		    return podcast.filter(function(cast) {
		      	return cast.get('submittedBy').match(rx) || cast.get('episodeTitle').match(rx) || cast.get('podcastName').match(rx);
		    }.bind(this));
	  	
	  	}.property('arrangedContent', 'query', 'sortAscending', 'length'),

		actions: {
			
			closeForm: function () {
				this.set('showingForm', false);
				this.set('showingModal', false);
			},

			formData: function (data) {
				if (!data.podcastName || !data.episodeTitle || !data.embedLink) return alert('Name, title, and link, you quivering codpiece.');

				data['submittedBy'] = this.get('currentUser.name'),
				data['submittedByEmail'] = this.get('currentUser.email'),
				data['submittedByID'] = this.get('currentUser.identity'),
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
						this.transitionToRoute('music');
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
		myListens: [],
		myPodcasts: [],

		userSongs: function () {
			this.store.find('music').then(function(data){
				var me = data.content.filter(function(song){
					return song.get('submittedByEmail') == this.get('email');
				}.bind(this));
				this.set('mySongs', me.reverse());
			}.bind(this));
		}.observes('email'),

		userListens: function () {
			this.store.find('listen').then(function(data){
				var me = data.content.filter(function(song){
					return song.get('submittedByEmail') == this.get('email');
				}.bind(this));
				this.set('myListens', me.reverse());
			}.bind(this));
		}.observes('email'),

		userPodcasts: function () {
			this.store.find('podcast').then(function(data){
				var me = data.content.filter(function(song){
					return song.get('submittedByEmail') == this.get('email');
				}.bind(this));
				this.set('myPodcasts', me.reverse());
			}.bind(this));
		}.observes('email'),

		actions: {
			loadSong: function (playObject) {
				if (playObject.get('spotifyLink')) playObject['embedLink'] = '<iframe id="iframe-player" src="https://embed.spotify.com/?uri=' + playObject.get('spotifyLink') + '" width="100%" height="80" frameborder="0" allowtransparency="true"></iframe>';
				else if (playObject.get('youTubeLink')) playObject['embedLink'] = '<iframe src="//www.youtube.com/embed/' + playObject.get('youTubeLink') + '?autoplay=1" width="100%" height="32" frameborder="0" allowfullscreen></iframe>';
				else if (playObject.get('soundCloudLink')) playObject['embedLink'] = '<iframe id="iframe-player" width="100%" height="120" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=' + playObject.get('soundCloudLink') + '&amp;auto_play=true&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true"></iframe>';
				else return alert('Link is broken');

				playObject['type_of_play'] = 'single';
				this.get('controllers.auth').send('playRequest', playObject);
			},
			
			loadListen: function (playObject) {
				playObject['type_of_play'] = 'single';
				playObject['embedLink'] = '<iframe id="iframe-player" src="https://embed.spotify.com/?uri=' + playObject.get('spotifyLink') + '" width="100%" height="80" frameborder="0" allowtransparency="true"></iframe>';
				this.get('controllers.auth').send('playRequest', playObject);
			},
			
			loadPodcast: function (param) {
				param['type_of_play'] = 'podcast';
				this.get('controllers.auth').send('playRequest', param);
			}
		}
	


	});



	//HELPERS --------------------
	Ember.Handlebars.registerBoundHelper('format-date', function(date) {
  		return moment(date).fromNow();
	});

	Ember.Handlebars.registerBoundHelper('format-shortdate', function(date) {
  		return moment(date).format('l');
	});

	var idMap = 
		{
			'Brendan Brown': '-J_42K3Bz5xrAY36aZg_',
			'Nick Ziemann': '-J_9pRMEbEA4aVAdAcGV',
			'Alex J': '-Jidnu-_pIoo2PfAwHaq',
			'Morgan Brown': '-Jjb8iBzQ5VMY8lZjs2E',
			'Matthew Brown': '-Jjb8iBzQ5VMY8lZjs2E'
		}	

	


})();
