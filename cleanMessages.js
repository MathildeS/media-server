var GLOBAL_config = require('./global-config.js');
var request = require('request');
var Step = require('./step.js');
var Uri = require('./uris.js');


/**
     * Stolen from https://developer.mozilla.org/en/JavaScript/Reference/Global_-
     * Objects/Date#Example:_ISO_8601_formatted_dates
     */
exports.getIsoDateString = function(d) {
  function pad(n) { return n < 10 ? '0' + n : n }
  d = new Date(d);
  return d.getUTCFullYear() + '-' +
          pad(d.getUTCMonth() + 1) + '-' +
          pad(d.getUTCDate()) + 'T' +
          pad(d.getUTCHours()) + ':' +
          pad(d.getUTCMinutes()) + ':' +
          pad(d.getUTCSeconds()) + 'Z';
};

    /**
     * Cleans video URLs, tries to convert YouTube URLS to HTML5 versions
     */
exports.cleanVideoUrl = function(url, callback) {
      // if is YouTube URL
      if ((url.indexOf('http://www.youtube.com') === 0) ||
          (url.indexOf('https://www.youtube.com') === 0)) {
        try {
          var urlObj = new Uri(url);
          var path = urlObj.heirpart().path();
          var pathComponents = path.split(/\//gi);
          var videoId;
          if (pathComponents[1] === 'v') {
            // URL of 'v' type:
            // http://www.youtube.com/v/WnszesKUXp8
            videoId = pathComponents[2];
          } else if (pathComponents[1] === 'watch') {
            // URL of "watch" type:
            // http://www.youtube.com/watch?v=EVBsypHzF3U
            var query = urlObj.querystring();
            query.substring(1).split(/&/gi).forEach(function(param) {
              var keyValue = param.split(/\=/g);
              if (keyValue[0] === 'v') {
                videoId = keyValue[1];
              }
            });
          }
          // Translate to HTML5 video URL, try at least
          Step(
            function() {
              var that = this;
              var options = {
                url: 'http://tomayac.com/youpr0n/getVideoInfo.php?video=' +
                    videoId
              };
              request.get(options, function(err, res, body) {
                that(null, body);
              });
            },
            function(err, body) {
              var html5Url = false;
              try {
                var response = JSON.parse(body);
                for (var i = 0, len = response.length; i < len; i++) {
                  var data = response[i];
                  if (data.type.indexOf('video/webm') === 0) {
                    html5Url = data.url;
                    break;
                  }
                }
                // if either embedding forbidden or no HTML5 version available,
                // use the normalized YouTube URL
                if (!html5Url) {
                  html5Url = 'http://www.youtube.com/watch?v=' + videoId;
                }
                callback(html5Url);
              } catch(e) {
                callback(html5Url);
              }
            }
          );
        } catch(e) {
          callback(url);
        }
      } else {
        callback(url);
      }
    };

 /**
     * Removes line breaks, double spaces, HTML tags, HTML entities, etc.
     */
exports.cleanMicropost = function(micropost) {
      function strip_tags(input, allowed) {
        // http://kevin.vanzonneveld.net
        // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: Luke Godfrey
        // +      input by: Pul
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   bugfixed by: Onno Marsman
        // +      input by: Alex
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +      input by: Marc Palau
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +      input by: Brett Zamir (http://brett-zamir.me)
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   bugfixed by: Eric Nagel
        // +      input by: Bobby Drake
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   bugfixed by: Tomasz Wesolowski
        // +      input by: Evertjan Garretsen
        // +    revised by: Rafał Kukawski (http://blog.kukawski.pl/)
        // *     example 1: strip_tags('<p>Kevin</p> <br /><b>van</b> <i>Zonneveld</i>', '<i><b>');
        // *     returns 1: 'Kevin <b>van</b> <i>Zonneveld</i>'
        // *     example 2: strip_tags('<p>Kevin <img src="someimage.png" onmouseover="someFunction()">van <i>Zonneveld</i></p>', '<p>');
        // *     returns 2: '<p>Kevin van Zonneveld</p>'
        // *     example 3: strip_tags("<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>", "<a>");
        // *     returns 3: '<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>'
        // *     example 4: strip_tags('1 < 5 5 > 1');
        // *     returns 4: '1 < 5 5 > 1'
        // *     example 5: strip_tags('1 <br/> 1');
        // *     returns 5: '1  1'
        // *     example 6: strip_tags('1 <br/> 1', '<br>');
        // *     returns 6: '1  1'
        // *     example 7: strip_tags('1 <br/> 1', '<br><br/>');
        // *     returns 7: '1 <br/> 1'
        allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
          commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
        return input.replace(commentsAndPhpTags, '').replace(tags, function($0, $1) {
          return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
        });
      }

      if (micropost) {
        // replace HTML entities
        micropost = replaceHtmlEntities(micropost);
        // remove HTML tags. regular expression stolen from
        var cleanedMicropost = strip_tags(micropost);
        //all regular expressions below stolen from
        // https://raw.github.com/cramforce/streamie/master/public/lib/stream/-
        // streamplugins.js
        //
        // remove urls
        cleanedMicropost = cleanedMicropost.replace(GLOBAL_config.URL_REGEX, ' ');
        // simplify #hashtags to hashtags
        cleanedMicropost = cleanedMicropost.replace(GLOBAL_config.HASHTAG_REGEX, ' $2');
        // simplify @username to username
        cleanedMicropost = cleanedMicropost.replace(GLOBAL_config.USER_REGEX, ' $2');
        // simplify +username to username
        cleanedMicropost = cleanedMicropost.replace(GLOBAL_config.PLUS_REGEX, ' $2');
        // replace line feeds and duplicate spaces
        micropost = micropost.replace(/[\n\r\t]/gi, ' ').replace(/\s+/g, ' ');
        cleanedMicropost = cleanedMicropost.replace(/[\n\r\t]/gi, ' ').replace(/\s+/g, ' ');
        return {
          html: micropost.trim(),
          plainText: cleanedMicropost.trim()
        };
      }
    }

    /**
     * Replaces HTML entities
     */
var replaceHtmlEntities = function(micropost) {  
  micropost = micropost.replace(/&quot;/gi, '\"');
  micropost = micropost.replace(/&apos;/gi, '\'');
  micropost = micropost.replace(/&#39;/gi, '\'');
  micropost = micropost.replace(/&amp;/gi, '&');
  micropost = micropost.replace(/&gt;/gi, '>');
  micropost = micropost.replace(/&lt;/gi, '<');
  return micropost;
}

module.exports.replaceHtmlEntities = replaceHtmlEntities;
