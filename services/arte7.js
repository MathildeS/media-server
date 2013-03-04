var GLOBAL_config = require('../global-config');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');

function getContent(pendingRequests) {
  	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
        var currentService = 'Arte7';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var options = {
          url: 'http://www.arte.tv/tvhack/tvguide/videos/plus7/search/F/L3/' +
              encodeURIComponent(query) +
              '/ALL/ALL/-1/VIEWS/20/0.json',
          headers: GLOBAL_config.HEADERS
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          var results = [];
          try {
            body = JSON.parse(body);
            if (body.videoList && Array.isArray(body.videoList)) {
	      var items = body.videoList;	     
              Step(
                function() {
                  var group = this.group();
                  items.forEach(function(item) {
		    var cb = group();
                    var timestamp = Date.parse(item.VDA);
		    console.log(timestamp);
                    var url = item.VTR;
                    cleanMessage.cleanVideoUrl(url, function(cleanedVideoUrl) {
                      results.push({
                        mediaUrl: cleanedVideoUrl,
                        posterUrl: item.VTU.IUR,
                        micropostUrl: item.VUP,
                        micropost: cleanMessage.cleanMicropost(
                            item.VTI + '. ' +item.VDE + '. ' + item.V7T),
                        userProfileUrl: null,
                        type: 'video',
                        timestamp: timestamp,
                        publicationDate: cleanMessage.getIsoDateString(timestamp),
                        socialInteractions: {
                          likes: null,
                          shares: null,
                          comments: null,
                          views: item.VVI
                        }
                      });
                      cb(null);
                    });
                  });
                },
                function(err) {
                  mCollection.collectResults(results, currentService, pendingRequests,callback);
                }
              );
            } else {
              mCollection.collectResults(results, currentService, pendingRequests,callback);
            }
          } catch(e) {
            mCollection.collectResults(results, currentService, pendingRequests,callback);
          }
        });
      };
      
module.exports = getContent;