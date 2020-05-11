(function(window) {
  'use strict';
  var App = window.App || {};
  let YoutubePlayer = (function() {

    let youtubePlayerBox = document.getElementById("youtubePlayerBox")

    let lastPosition = null

    function makeAppearYoutubePlayerBox(){
      if(lastPosition == null){
        lastPosition = {
          x:200,
          y:0,
          width:100,
          height:200,
        }
      }
      youtubePlayerBox.style.left = lastPosition.x+"px"
      youtubePlayerBox.style.top = lastPosition.y+"px"
      youtubePlayerBox.style.width = lastPosition.width+"px"
      youtubePlayerBox.style.height = lastPosition.height+"px"



    }
    makeAppearYoutubePlayerBox()





  return {

  }
})();
App.YoutubePlayer = YoutubePlayer;
window.App = App;
})(window);
