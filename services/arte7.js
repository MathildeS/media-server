var GLOBAL_config = require('../global-config');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');


// parse a date; here, the format returned is dd/mm/YYYY hh:mm:ss +O100
function parseDate(input) {
  var parts = input.match(/(\d+)/g); // g for global modifier ; match any digit found  
  var date = parts[2]+ '-' + (parts[1]) + '-'+ parts[0] + 'T' + parts[3] +':' +  parts[4] +':'+ parts[5] + '+' + parts[6];    
  return Date.parse(date);  
}



function getContent(pendingRequests) {
  	var query = module.parent.exports.query;
  	var callback = module.parent.exports.callback;
        var currentService = 'Arte7';
        if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);
        var options = {
          url: 'http://www.arte.tv/tvhack/tvguide/videos/plus7/search/D/L3/' +
              encodeURIComponent(query) +
              '/ALL/ALL/-1/VIEWS/30/0.json',
          headers: GLOBAL_config.HEADERS
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          var results = [];
          try {
            body = JSON.parse(body);
            if (body.videoList && Array.isArray(body.videoList)) {
	      var items = body.videoList;	     
              Step(
                function() {
                  var group = this.group();		  
                  items.forEach(function(item) {
		    var cb = group();
                    var timestamp = parseDate(item.VDA);	
		    var tags='';
		    for (var i = 0; i < item.VTA.length; i++) {
		      tags+=item.VTA[i] + '. ' ;
		    };		    
		    results.push({
                        mediaUrl: item.VUP,
                        posterUrl: item.VTU.IUR,
                        micropostUrl: item.VTR,
                        micropost: cleanMessage.cleanMicropost(
                            item.VTI + '. ' +item.VDE + '. ' + item.V7T + '. ' + tags),
                        userProfileUrl: null,
                        type: 'video',
                        timestamp: timestamp,
                        publicationDate: cleanMessage.getIsoDateString(timestamp),
                        socialInteractions: {
                          likes: null,
                          shares: null,
                          comments: null,
                          views: item.VVI
                        }
                     }); 
		     cb(null);
		  });
		  
                },
                function(err) {
                  mCollection.collectResults(results, currentService, pendingRequests,callback);
                }
              ); 	      
            } else {
	      console.log('no media found');
              mCollection.collectResults(results, currentService, pendingRequests,callback);
            }
          } catch(e) {	    
            mCollection.collectResults(results, currentService, pendingRequests,callback);
          }
        });	
      };
      
module.exports = getContent;