var mCollection = require('./micropostsCollection.js');
var GLOBAL_config = require('./global-config');

var query ;
var callback;

var mediaFinder = {
  search: function search(service, query, callback) {
    
    this.query = query;
    this.callback = callback;
    
  
    var services = {
      //GooglePlus: require('./services/googlePlus.js'),
      //MySpace: require('./services/mySpace.js'),
      /*
      MySpaceVideos: function(pendingRequests) {
        var currentService = 'MySpaceVideos';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var params = {
          searchTerms: query,
          count: 10,
          sortBy: 'recent'
        };
        params = querystring.stringify(params);
        var options = {
          url: 'http://api.myspace.com/opensearch/videos?' + params,
          headers: GLOBAL_config.HEADERS
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          res.send(body);
        });
      },
      */
      //Facebook: require('./services/facebook.js'),
      //TwitterNative: require('./services/twitterNative.js'),
      //Twitter: require('./services/twitter.js'),
      //Instagram: require('./services/instagram.js'),
      //YouTube: require('./services/youTube.js'), 
      YouTubeAll: require('./services/youTubeAll.js'),
      /*FlickrVideos: function (pendingRequests) {
	services.Flickr(pendingRequests, true);
      },*/
      //Flickr: require('./services/flickr.js'),
      Arte7: require('./services/arte7.js'),
      //MobyPicture: require('./services/mobyPicture.js'),
      //TwitPic: require ('./services/twitPic.js'),
      //Lockerz: require('./services/lockerz.js'),
      UEP: require('./services/uep.js')
    };
    
    if (services[service]) {
      services[service]();
    }
    if (service === 'combined') {
      var serviceNames = Object.keys(services);
      console.log(serviceNames);
      var pendingRequests = {};
      var numberOfPendingRequests = 0;
      serviceNames.forEach(function(serviceName) {
        pendingRequests[serviceName] = false;
	console.log(serviceName);
	services[serviceName](pendingRequests);
      });
      var length = serviceNames.length;
      var intervalTimeout = 250;
      // var timeout = 60 * intervalTimeout;

      // key is passedTime, value is allowed max number of pending requests
      // e.g. if 8.5sec has been passed and there are still 1 or 2 pending requests
      // we don't wait for them but return data to client
      var timeouts = {
        10000 : 1,
        12500 : 2,
        15000 : 3,
        20000 : "timeout"
      };
      var passedTime = 0;
      var interval = setInterval(function() {
        passedTime += intervalTimeout;
        numberOfPendingRequests = Object.keys(pendingRequests).filter(function(key) { return !pendingRequests[key]; }).length;
        
        // if (GLOBAL_config.DEBUG) console.log("Passed time: " + passedTime + ", Number of pending requests: " + numberOfPendingRequests);
        for (var i = 0; i < length; i++) {
          // if (passedTime >= timeout) {
          if (timeouts[passedTime] === "timeout" || (numberOfPendingRequests <= timeouts[passedTime])) {
            if (GLOBAL_config.DEBUG) console.log('Timeout');
            break;
          }
          if (pendingRequests[serviceNames[i]] === false) {
            return;
          }
        }
        clearInterval(interval);
        var results = pendingRequests;
        mCollection.collectResults(results, 'combined', false,callback);
        pendingRequests = {};
      }, intervalTimeout);
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = mediaFinder;
} else {
  return mediaFinder;
}
