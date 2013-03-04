var GLOBAL_config = require('../global-config');
var querystring = require('querystring');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');


function getContent(pendingRequests) {
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
        var currentService = 'YouTube2';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var params = {
          part: 'id,snippet',
          type: 'video',
          q: query,         
          maxResults: 10, 
          key: GLOBAL_config.YOUTUBE_KEY
        };
        params = querystring.stringify(params);
        var options = {
          url: 'https://www.googleapis.com/youtube/v3/search?' + params,
          headers: GLOBAL_config.HEADERS
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          try {
            body = JSON.parse(body);
            var results = [];            
	    if ((body.items) && (body.pageInfo.totalResults)) {
              var items = body.items;
              Step(
                function() {
                  var group = this.group();
                  items.forEach(function(item) {		    
                    var cb = group();
                    var timestamp = Date.parse(item.snippet.publishedAt);		    
                    var url = item.snippet.thumbnails.high.url;
                    cleanMessage.cleanVideoUrl(url, function(cleanedVideoUrl) {
                      results.push({
                        mediaUrl: cleanedVideoUrl,
                        posterUrl: item.snippet.thumbnails.default.url,
                        micropostUrl: item.snippet.thumbnails.default.url,
                        micropost: cleanMessage.cleanMicropost(
                            item.snippet.title + '. ' + item.snippet.description),
                        userProfileUrl: 'http://www.youtube.com/' + item.snippet.channelId,
                        type: 'video',
                        timestamp: timestamp,
                        publicationDate: cleanMessage.getIsoDateString(timestamp),
                        socialInteractions: {
                          likes: null,
                          shares: null,
                          comments: null,
                          views: null
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