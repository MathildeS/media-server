var GLOBAL_config = require('../global-config');
var querystring = require('querystring');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');

function getContent(pendingRequests) {
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
        var currentService = 'Lockerz';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var params = {
          search: query
        };
        params = querystring.stringify(params);
        var headers = GLOBAL_config.HEADERS;
        var options = {
          url: 'http://api.plixi.com/api/tpapi.svc/json/photos?' + params,
          headers: headers
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          var results = [];
          try {
            body = JSON.parse(body);
            if (body.List) {
              body.List.forEach(function(item) {
                results.push({
                  mediaUrl: item.BigImageUrl,
                  posterUrl: item.ThumbnailUrl,
                  micropostUrl: 'http://lockerz.com/s/' + item.TinyAlias,
                  micropost: cleanMessage.cleanMicropost(item.Message),
                  userProfileUrl: 'http://pics.lockerz.com/gallery/' + item.UserId,
                  type: 'photo',
                  timestamp: item.UploadDate * 1000,
                  publicationDate: new Date(item.UploadDate * 1000),
                  socialInteractions: {
                    likes: item.LikedVotes,
                    shares: item.Grabs,
                    comments: item.CommentCount,
                    views: item.Views
                  }
                });
              });
            }
            mCollection.collectResults(results, currentService, pendingRequests,callback);
          } catch(e) {
            mCollection.collectResults(results, currentService, pendingRequests,callback);
          }
        });
      };

module.exports = getContent;