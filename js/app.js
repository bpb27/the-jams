//Initializes the app globally
window.App = Ember.Application.create();

//Initialize the adapter
App.ApplicationAdapter = DS.LSAdapter.extend({
	namespace: 'thejams-emberjs'
});
