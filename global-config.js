module.exports = {
  DEBUG: true,
  CALL_TYPE: 'RBB',
  REMOVE_BEFORE_DAYS: 7,
  TRANSLATE: false,
  PART_OF_SPEECH: false,
  NAMED_ENTITY_EXTRACTION: false,
  USE_GOOGLE_RESEARCH_API: false,
  MOBYPICTURE_KEY: 'TGoRMvQMAzWL2e9t',
  FLICKR_SECRET: 'a4a150addb7d59f1',
  FLICKR_KEY: 'b0f2a04baa5dd667fb181701408db162',
  YFROG_KEY: '89ABGHIX5300cc8f06b447103e19a201c7599962',
  LOCKERZ_KEY: 'f42ed850-c341-46ca-8360-dc47c049b73a',
  INSTAGRAM_KEY: '82fe3d0649e04c2da8e38736547f9170',
  INSTAGRAM_SECRET: 'b0b5316d40a74dffab16bfe3b0dfd5b6',
  GOOGLE_KEY: 'AIzaSyC5GxhDFxBHTKCLNMYtYm6o1tiagi65Ufc',
  GOOGLE_RESEARCH_API_KEY: 'DQAAAMcAAAAcGiug619uBnQa2Joxo2vPo2Bup-s062p1fLvLpRM9Mc7IdRUeJ-YZUv9BcuXgAdWcg1uu5YrIRLvzA_eojgOmpGF6wF3Bsd5pYAczmtTeNcpgzdWI5otAToWwPkSuRRulDUqAUZdnCXwjuR8XTobYVLNNmO-sqVeXIwaT593vH2eDGycOoYyeDEji0jmPTXkvqV9_T20u7Zb5jWcl2b-Kz5B6n2OuKSIZjRU_8bqKzasAQD5r9ycFY5uWTQPyUA3lFRqdgS0tTDPpFL9-bXFP',
  IMGUR_KEY: '9b7d0e62bfaacc04db0b719c998d225e',  
  YOUTUBE_KEY: 'AIzaSyCf-hN5N4RaIKzDjx2gsXuQ4A2hCEWbnhE',
  HEADERS: {
    "Accept": "application/json, text/javascript, */*",
    "Accept-Charset": "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
    "Accept-Language": "en-US,en;q=0.8,fr-FR;q=0.6,fr;q=0.4,de;q=0.2,de-DE;q=0.2,es;q=0.2,ca;q=0.2",
    "Connection": "keep-alive",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Referer": "http://www.google.com/",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.854.0 Safari/535.2",
  },
  MEDIA_PLATFORMS: [
    'yfrog.com',
    'instagr.am',
    'flic.kr',
    'moby.to',
    'youtu.be',
    'twitpic.com',
    'lockerz.com',
    'picplz.com',
    'qik.com',
    'ustre.am',
    'twitvid.com',
    'photobucket.com',
    'pic.twitter.com',
    'i.imgur.com',
    'picasaweb.google.com',
    'twitgoo.com',
    'vimeo.com',
    'img.ly',
    'mypict.me'],
  URL_REGEX: /\b((?:[a-z][\w\-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig,
  HASHTAG_REGEX: /(^|\s)\#(\S+)/g,
  USER_REGEX: /(^|\W)\@([a-zA-Z0-9_]+)/g,
  PLUS_REGEX: /(^|\W)\+([a-zA-Z0-9_]+)/g,
  TAG_REGEX: /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi
};