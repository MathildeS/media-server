var GLOBAL_config = require('../global-config');
var querystring = require('querystring');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');

function getContent(pendingRequests) {
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
        var currentService = 'MobyPicture';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var params = {
          key: GLOBAL_config.MOBYPICTURE_KEY,
          action: 'searchPosts',
          format: 'json',
          searchTerms: query
        };
        params = querystring.stringify(params);
        var options = {
          url: 'http://api.mobypicture.com/?' + params,
          headers: GLOBAL_config.HEADERS
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body1) {
          var results = [];
          try {
            body1 = JSON.parse(body1);
            if ((body1.results) && (body1.results.length)) {
              var items = body1.results;
              Step(
                function() {
                  var group = this.group();
                  for (var i = 0, len = items.length; i < len; i++) {
                    var cb = group();
                    var item = items[i];
                    params = {
                      key: GLOBAL_config.MOBYPICTURE_KEY,
                      action: 'getMediaInfo',
                      format: 'json',
                      tinyurl_code: item.post.link_tiny
                    };
                    params = querystring.stringify(params);
                    options = {
                      url: 'http://api.mobypicture.com/?' + params,
                      headers: GLOBAL_config.HEADERS
                    };
                    request.get(options, function(err, reply, body2) {
                      try {
                        body2 = JSON.parse(body2);
                        var mediaUrl = body2.post.media.url_full;
                        var posterUrl = body2.post.media.url_thumbnail;
                        var micropostUrl = body2.post.link;
                        var timestamp = body2.post.created_on_epoch * 1000;
                        var micropost = body2.post.title + '. ' + item.post.description;
                        var userProfileUrl = body2.user.url;
                        var type = body2.post.media.type;
                        var views = parseInt(body2.post.views, 10);
                        var comments = parseInt(body2.post.comments, 10);
                        params = {
                          key: GLOBAL_config.MOBYPICTURE_KEY,
                          action: 'getLikes',
                          format: 'json',
                          tinyurl_code: body2.post.link_tiny
                        };
                        params = querystring.stringify(params);
                        options = {
                          url: 'http://api.mobypicture.com/?' + params,
                          headers: GLOBAL_config.HEADERS
                        };
                        request.get(options, function(err, reply, body3) {
                          try {
                            body3 = JSON.parse(body3);
                            results.push({
                              mediaUrl: mediaUrl,
                              posterUrl: posterUrl,
                              micropostUrl: micropostUrl,
                              micropost: cleanMessage.cleanMicropost(
                                  micropost),
                              userProfileUrl: userProfileUrl,
                              type: type,
                              timestamp: timestamp,
                              publicationDate: cleanMessage.getIsoDateString(timestamp),
                              socialInteractions: {
                                likes: parseInt(body3.votes, 10),
                                shares: null,
                                comments: comments,
                                views: views
                              }
                            });
                            cb();
                          } catch(e) {
                            cb();
                          }
                        });
                      } catch(e) {
                        cb();
                      }
                    });
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