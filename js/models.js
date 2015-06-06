(function(){
	'use strict';

	App.Comment = DS.Model.extend({
		comment: DS.attr('string'),
		postedBy: DS.attr('string'),
		submittedByID: DS.attr('string'),
		createdAt: DS.attr('date'),
		music: DS.hasMany('music'),
		listen: DS.hasMany('listen')
	});

	App.Listen = DS.Model.extend({	
		type: DS.attr('string'),
		name: DS.attr('string'),
		artist: DS.attr('string'),
		review: DS.attr('string'),
		spotifyLink: DS.attr('string'),
		submittedBy: DS.attr('string'),
		submittedByEmail: DS.attr('string'),
		createdAt: DS.attr('date'),
  		comments: DS.hasMany('comment', { async: true }),
  		tags: DS.hasMany('tag', { async: true })
	});

	App.Movie = DS.Model.extend({		
  		Actors: DS.attr('string'),
  		cast: function () {
  			return this.get('Actors').split(',').map(function(actor){
  				return {name: actor};
  			});
  		}.property('Actors'),
		Awards: DS.attr('string'), 
		Country: DS.attr('string'), 
		Director: DS.attr('string'),
		directors: function () {
			var d = this.get('Director');
			if (d.indexOf(',') === -1) return [{name: d}];
			return d.split(',').map(function(director){
  				return {name: director};
  			});
		}.property('Director'),
		Genre: DS.attr('string'),
		genres: function () {
  			return this.get('Genre').split(',').map(function(genre){
  				return {name: genre};
  			});
  		}.property('Actors'),
		Language: DS.attr('string'), 
		Metascore: DS.attr('string'), 
		Plot: DS.attr('string'), 
		bestPlot: function () {
			if (this.get('tomatoConsensus') && this.get('tomatoConsensus') !== 'N/A') return this.get('tomatoConsensus');
			return this.get('Plot');
		}.property(),
		Poster: DS.attr('string'), 
		Rated: DS.attr('string'), 
		Released: DS.attr('string'), 
		Response: DS.attr('string'), 
		Runtime: DS.attr('string'), 
		Title: DS.attr('string'), 
		Type: DS.attr('string'), 
		Writer: DS.attr('string'), 
		Year: DS.attr('string'), 
		yearNumeric: function () {
			return parseInt(this.get('Year'));
		}.property('year'),
		imdbID: DS.attr('string'), 
		imdbRating: DS.attr('string'), 
		imdbVotes: DS.attr('string'), 
		tomatoMeter: DS.attr('string'),
		tomatoMeterDisplay: function () {
			if (this.get('tomatoMeter') === 'N/A') return false
			return this.get('tomatoMeter') + '%';
		}.property('tomatoMeter'),
		tomatoMeterNumeric: function () {
			return parseInt(this.get('tomatoMeter'));
		}.property('tomatoMeter'),
		tomatoImageLink: function () {
			if (this.get('tomatoMeterNumeric') >= 60) return 'media/fresh.png';
			else return 'media/rotten.png';
		}.property('tomatoMeter'),
		tomatoRating: DS.attr('string'),
		tomatoConsensus: DS.attr('string'),
		createdAt: DS.attr('date'),
		reviews: DS.hasMany('review', { async: true }),
		tags: DS.hasMany('tag', { async: true })
	});

	App.Review = DS.Model.extend({
		createdAt: DS.attr('date'),
		rating: DS.attr('number'),
		stars: function () {
			var f = '<span class="glyphicon glyphicon-star" aria-hidden="true"></span>';
			var e = '<span class="glyphicon glyphicon-star-empty" aria-hidden="true"></span>';
			var n = this.get('rating');
			
			if (n <= 1.44) return f + e + e + e + e;
			if (n <= 2.44) return f + f + e + e + e;
			if (n <= 3.44) return f + f + f + e + e;
			if (n <= 4.44) return f + f + f + f + e;
			return f + f + f + f + f;
		
		}.property('rating'),
		review: DS.attr('string'),
		submittedBy: DS.attr('string'),
		submittedByEmail: DS.attr('string'),
		submittedByID: DS.attr('string'),
		title: DS.attr('string'),
		movie: DS.belongsTo('movie')
	});	

	App.Music = DS.Model.extend({
		type: DS.attr('string'),
		title: DS.attr('string'),
		artist: DS.attr('string'),
		album: DS.attr('string'),
		year: DS.attr('number'),
		comment: DS.attr('string'),
		external_source: DS.attr('string'),
		external_score: DS.attr('string'),
		youTubeLink: DS.attr('string'),
		spotifyLink: DS.attr('string'),
		soundCloudLink: DS.attr('string'),
		links: DS.attr('string'),
		linkType: DS.attr('string'),
		submittedBy: DS.attr('string'),
		submittedByEmail: DS.attr('string'),
		submittedByID: DS.attr('string'),
		createdAt: DS.attr('date'),
  		comments: DS.hasMany('comment', { async: true }),
  		tags: DS.hasMany('tag', { async: true }),
  		totalPlays: DS.attr('number')
	});

	App.Podcast = DS.Model.extend({
		podcastName: DS.attr('string'),
		episodeTitle: DS.attr('string'),
		embedLink: DS.attr('string'),
		review: DS.attr('string'),
		submittedBy: DS.attr('string'),
		submittedByEmail: DS.attr('string'),
		submittedByID: DS.attr('string'),
		createdAt: DS.attr('date'),
	});

	App.Tag = DS.Model.extend({
		name: DS.attr('string'),
		music: DS.hasMany('music'),
		listen: DS.hasMany('listen'),
		movie: DS.hasMany('movie')
	});

	App.Writing = DS.Model.extend({
		author: DS.attr('string'),
		title: DS.attr('string'),
		snippet: DS.attr('string'),
		text: DS.attr('string'),
		review: DS.attr('string'),
		submittedBy: DS.attr('string'),
		createdAt: DS.attr('date')
	});

	App.User = DS.Model.extend({
		firstName: DS.attr('string'),
 		lastName: DS.attr('string'),
 		email: DS.attr('string'),
 		lastVisit: DS.attr('date'),
 		favorites: DS.attr('string'),
 		follows: DS.attr('string')
	});




})();