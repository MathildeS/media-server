var GLOBAL_config = require('../global-config');
var request = require('request');
var mCollection = require('../micropostsCollection.js');


function getContent(pendingRequests) {
	var query = module.parent.exports.query;
	var callback = module.parent.exports.callback;
        var currentService = 'UEP';
	var channel;
	if (GLOBAL_config.CALL_TYPE === 'RBB') channel='rbb';
	else if (GLOBAL_config.CALL_TYPE === 'SV') channel='sv'; 
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var options = {
          url: 'http://ir.lmcloud.vse.cz/irapi/media-server/?q=(media_title:*' +
              encodeURIComponent(query) +'* OR media_description:*' + encodeURIComponent(query) + '*) AND domain_source:' + channel,
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