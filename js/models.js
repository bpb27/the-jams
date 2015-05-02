(function(){
	'use strict';

	App.Comment = DS.Model.extend({
		comment: DS.attr('string'),
		postedBy: DS.attr('string'),
		createdAt: DS.attr('date'),
		music: DS.hasMany('music'),
		listen: DS.hasMany('listen')
	});

	App.Listen = DS.Model.extend({	
		type: DS.attr('string'),
		name: DS.attr('string'),
		review: DS.attr('string'),
		spotifyLink: DS.attr('string'),
		submittedBy: DS.attr('string'),
		submittedByEmail: DS.attr('string'),
		createdAt: DS.attr('date'),
  		comments: DS.hasMany('comment', { async: true })
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
  		comments: DS.hasMany('comment', { async: true })
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