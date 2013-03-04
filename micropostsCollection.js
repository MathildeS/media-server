var GLOBAL_config = require('./global-config');
var request = require('request');
var pos = require('pos');
var Step = require('./step.js');

/**
     * Annotates microposts with DBpedia Spotlight
     */
var spotlight = function(json,callback) {
      if (!GLOBAL_config.NAMED_ENTITY_EXTRACTION) {
        return sendResults(json,callback);
      }
      if (GLOBAL_config.DEBUG) console.log('spotlight');
      var currentService = 'DBpediaSpotlight';
      var options = {
        headers: {
          "Accept": 'application/json'
        },
        body: ''
      };
      var collector = {};
      var httpMethod = 'POST'; // 'GET';
      options.method = httpMethod;
      Step(
        function() {
          var group = this.group();
          var services = typeof json === 'object' ? Object.keys(json) : [];
          services.forEach(function(serviceName) {
            var service = json[serviceName] || [];
            collector[serviceName] = [];
            service.forEach(function(item, i) {
              var text;
              if ((item.micropost.translation) &&
                  (item.micropost.translation.text) &&
                  (item.micropost.translation.language !== 'en')) {
                // for non-English texts, use the translation if it exists
                text = item.micropost.translation.text;
              } else {
                // use the original version
                text = item.micropost.clean;
              }
              if (httpMethod === 'POST') {
                options.headers['Content-Type'] =
                    'application/x-www-form-urlencoded; charset=UTF-8';
                // non-testing env: 'http://spotlight.dbpedia.org/rest/annotate';
                options.url = 'http://spotlight.dbpedia.org/dev/rest/annotate';
                options.body =
                    'text=' + encodeURIComponent(text) +
                    '&confidence=0.2&support=20';
              } else {
                // non-testing env: 'http://spotlight.dbpedia.org/rest/annotate' +
                options.url = 'http://spotlight.dbpedia.org/dev/rest/annotate' +
                    '?text=' + encodeURIComponent(text) +
                    '&confidence=0.2&support=20';
              }
              var cb = group();
              request(options, function(err, res, body) {
                if (!err && res.statusCode === 200) {
                  var response;
                  try {
                    response = JSON.parse(body);
                  } catch(e) {
                    // error
                    collector[serviceName][i] = [];
                    return cb(null);
                  }
                  if (response.Error || !response.Resources) {
                    // error
                    collector[serviceName][i] = [];
                    return cb(null);
                  }
                  var entities = [];
                  if (response.Resources) {
                    var uris = {};
                    var resources = response.Resources;
                    for (var j = 0, len = resources.length; j < len; j++) {
                      var entity = resources[j];
                      // the value of entity['@URI'] is not unique, but we only
                      // need it once, we simply don't care about the other
                      // occurrences
                      var currentUri = entity['@URI'];
                      if (!uris[currentUri]) {
                        uris[currentUri] = true;
                        entities.push({
                          name: entity['@surfaceForm'],
                          relevance: parseFloat(entity['@similarityScore']),
                          uris: [{
                            uri: currentUri,
                            source: currentService
                          }],
                          source: currentService
                        });
                      }
                    }
                  }
                  // success
                  collector[serviceName][i] = entities;
                } else {
                  // error
                  collector[serviceName][i] = [];
                }
                cb(null);
              });
            });
          });
        },
        function(err) {
          var services = typeof json === 'object' ? Object.keys(json) : [];
          services.forEach(function(serviceName) {
            var service = json[serviceName] || [];
            service.forEach(function(item, i) {
              item.micropost.entities = collector[serviceName][i];
              // part of speech tagging, PoS
              if (GLOBAL_config.PART_OF_SPEECH) {
                var words;
                if ((item.micropost.translation) &&
                    (item.micropost.translation.text) &&
                    (item.micropost.translation.language !== 'en')) {
                  // for non-English texts, use the translation if it exists
                  words = new pos.Lexer().lex(item.micropost.translation.text);
                } else {
                  words = new pos.Lexer().lex(item.micropost.clean);
                }
                var taggedWords = new pos.POSTagger().tag(words);
                var result = [];
                for (var j = 0, len = taggedWords.length; j < len; j++) {
                  var taggedWord = taggedWords[j];
                  // for all recognized noun types
                  if ((taggedWord[1] === 'NNS') ||
                      (taggedWord[1] === 'NNPS') ||
                      (taggedWord[1] === 'NNP')) {
                    var word = taggedWord[0];
                    var tag = taggedWord[2];
                    result.push({
                      word: word.toLowerCase(),
                      tag: tag
                    });
                  }
                  item.micropost.nouns = result;
                }
              }
            });
          });
          sendResults(json,callback);
        }
      );
    };
    
    
    /**
     * Translates microposts one by one
     */
