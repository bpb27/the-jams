var bc = 'bower_components/'

requirejs.config({
	baseUrl: "master-template",
	paths: {
		jquery: bc + 'jquery/src/jquery.js',
		handlebars: bc + 'handlebars/handlebars.min.js',
		moment: bc + 'moment/min/moment.min.js',
		ember: bc + 'ember/ember.min.js',
		ember_data: bc + 'ember-data/ember-data.min.js',
		ember_lsa: bc + 'ember-localstorage-adapter/localstorage_adapter.js',
		bootstrap: bc + 'bootstrap.min.js',
		youtube_iframe: '//www.youtube.com/iframe_api',
		firebase: '//cdn.firebase.com/js/client/1.0.21/firebase.js',
		emberfire: '//cdn.firebase.com/libs/emberfire/1.1.3/emberfire.min.js',
		firebase_simple_login: '//cdn.firebase.com/js/simple-login/1.6.2/firebase-simple-login.js',
		sender_cast: '//www.gstatic.com/cv/js/sender/v1/cast_sender.js',
		app: 'js/app.js',
		components: 'js/components.js',
		models: 'js/models.js',
		router: 'js/router.js'
	}
});