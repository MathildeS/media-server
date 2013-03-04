var GLOBAL_config = require('../global-config');
var querystring = require('querystring');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');
var scrap = require ('../twitterScrapers.js');
var Uri = require('../uris.js');

function getContent(pendingRequests) {
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
        var currentService = 'Twitter';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var params = {
          q: query + ' ' + GLOBAL_config.MEDIA_PLATFORMS.join(' OR ') + ' -"RT "',
          rpp: 100,
          result_type: 'recent'
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
              var itemStack = [];
              for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                // extract all URLs form a tweet
                var urls = [];
                item.text.replace(GLOBAL_config.URL_REGEX, function(url) {
                  var targetURL = (/^\w+\:\//.test(url) ? '' : 'http://') + url;
                  urls.push(targetURL);
                });
                // for each URL prepare the options object
                var optionsStack = [];
                for (var j = 0, len2 = urls.length; j < len2; j++) {
                  var options = {
                    url: urls[j],
                    followRedirect: false,
                    headers: GLOBAL_config.HEADERS
                  };
                  optionsStack[j] = options;
                }
                itemStack[i] = {
                  urls: urls,
                  options: optionsStack,
                  item: item
                };
              }
              // for each tweet retrieve all URLs and try to expand shortend URLs
              Step(
                function() {
                  var group = this.group();
                  itemStack.forEach(function (obj) {
                    obj.options.forEach(function(options) {
                      var cb = group();
                      request.get(options, function(err, reply2) {
                        if (reply2 && reply2.statusCode) {
                          cb(null, {
                            req: {
                              statusCode: reply2.statusCode,
                              location: (reply2.headers.location ?
                                  reply2.headers.location : '')
                            },
                            url: options.url
                          });
                        } else {
                          cb(null, {
                            req: {
                              statusCode: 404,
                              location: ''
                            },
                            url: options.url
                          });
                        }
                      });
                    });
                  });
                },
                function(err, replies) {
                  /**
                   * Checks if a URL is one of the media platform URLs
                   */
                  function checkForValidUrl(url) {
                    var host = new Uri(url).heirpart().authority().host();
                    return GLOBAL_config.MEDIA_PLATFORMS.indexOf(host) !== -1;
                  }
                  var locations = [];
                  replies.forEach(function(thing, i) {
                    if ((thing.req.statusCode === 301) ||
                        (thing.req.statusCode === 302)) {
                      if (checkForValidUrl(thing.req.location)) {
                        locations.push(thing.req.location);
                      } else {
                        locations.push(false);
                      }
                    } else {
                      if (checkForValidUrl(thing.url)) {
                        locations.push(thing.url);
                      } else {
                        locations.push(false);
                      }
                    }
                  });
                  var locationIndex = 0;
                  var numberOfUrls = 0;
                  var pendingUrls = 0;
                  var i;
                  var len;
                  for (i = 0, len = itemStack.length; i < len; i++) {
                    itemStack[i].urls.forEach(function() {
                      numberOfUrls++;
                    });
                  }
                  for (i = 0, len = itemStack.length; i < len; i++) {
                    var item = itemStack[i].item;
                    var timestamp = Date.parse(item.created_at);
                    var publicationDate = cleanMessage.getIsoDateString(timestamp);
                    var micropost = cleanMessage.cleanMicropost(item.text);
                    var userProfileUrl = 'http://twitter.com/' + item.from_user;
                    itemStack[i].urls.forEach(function() {
                      if (locations[locationIndex]) {
                        var mediaUrl = locations[locationIndex];
                        var micropostUrl = 'http://twitter.com/' +
                            item.from_user + '/status/' + item.id_str;
                        // yfrog
                        if (mediaUrl.indexOf('http://yfrog.com') === 0) {
                          var id = mediaUrl.replace('http://yfrog.com/', '');
                          var options = {
                            url: 'http://yfrog.com/api/xmlInfo?path=' + id
                          };
                          (function(micropost, userProfileUrl, timestamp, publicationDate) {
                            request.get(options, function(err, result, body) {
                              if (mediaUrl) {
                                results.push({
                                  mediaUrl: mediaUrl + ':iphone',
                                  posterUrl: mediaUrl + ':small',
                                  micropostUrl: micropostUrl,
                                  micropost: micropost,
                                  userProfileUrl: userProfileUrl,
                                  type: 'photo',
                                  timestamp: timestamp,
                                  publicationDate: publicationDate,
                                  socialInteractions: {
                                    likes: null,
                                    shares: null,
                                    comments: null,
                                    views: null
                                  }
                                });
                              }
                              pendingUrls++;
                              if (pendingUrls === numberOfUrls) {
                                mCollection.collectResults(
                                    results, currentService, pendingRequests,callback);
                              }
                            });
                          })(micropost, userProfileUrl, timestamp, publicationDate);
                        // TwitPic
                        } else if (mediaUrl.indexOf('http://twitpic.com') === 0) {
                          var id = mediaUrl.replace('http://twitpic.com/', '');
                          var options = {
                            url: 'http://twitpic.com/' + id + '/full'
                          };
                          (function(micropost, userProfileUrl, timestamp, publicationDate) {
                            request.get(options, function(err, res, body) {
                              scrap.scrapeTwitPic(body, function(mediaUrl, type) {
                                if (mediaUrl) {
                                  results.push({
                                    mediaUrl: mediaUrl,
                                    posterUrl: mediaUrl,
                                    micropostUrl: micropostUrl,
                                    micropost: micropost,
                                    userProfileUrl: userProfileUrl,
                                    type: type,
                                    timestamp: timestamp,
                                    publicationDate: publicationDate,
                                    socialInteractions: {
                                      likes: null,
                                      shares: null,
                                      comments: null,
                                      views: null
                                    }
                                  });
                                }
                                pendingUrls++;
                                if (pendingUrls === numberOfUrls) {
                                  mCollection.collectResults(
                                      results, currentService, pendingRequests,callback);
                                }
                              });
                            });
                          })(micropost, userProfileUrl, timestamp, publicationDate);
                        // img.ly
                        } else if (mediaUrl.indexOf('http://img.ly') === 0) {
                          var id = mediaUrl.replace('http://img.ly/', '');
                          var options = {
                            url: 'http://img.ly/' + id
                          };
                          (function(micropost, userProfileUrl, timestamp, publicationDate) {
                            request.get(options, function(err, res, body) {
                              scrap.scrapeImgLy(body, function(mediaUrl) {
                                if (mediaUrl) {
                                  results.push({
                                    mediaUrl: mediaUrl,
                                    posterUrl: mediaUrl,
                                    micropostUrl: micropostUrl,
                                    micropost: micropost,
                                    userProfileUrl: userProfileUrl,
                                    type: 'photo',
                                    timestamp: timestamp,
                                    publicationDate: publicationDate,
                                    socialInteractions: {
                                      likes: null,
                                      shares: null,
                                      comments: null,
                                      views: null
                                    }
                                  });
                                }
                                pendingUrls++;
                                if (pendingUrls === numberOfUrls) {
                                  mCollection.collectResults(
                                      results, currentService, pendingRequests,callback);
                                }
                              });
                            });
                          })(micropost, userProfileUrl, timestamp, publicationDate);
                        // Instagram
                        } else if (mediaUrl.indexOf('http://instagr.am') === 0) {
                          var id = mediaUrl.replace('http://instagr.am/p/', '');
                          var options = {
                            url: 'https://api.instagram.com/v1/media/' + id +
                                '?access_token=' + GLOBAL_config.INSTAGRAM_KEY
                          };
                          (function(micropost, userProfileUrl, timestamp, publicationDate) {
                            request.get(options, function(err, result, body) {
                              try {
                                body = JSON.parse(body);
                                if ((body.data) && (body.data.images) &&
                                    (body.data.images.standard_resolution ) &&
                                    (body.data.images.standard_resolution.url)) {
                                  results.push({
                                    mediaUrl:
                                        body.data.images.standard_resolution.url,
                                    posterUrl: body.data.images.thumbnail.url,
                                    micropostUrl: micropostUrl,
                                    micropost: micropost,
                                    userProfileUrl: userProfileUrl,
                                    type: 'photo',
                                    timestamp: timestamp,
                                    publicationDate: publicationDate,
                                    socialInteractions: {
                                      likes: null,
                                      shares: null,
                                      comments: null,
                                      views: null
                                    }
                                  });
                                }
                              } catch(e) {
                                // noop
                              }
                              pendingUrls++;
                              if (pendingUrls === numberOfUrls) {
                                mCollection.collectResults(
                                    results, currentService, pendingRequests,callback);
                              }
                            });
                          })(micropost, userProfileUrl, timestamp, publicationDate);
                        // URL from unsupported media platform, don't consider it
                        } else {
                          numberOfUrls--;
                        }
                      } else {
                        numberOfUrls--;
                      }
                      locationIndex++;
                    });
                  }
                }
              );
            } else {
              mCollection.collectResults([], currentService, pendingRequests,callback);
            }
          } catch(e) {
            mCollection.collectResults([], currentService, pendingRequests,callback);
          }
        });
      };
      
module.exports = getContent;