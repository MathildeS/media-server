var GLOBAL_config = require('../global-config');
var querystring = require('querystring');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');

function getContent(pendingRequests) {
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
        var currentService = 'WikimediaCommons';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var params = {
            action: 'query',
            generator:'search',
            gsrnamespace: 6,
            gsrsearch: query,
            gsrlimit: 500,
            prop: 'imageinfo|globalusage',
            iiprop: 'url|timestamp|user',
            format: 'json'
        };
        params = querystring.stringify(params);
        var headers = GLOBAL_config.HEADERS;
        var options = {
          url: 'https://commons.wikimedia.org/w/api.php?' + params,
          headers: headers
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          var results = [];
          try {
            body = JSON.parse(body);
            if (body && body.query && body.query.pages) {
                for (var pageId in body.query.pages) {
                    var page = body.query.pages[pageId];                    
                    var title = page.title.replace('File:', '');
                    var posterUrl = page.imageinfo[0].url.replace('https://upload.wikimedia.org/wikipedia/commons/','https://upload.wikimedia.org/wikipedia/commons/thumb/') +'/500px-' + encodeURIComponent(title.replace(/\s/g, '_'));
                    results.push({
                        mediaUrl: page.imageinfo[0].url,
                        posterUrl: posterUrl,
                        micropostUrl: page.imageinfo[0].descriptionurl,
                        micropost: cleanMessage.cleanMicropost(title.replace(/(\.jpg|\.png|\.gif|\.webp)$/gi, '')),
                        userProfileUrl: 'https://commons.wikimedia.org/wiki/User:' +page.imageinfo[0].user,
                        type: 'photo',
                        timestamp: (new Date(page.imageinfo[0].timestamp)).getTime(),
                        publicationDate: page.imageinfo[0].timestamp,
                        socialInteractions: {
                            likes: null,
                            shares: page.globalusage.length,
                            comments: null,
                            views: null
                        }
                    });
                }
                results.sort(function (a, b) {
                    return (a.socialInteractions.shares - b.socialInteractions.shares);
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