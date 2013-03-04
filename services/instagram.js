var GLOBAL_config = require('../global-config');
var querystring = require('querystring');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');


function getContent(pendingRequests) {
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
        var currentService = 'Instagram';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var params = {
          client_id: GLOBAL_config.INSTAGRAM_KEY
        };
        params = querystring.stringify(params);
        var options = {
          url: 'https://api.instagram.com/v1/tags/' +
              query.replace(/\s*/g, '').replace(/\W*/g, '').toLowerCase() +
              '/media/recent?' + params,
          headers: GLOBAL_config.HEADERS
        };
        var results = [];
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          try {
            body = JSON.parse(body);
            if ((body.data) && (body.data.length)) {
              var items = body.data;
              for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                var timestamp = parseInt(item.created_time + '000', 10);
                var micropost = '';
                micropost += (item.caption && item.caption.text ?
                    item.caption.text : '');
                micropost += (micropost.length ? '. ' : '') +
                    (item.tags && Array.isArray(item.tags) ?
                        item.tags.join(', ') : '');
                results.push({
                  mediaUrl: item.images.standard_resolution.url,
                  posterUrl: item.images.thumbnail.url,
                  micropostUrl: item.link,
                  micropost: cleanMessage.cleanMicropost(micropost),
                  userProfileUrl: 'https://api.instagram.com/v1/users/' + item.user.id,
                  type: item.type === 'image'? 'photo' : '',
                  timestamp: timestamp,
                  publicationDate: cleanMessage.getIsoDateString(timestamp),
                  socialInteractions: {
                    likes: item.likes.count,
                    shares: null,
                    comments: item.comments.count,
                    views: null
                  }
                });
              }
            }
          } catch(e) {
            // noop
          }
          mCollection.collectResults(results, currentService, pendingRequests,callback);
        });
      };
      
module.exports = getContent;