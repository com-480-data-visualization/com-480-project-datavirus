(function(window) {
  'use strict';
  var App = window.App || {};
  let YoutubeAPI = (function() {
    const API_Key = "AIzaSyB0fx0AqSe-gzktQ4q9hbWQ5T1CBWDMnyo"

    function getMetaDataForVideo(videoId, callback){
      let url = "https://www.googleapis.com/youtube/v3/videos?id="+videoId+"&key="
      +API_Key+"&fields=items(id,snippet(publishedAt,channelId,title,description,thumbnails(medium(url))),statistics,contentDetails(duration))&part=snippet,statistics,contentDetails"
      ajaxGet(url,callback)
    }


    function ajaxGet(url, callback) {
      var req = new XMLHttpRequest();
      req.open("GET", url);
      req.addEventListener("load", function () {
        if (req.status >= 200 && req.status < 400) {
          // Appelle la fonction callback en lui passant la réponse de la requête
          callback(req.responseText);
        } else {
          console.error(req.status + " " + req.statusText + " " + url);
        }
      });
      req.addEventListener("error", function () {
        console.error("Erreur réseau avec l'URL " + url);
      });
      req.send(null);
    }


    /*
    //Example of use:
    getMetaDataForVideo("7lCDEYXw3mM", function(result){
    console.log(result)
  })
  */
  


  return {
    getMetaDataForVideo:getMetaDataForVideo,
  }
})();
App.YoutubeAPI = YoutubeAPI;
window.App = App;
})(window);
