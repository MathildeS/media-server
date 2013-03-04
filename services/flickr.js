var GLOBAL_config = require('../global-config');
var querystring = require('querystring');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');


function getContent(pendingRequests, videoSearch) {
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
        var currentService = videoSearch ? 'FlickrVideos' : 'Flickr';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var now = ~~(new Date().getTime() / 1000);
        var sixDays = 86400 * 6;
        var params = {
          method: 'flickr.photos.search',
          api_key: GLOBAL_config.FLICKR_KEY,
          text: query,
          format: 'json',
          nojsoncallback: 1,
          min_taken_date: now - sixDays,
          media: (videoSearch ? 'videos' : 'photos'),
          per_page: 20
        };
        params = querystring.stringify(params);
        var options = {
          url: 'http://api.flickr.com/services/rest/?' + params,
          headers: GLOBAL_config.HEADERS
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          try {
            body = JSON.parse(body);
            var results = [];
            if ((body.photos) && (body.photos.photo)) {
              var photos = body.photos.photo;
              Step(
                function() {
                  var group = this.group();
                  for (var i = 0, len = photos.length; i < len; i++) {
                    var photo = photos[i];
                    if (photo.ispublic) {
                      var params = {
                        method: 'flickr.photos.getInfo',
                        api_key: GLOBAL_config.FLICKR_KEY,
                        format: 'json',
                        nojsoncallback: 1,
                        photo_id: photo.id
                      };
                      params = querystring.stringify(params);
                      var options = {
                        url: 'http://api.flickr.com/services/rest/?' + params,
                        headers: GLOBAL_config.HEADERS
                      };
                      var cb = group();
                      request.get(options, function(err2, reply2, body2) {
                        try {
                          body2 = JSON.parse(body2);
                          var tags = [];
                          if ((body2.photo) &&
                              (body2.photo.tags) &&
                              (body2.photo.tags.tag) &&
                              (Array.isArray(body2.photo.tags.tag))) {
                            body2.photo.tags.tag.forEach(function(tag) {
                              tags.push(tag._content);
                            });
                          }
                          var photo2 = body2.photo;
                          var timestamp = Date.parse(photo2.dates.taken);
                          var params = {
                            method: 'flickr.photos.getSizes',
                            api_key: GLOBAL_config.FLICKR_KEY,
                            format: 'json',
                            nojsoncallback: 1,
                            photo_id: photo2.id
                          };
                          params = querystring.stringify(params);
                          var options = {
                            url: 'http://api.flickr.com/services/rest/?' + params,
                            headers: GLOBAL_config.HEADERS
                          };
                          request.get(options, function(err, res2, body) {
                            try {
                              body = JSON.parse(body);
                              if ((body.sizes) && (body.sizes.size) &&
                                  (Array.isArray(body.sizes.size))) {
                                var mediaUrl = false;
                                var posterUrl = false;
                                body.sizes.size.forEach(function(size) {
                                  // take the picture in the best-possible
                                  // resolution, the highest resolution (unknown)
                                  // is always the last in the sizes array
                                  if ((!videoSearch) &&
                                      ((size.label === 'Original') ||
                                       (size.label === 'Large') ||
                                       (size.label === 'Medium 640') ||
                                       (size.label === 'Medium 640') ||
                                       (size.label === 'Medium') ||
                                       (size.label === 'Small') ||
                                       (size.label === 'Thumbnail') ||
                                       (size.label === 'Square'))) {
                                    mediaUrl = size.source;
                                  }
                                  if (size.label === 'Thumbnail') {
                                    posterUrl = size.source;
                                  }
                                  // take the video in the best-possible quality
                                  if ((videoSearch) &&
                                      ((size.label === 'Site MP4') ||
                                       (size.label === 'Mobile MP4'))) {
                                    mediaUrl = size.source;
                                  }
                                });

                                var params = {
                                  method: 'flickr.photos.getFavorites',
                                  api_key: GLOBAL_config.FLICKR_KEY,
                                  format: 'json',
                                  nojsoncallback: 1,
                                  photo_id: photo2.id
                                };
                                params = querystring.stringify(params);
                                var options = {
                                  url: 'http://api.flickr.com/services/rest/?' + params,
                                  headers: GLOBAL_config.HEADERS
                                };
                                request.get(options, function(err, res2, body) {
                                  try {
                                    body = JSON.parse(body);
                                    results.push({
                                      mediaUrl: mediaUrl,
                                      posterUrl: posterUrl,
                                      micropostUrl: 'http://www.flickr.com/photos/' +
                                          photo2.owner.nsid + '/' + photo2.id + '/',
                                      micropost: cleanMessage.cleanMicropost(photo2.title._content +
                                          '. ' + photo2.description._content +
                                          tags.join(', ')),
                                      userProfileUrl: 'http://www.flickr.com/photos/' +
                                          photo2.owner.nsid + '/',
                                      type: (videoSearch ? 'video' : 'photo'),
                                      timestamp: timestamp,
                                      publicationDate: cleanMessage.getIsoDateString(timestamp),
                                      socialInteractions: {
                                        likes: parseInt(body.photo.total, 10),
                                        shares: null,
                                        comments: parseInt(photo2.comments._content, 10),
                                        views: parseInt(photo2.views, 10)
                                      }
                                    });
                                  } catch(e) {
                                    cb();
                                  }
                                });
                              }
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
                  }
                },
                function() {
                  mCollection.collectResults(results, currentService, pendingRequests,callback);
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