var GLOBAL_config = require('../global-config');
var querystring = require('querystring');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');
 
 
 /**
     * Scrapes MySpace
     */
    function scrapeMySpace(body, callback) {
      var caption = false;
      var timestamp = false;
      if (!body) {
        callback({
          caption: false,
          timestamp: false
        });
      }
      try {
        jsdom.env(body, function(errors, window) {
          var $ = window.document;
          try {
            caption = $.getElementById('photoCaption').textContent;
            body =
                $.getElementsByTagName('body')[0].textContent.replace(/\s+/g, ' ');
            var match = '"unixTime":';
            var timeStart = (body.indexOf(match) + match.length);
            var timeEnd = body.substring(timeStart).indexOf(',') + timeStart;
            timestamp = parseInt(body.substring(timeStart, timeEnd) + '000', 10);
            callback({
              caption: caption,
              timestamp: timestamp
            });
          } catch(e) {
            // private profiles are not the fault of the scraper, everything else is
            if (body.indexOf('Sorry, ') === -1) {
              throw('ERROR: MySpace screen scraper broken');
            }
            callback({
              caption: false,
              timestamp: false
            });
          }
        });
      } catch(e) {
        callback({
          caption: false,
          timestamp: false
        });
      }
    }
    
    
    
function getContent(pendingRequests) {
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
        var currentService = 'MySpace';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var params = {
          searchTerms: query,
          count: 10,
          sortBy: 'recent'
        };
        params = querystring.stringify(params);
        var options = {
          url: 'http://api.myspace.com/opensearch/images?' + params,
          headers: GLOBAL_config.HEADERS
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          var results = [];
          // when no results are found, the MySpace API returns 404
          if (reply && reply.statusCode === 404) {
            mCollection.collectResults(results, currentService, pendingRequests,callback);
            return;
          }
          try {
            body = JSON.parse(body);
            if (body.entry && Array.isArray(body.entry)) {
              var items = body.entry;
              Step(
                function() {
                  var group = this.group();
                  items.forEach(function(item) {
                    var cb = group();
                    var userProfileUrl = item.profileUrl;
                    var micropostUrl = userProfileUrl + '/photos/' + item.imageId;
                    var mediaUrl = item.thumbnailUrl.replace(/m\.jpg$/, 'l.jpg');
                    var options = {
                      url: micropostUrl,
                      headers: GLOBAL_config.HEADERS
                    };
                    request.get(options, function(err, reply, body) {
                      scrapeMySpace(body, function(scrapeResult) {
                        if (scrapeResult.timestamp && scrapeResult.caption) {
                          results.push({
                            mediaUrl: mediaUrl,
                            posterUrl: null,
                            micropostUrl: micropostUrl,
                            micropost: cleanMessage.cleanMicropost(scrapeResult.caption),
                            userProfileUrl: userProfileUrl,
                            type: 'photo',
                            timestamp: scrapeResult.timestamp,
                            publicationDate: cleanMessage.getIsoDateString(scrapeResult.timestamp),
                            socialInteractions: {
                              likes: null,
                              shares: null,
                              comments: null,
                              views: null
                            }
                          });
                        }
                        cb(null);
                      });
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
  