var GLOBAL_config = require('../global-config');
var request = require('request');
var mCollection = require('../micropostsCollection.js');


function getContent(pendingRequests) {
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
        var currentService = 'UEP';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var options = {
          url: 'http://ir.lmcloud.vse.cz:8080/irapi/media-server/?q=img_src:* AND img_title:*' +
              encodeURIComponent(query) +'*',
          headers: GLOBAL_config.HEADERS
        };	
        var results = [];
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
	  try {
            body = JSON.parse(body);
	    if (Object.keys(body).length){	      
	      results = body;	      
	    }
	  } catch(e) {
            // noop
          }
	  mCollection.collectResults(results, currentService, pendingRequests,callback);
        });
      };
      
module.exports = getContent;