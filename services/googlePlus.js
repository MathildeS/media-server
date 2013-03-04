var GLOBAL_config = require('../global-config');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');


function getContent(pendingRequests) {
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
        var currentService = 'GooglePlus';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var options = {
          url: 'https://www.googleapis.com/plus/v1/activities?query=' +
              encodeURIComponent(query) +
              '&orderBy=recent&key=' + GLOBAL_config.GOOGLE_KEY,
          headers: GLOBAL_config.HEADERS
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          var results = [];
          try {
            body = JSON.parse(body);
            if (body.items && Array.isArray(body.items)) {
              body.items.forEach(function(item) {
                // only treat posts, notes, and shares, no check-ins
                if (((item.verb === 'share') || (item.verb === 'post') || (item.verb === 'note')) &&
                    (item.object.attachments) &&
                    (Array.isArray(item.object.attachments))) {
                  item.object.attachments.forEach(function(attachment) {
                    // only treat photos and videos, skip articles
                    if ((attachment.objectType !== 'photo') &&
                        (attachment.objectType !== 'video')) {
                      return;
                    }
                    // the micropost can consist of different parts, dependent on
                    // the item type
                    var micropost = cleanMessage.cleanMicropost(
                        (item.object.content ?
                            item.object.content : '') +
                        (item.title ?
                            ' ' + item.title : '') +
                        (item.annotation ?
                            ' ' + item.annotation : '') +
                        (attachment.displayName ?
                            ' ' + attachment.displayName : ''));
                    if (micropost) {
                      var mediaUrl = '';
                      if (attachment.embed) {
                        mediaUrl = attachment.embed.url;
                      } else if (attachment.fullImage) {
                        mediaUrl = attachment.fullImage.url;
                      }
                      cleanMessage.cleanVideoUrl(mediaUrl, function(cleanedMediaUrl) {
                        if (cleanedMediaUrl) {
                          results.push({
                            mediaUrl: cleanedMediaUrl,
                            posterUrl: attachment.image.url,
                            micropostUrl: item.url,
                            micropost: micropost,
                            userProfileUrl: item.actor.url,
                            type: attachment.objectType,
                            timestamp: (new Date(item.published)).getTime(),
                            publicationDate: item.published,
                            socialInteractions: {
                              likes: item.object.plusoners.totalItems,
                              shares: item.object.resharers.totalItems,
                              comments: item.object.replies.totalItems,
                              views: null
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
              mCollection.collectResults(results, currentService, pendingRequests,callback);
            } else {
              mCollection.collectResults(results, currentService, pendingRequests,callback);
            }
          } catch(e) {
            mCollection.collectResults(results, currentService, pendingRequests,callback);
          }
        });
      };

module.exports = getContent;