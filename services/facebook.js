var GLOBAL_config = require('../global-config');
var querystring = require('querystring');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');


function getContent(pendingRequests) {
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
        var currentService = 'Facebook';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var params = {
          q: query,
          limit: 100,
          fields: 'comments,type,created_time,name,caption,description,source,picture,id,from,likes,shares'
        };
        params = querystring.stringify(params);
        var options = {
          url: 'https://graph.facebook.com/search?' + params + '&type=post',
          headers: GLOBAL_config.HEADERS
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          try {
            body = JSON.parse(body);
            var results = [];
            if ((body.data) && (body.data.length)) {
              var items = body.data;
              Step(
                function() {
                  var group = this.group();
                  items.forEach(function(item) {
                    if (item.type !== 'photo' && item.type !== 'video') {
                      return;
                    }
                    var cb = group();
                    var timestamp = Date.parse(item.created_time);
                    var micropost = '';
                    micropost += (item.name ? item.name : '');
                    micropost += (item.caption ?
                        (micropost.length ? '. ' : '') + item.caption : '');
                    micropost += (item.description ?
                        (micropost.length ? '. ' : '') + item.description : '');
                    micropost += (item.micropost ?
                        (micropost.length ? '. ' : '') + item.micropost : '');
                    var mediaUrl = item.type === 'video' ?
                        item.source : item.picture;
                    cleanMessage.cleanVideoUrl(mediaUrl, function(cleanedMediaUrl) {
                      if (cleanedMediaUrl) {
                        results.push({
                          mediaUrl: cleanedMediaUrl.replace(/s\.jpg$/gi, 'n.jpg'),
                          posterUrl: item.picture,
                          micropostUrl:
                              'https://www.facebook.com/permalink.php?story_fbid=' +
                              item.id.split(/_/)[1] + '&id=' + item.from.id,
                          micropost: cleanMessage.cleanMicropost(micropost),
                          userProfileUrl:
                              'https://www.facebook.com/profile.php?id=' +
                              item.from.id,
                          type: item.type,
                          timestamp: timestamp,
                          publicationDate: cleanMessage.getIsoDateString(timestamp),
                          socialInteractions: {
                            likes: item.likes ? item.likes.count : null,
                            shares: item.shares ? item.shares.count : null,
                            comments: item.comments ? item.comments.count : null,
                            views: null
                          }
                        });
                      }
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