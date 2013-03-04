var GLOBAL_config = require('../global-config');
var querystring = require('querystring');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');

function getContent(pendingRequests) {
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
        var currentService = 'TwitterNative';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var params = {
          q: query + ' -"RT "',
          result_type: 'recent',
          include_entities: true,
          rpp: 100
        };
        params = querystring.stringify(params);
        var options = {
          url: 'http://search.twitter.com/search.json?' + params,
          headers: GLOBAL_config.HEADERS
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          try {
            body = JSON.parse(body);
            var results = [];
            if ((body.results) && (body.results.length)) {
              var items = body.results;
              Step(
                function() {
                  var group = this.group();
                  for (var i = 0, len = items.length; i < len; i++) {
                    var cb = group();
                    (function(item) {
                    var mediaUrl = '';
                    if (item.entities && item.entities.media &&
                        item.entities.media.length > 0) {
                      mediaUrl = item.entities.media[0].media_url ?
                          item.entities.media[0].media_url :
                          item.entities.media[0].media_url_https;
                      params = {
                        id: item.id_str,
                        trim_user: true
                      };
                      params = querystring.stringify(params);
                      var options = {
                        url: 'https://api.twitter.com/1/statuses/show.json?' + params,
                        headers: GLOBAL_config.HEADERS
                      };
                      request.get(options, function(err, reply, body2) {
                        try {
                          body2 = JSON.parse(body2);
                          var timestamp = Date.parse(item.created_at);
                          var publicationDate = cleanMessage.getIsoDateString(timestamp);
                          var micropost = cleanMessage.cleanMicropost(item.text);
                          var userProfileUrl = 'http://twitter.com/' + item.from_user;
                          var micropostUrl = 'http://twitter.com/' +
                              item.from_user + '/status/' + item.id_str;
                          results.push({
                            mediaUrl: mediaUrl,
                            posterUrl: mediaUrl + ':thumb',
                            micropostUrl: micropostUrl,
                            micropost: micropost,
                            userProfileUrl: userProfileUrl,
                            type: 'photo',
                            timestamp: timestamp,
                            publicationDate: publicationDate,
                            socialInteractions: {
                              likes: null,
                              shares: body2.retweet_count ? body2.retweet_count : 0,
                              comments: null,
                              views: null
                            }
                          });
                          cb();
                        } catch(e) {
                          cb();
                        }
                      });
                    } else {
                      cb();
                    }
                    })(items[i]);
                  }
                },
                function() {
                  mCollection.collectResults(results, currentService, pendingRequests,callback);
                }
              );
            }
          } catch(e) {
            mCollection.collectResults([], currentService, pendingRequests,callback);
          }
        });
      };
  
module.exports = getContent;