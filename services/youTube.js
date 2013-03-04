var GLOBAL_config = require('../global-config');
var querystring = require('querystring');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');


function getContent(pendingRequests) {		
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
	var currentService = 'YouTube';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var params = {
          v: 2,
          format: 5,
          safeSearch: 'none',
          q: query,
          alt: 'jsonc',
          'max-results': 10,
          'start-index': 1,
          time: 'this_week'
        };
        params = querystring.stringify(params);
        var options = {
          url: 'http://gdata.youtube.com/feeds/api/videos?' + params,
          headers: GLOBAL_config.HEADERS
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          try {
            body = JSON.parse(body);	    
            var results = [];
            if ((body.data) && (body.data.items)) {	      
              var items = body.data.items;	      
              Step(
                function() {
                  var group = this.group();		  
                  items.forEach(function(item) {		
                    if (item.accessControl.embed !== 'allowed') {
                      return;
                    }
                    var cb = group();
                    var timestamp = Date.parse(item.uploaded);
                    var url = item.player.default;		    
                    cleanMessage.cleanVideoUrl(url, function(cleanedVideoUrl) {		    
                      results.push({			
                        mediaUrl: cleanedVideoUrl,
                        posterUrl: item.thumbnail.sqDefault,
                        micropostUrl: url,
                        micropost: cleanMessage.cleanMicropost(
                            item.title + '. ' + item.description),
                        userProfileUrl: 'http://www.youtube.com/' + item.uploader,
                        type: 'video',
                        timestamp: timestamp,
                        publicationDate: cleanMessage.getIsoDateString(timestamp),
                        socialInteractions: {
                          likes: parseInt(item.likeCount, 10) +
                              parseInt(item.favoriteCount, 10),
                          shares: null,
                          comments: item.commentCount,
                          views: item.viewCount
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


module.exports= getContent;
  
  
