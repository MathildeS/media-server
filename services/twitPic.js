var GLOBAL_config = require('../global-config');
var querystring = require('querystring');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');
var scrap = require ('../twitterScrapers.js');


function getContent(pendingRequests) {
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
	var currentService = 'TwitPic';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var params = {
          tag: query
        };
        params = querystring.stringify(params);
        var headers = GLOBAL_config.HEADERS;
        var options = {
          url: 'http://api.twitpic.com/2/tags/show.json?' + params,
          headers: headers
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          var results = [];
          try {
            body = JSON.parse(body);
            if (body.images && body.images.length > 0) {
              Step(
                function() {
                  var group = this.group();
                  for (var i = 0, len = body.images.length; i < len; i++) {
                    (function(image) {
                      var userProfileUrl = 'http://twitpic.com/photos/' + image.user.username;
                      var micropost = image.message;
                      var timestamp = (new Date(image.timestamp)).getTime();
                      var publicationDate = cleanMessage.getIsoDateString(timestamp);
                      var micropostUrl = 'http://twitpic.com/' + image.short_id;
                      var views = parseInt(image.views, 10);
                      var comments = parseInt(image.number_of_comments, 10);
                      var cb = group();
                      request.get(micropostUrl + '/full', function(err2, reply2, body2) {
                        scrap.scrapeTwitPic(body2, function(mediaUrl, type) {
                          results.push({
                            mediaUrl: mediaUrl,
                            posterUrl: 'http://twitpic.com/show/thumb/' + micropostUrl.replace('http://twitpic.com/', ''),
                            micropostUrl: micropostUrl,
                            micropost: cleanMessage.cleanMicropost(micropost),
                            userProfileUrl: userProfileUrl,
                            type: type,
                            timestamp: timestamp,
                            publicationDate: publicationDate,
                            socialInteractions: {
                              likes: null,
                              shares: null,
                              comments: comments,
                              views: views
                            }
                          });
                          cb();
                        });
                      });
                    })(body.images[i]);
                  }
                },
                function() {
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