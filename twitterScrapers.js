var jsdom = require('jsdom');


/**
     * Scrapes TwitPic
     */
var scrapeTwitPic = function(body, callback) {
      var mediaUrl = false;
      var type = false;
      if (!body) {
        callback(false);
      }
      try {
        jsdom.env(body, function(errors, window) {
          var $ = window.document;
          try {
            if ($.getElementsByTagName('VIDEO').length > 0) {
              mediaUrl = body.substring(body.indexOf('<source src="') +
                  ('<source src="'.length));
              mediaUrl = mediaUrl.substring(0, mediaUrl.indexOf('"'));
              type = 'video';
            } else {
              mediaUrl = $.getElementsByTagName('IMG')[1].src;
              type = 'photo';
            }
            callback(mediaUrl, type);
          } catch(e) {
            if (body.indexOf('error') === -1) {
              throw('ERROR: TwitPic screen scraper broken');
            }
            callback(false);
          }
        });
      } catch(e) {
        callback(false);
      }
    };

    /**
     * Scrapes img.ly
     */
var scrapeImgLy = function(body, callback) {
      var mediaUrl = false;
      if (!body) {
        callback(false);
      }
      try {
        jsdom.env(body, function(errors, window) {
          var $ = window.document;
          var match = 'the-image';
          try {
            mediaUrl = $.getElementById(match).src;
            callback(mediaUrl);
          } catch(e) {
            throw('ERROR: img.ly screen scraper broken');
          }
        });
      } catch(e) {
        callback(false);
      }
    };
    
module.exports.scrapeTwitPic = scrapeTwitPic;
module.exports.scrapeImgLy = scrapeImgLy;