var GLOBAL_config = require('../global-config');
var querystring = require('querystring');
var request = require('request');
var mCollection = require('../micropostsCollection.js');
var cleanMessage= require('../cleanMessages.js');
var Step = require('../step.js');
var rbbChannels = require('../rbbChannels.js').channels;
var svChannels = require('../svChannels.js').channels;

var currentService = 'YouTube';
var results ;
var query ;
var callback ;
var numberCalls ; // the actual number of request made. When all request have been made, ie numberCalls === numberChannels, we collect the results
var totalCalls ;  // store the total number of requests to be made = the number of channels 


function getContent(pendingRequests) {
  results = [];
  query = module.parent.exports.query;
  callback = module.parent.exports.callback; 
  numberCalls = 0;
  totalCalls = 0;
  
  if (GLOBAL_config.DEBUG) console.log(currentService + ' *** ' + query);  
  if (GLOBAL_config.CALL_TYPE === 'RBB') { 
    console.log('searching RBB authorized channels');
    for (var channel in rbbChannels) {
      console.log(channel);      
      totalCalls++;
      getContentChannel(pendingRequests, rbbChannels[channel]);	
    }
    if (totalCalls ===0) {
      console.log('no channel defined by RBB, searching all YouTube');
      totalCalls = 1;
      getContentChannel(pendingRequests, null);
    }
  }
  else if (GLOBAL_config.CALL_TYPE === 'SV'){
    console.log('searching SV authorized channels');    
    for (var channel in svChannels) {
      console.log(channel);
      totalCalls++;
      getContentChannel(pendingRequests, svChannels[channel]);	
    }
    if (totalCalls ===0) {
      console.log('no channel defined by SV, searching all YouTube');
      totalCalls = 1;
      getContentChannel(pendingRequests, null);
    }
  }
  else {
    // if "combined" or "fresh" query
    console.log('searching all YouTube');
    totalCalls = 1;
    getContentChannel(pendingRequests, null);
  }
};
	  
  
function getContentChannel(pendingRequests, channel){		
        var params = {
          part: 'id',
          type: 'video',
          q: query,         
          maxResults: 5, 
          key: GLOBAL_config.YOUTUBE_KEY
        };
	if (channel !== null) params['channelId']= channel;
        params = querystring.stringify(params);
        var options = {
          url: 'https://www.googleapis.com/youtube/v3/search?' + params,
          headers: GLOBAL_config.HEADERS
        };
        if (GLOBAL_config.DEBUG) console.log(currentService + ' ' + options.url);
        request.get(options, function(err, reply, body) {
          try {
            body = JSON.parse(body);                        
	    if ((body.items) && (body.pageInfo.totalResults)) {
              var items = body.items;
	      var ids = '';
	      items.forEach(function(item) {	
		ids+=item.id.videoId+',';
	      });
	      	      
              params = {
		id: ids,
		part: 'id,snippet,player,statistics,status',
		key: GLOBAL_config.YOUTUBE_KEY
	      };
	      params = querystring.stringify(params);	      
	      var options = {
		url: 'https://www.googleapis.com/youtube/v3/videos?' + params,
		headers: GLOBAL_config.HEADERS
	      };
	      
	      request.get(options, function(err, reply, body2) {
		try {
		  body2 = JSON.parse(body2);		  
		  if (body2.items) {	 
		    items = body2.items;	
		    Step(
		    function() {
		      var group = this.group();	
		      items.forEach(function(item) {			
			/* TODO check if some restriction is needed
			if (item.accessControl.embed !== 'allowed') {
			  return;
			};*/
			var cb = group();
			var timestamp = Date.parse(item.snippet.publishedAt);				
			  results.push({
			    mediaUrl: 'https://www.youtube.com/embed/'+item.id,
			    posterUrl: item.snippet.thumbnails.default.url,
			    micropostUrl: 'http://www.youtube.com/watch?v='+item.id,
			    micropost: cleanMessage.cleanMicropost(
                            item.snippet.title + '. ' + item.snippet.description),
			    userProfileUrl: 'https://www.youtube.com/channel/'+item.snippet.channelId,
			    type: 'video',
			    timestamp: timestamp,
			    publicationDate: cleanMessage.getIsoDateString(timestamp),
			    socialInteractions: {
			      likes: parseInt(item.statistics.likeCount, 10) +
                              parseInt(item.statistics.favoriteCount, 10),
			      shares: null,
			      comments: parseInt(item.statistics.commentCount,10),
			      views: parseInt(item.statistics.viewCount,10)
			    }
			  });	
			  cb();                        
		      });
		    },
		    function(err) {
		      numberCalls ++;		      
		      if (numberCalls === totalCalls) mCollection.collectResults(results, currentService, pendingRequests,callback);
		    }
		    ); 
		  }
          else {
          numberCalls ++;
          if (numberCalls === totalCalls) mCollection.collectResults(results, currentService, pendingRequests,callback);
          }
		} catch (e) {		  
		  numberCalls ++;
          if (numberCalls === totalCalls) mCollection.collectResults(results, currentService, pendingRequests,callback);
		}
	      });	
	    }
            else {
	      numberCalls ++;	      
	      if (numberCalls === totalCalls) mCollection.collectResults(results, currentService, pendingRequests,callback);
	    }
          } catch(e) {	    
	    numberCalls ++;
        if (numberCalls === totalCalls) mCollection.collectResults(results, currentService, pendingRequests,callback);
          }
        });
      };
      
module.exports = getContent;