var translate = function(json,callback) {
      if (GLOBAL_config.DEBUG) console.log('translate');
      var options;
      if (GLOBAL_config.USE_GOOGLE_RESEARCH_API) {
        /*
        options = {
          headers: {
            "X-HTTP-Method-Override": 'GET',
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Authorization": "GoogleLogin auth=" +
                GLOBAL_config.GOOGLE_RESEARCH_API_KEY
          },
          method: 'POST',
          url: 'http://translate.google.com/researchapi/translate',
          body: 'tl=en'
        };
        */
        options = {
          headers: {
            "X-HTTP-Method-Override": 'GET',
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Authorization": "GoogleLogin auth=" +
                GLOBAL_config.GOOGLE_RESEARCH_API_KEY
          },
          method: 'POST',
          url: 'https://www.googleapis.com/language/translate/v2',
          body: 'key=' + GLOBAL_config.GOOGLE_RESEARCH_API_KEY + '&target=en'
        };

      } else {
        options = {
          headers: {
            "X-HTTP-Method-Override": 'GET',
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          method: 'POST',
          url: 'https://www.googleapis.com/language/translate/v2',
          body: 'key=' + GLOBAL_config.GOOGLE_KEY + '&target=en'
        };
      }
      var collector = {};
      Step(
        function() {
          var group = this.group();
          var services = typeof json === 'object' ? Object.keys(json) : [];
          services.forEach(function(serviceName) {
            var cb = group();
            var service = json[serviceName] || [];
            collector[serviceName] = [];
            service.forEach(function(item, i) {
              var text = item.micropost.clean;
              if (GLOBAL_config.USE_GOOGLE_RESEARCH_API) {
                //options.body = 'tl=en&q=' + encodeURIComponent(text);
                options.body += '&q=' + encodeURIComponent(text);
              } else {
                options.body += '&q=' + encodeURIComponent(text);
              }
              collector[serviceName][i] = {
                text: '',
                language: ''
              };
            });
            request(options, function(err1, res1, body) {
  //  FixMe console.log(JSON.stringify(options))
                var response;
                if (GLOBAL_config.USE_GOOGLE_RESEARCH_API) {
  // FixMe console.log('hello')
  // FixMe res.send(body);
                } else {
                  if (!err1 && res1.statusCode === 200) {
                    try {
                      response = JSON.parse(body);
                    } catch(e) {
                      // error
                      return cb(null);
                    }
                    if ((response.data) &&
                        (response.data.translations) &&
                        (Array.isArray(response.data.translations))) {
                      response.data.translations.forEach(function(translation, j) {
                        collector[serviceName][j] = {
                          text: cleanMessage.replaceHtmlEntities(translation.translatedText),
                          language: translation.detectedSourceLanguage
                        };
                      });
                    }
                  } else {
                    // error
                    return cb(null);
                  }
                }
                cb(null);
            });
          });
        },
        function(err) {
          var services = typeof json === 'object' ? Object.keys(json) : [];
          services.forEach(function(serviceName) {
            var service = json[serviceName] || [];
            service.forEach(function(item, i) {
              item.micropost.translation = collector[serviceName][i];
            });
          });
          spotlight(json,callback);
        }
      );
    };
    
    /**
     * Filters out the items that are older than *days*
     */    
var removeOld = function(items, days) {
        var d = +new Date();
        days = parseInt(days);
        if (items && days > 0) {
          return items.filter(function(item) {
            return (item.timestamp > (d - (3600 * 24 * 1000 * days)));
          });
        }
        return items;
    };
    
 /**
     * Collects results to be sent back to the client
     */  
    
var collectResults = function(json, service, pendingRequests,callback) {
      if (GLOBAL_config.DEBUG) console.log('collectResults for ' + service);
      if (!pendingRequests) {
        if (service !== 'combined') {
          var temp = json;
          json = {};
          json[service] = temp;
	}
        // make sure that after a timeout, where a service's result can still be
        // the initial value of boolean false, we set the value to empty array
        var services = typeof json === 'object' ? Object.keys(json) : [];
        services.forEach(function(serviceName) {
          if (json[serviceName] === false) {
            json[serviceName] = [];
          }
        });
        if (GLOBAL_config.TRANSLATE) {
          translate(json);
        } else {
          spotlight(json,callback);
        }
      } else {
        pendingRequests[service] = GLOBAL_config.REMOVE_BEFORE_DAYS ? removeOld(json, GLOBAL_config.REMOVE_BEFORE_DAYS) : json;
      }
    };

    /**
     * Sends results back to the client
     */
var sendResults = function(json,callback) {
  if (GLOBAL_config.DEBUG) console.log('sendResults');
  callback(json);
};

module.exports.spotlight = spotlight;
module.exports.translate = translate;
module.exports.removeOld = removeOld;
module.exports.collectResults = collectResults;
module.exports.sendResults = sendResults;