(function(window) {
  'use strict';
  var App = window.App || {};
  let YoutubePlayer = (function() {

    let lastPosition = null
    let insideClick = null
    const minHeight = 50
    const minWidth = 75
    let minBorder = 25
    let isDragging = false

    let youtubePlayerBox = document.getElementById("youtubePlayerBox")
    let iframe = document.getElementById("youtubeIframe")

    youtubePlayerBox.addEventListener("mousedown",function(e){
      insideClick = {
        x:e.clientX - lastPosition.x,
        y:e.clientY - lastPosition.y,
      }
      isDragging = true
      youtubePlayerBox.classList.add("grabbed")
      iframe.style.pointerEvents = "none";
    })

    document.addEventListener("mouseup",function(e){
      isDragging = false
      youtubePlayerBox.classList.remove("grabbed")
      iframe.style.pointerEvents = "auto";
    })



    document.addEventListener("mousemove",function(e){
      if(isDragging){
        move(e)
      }
    })



    function makeAppearYoutubePlayerBox(){
      if(lastPosition == null){
        //let documentW = document.body.clientWidth;
        //let documentH = document.body.clientHeight;
        let windowW = window.innerWidth
        let windowH = window.innerHeight

        let width = Math.max(minWidth, windowW/2)
        let height = Math.max(minHeight, windowH/2)
        let x = (windowW-width)/2
        let y = (windowH-height)/2
        lastPosition = {
          x:x,
          y:y,
          width:width,
          height:height,
        }
        iframe.style.pointerEvents = "auto";
      }
      youtubePlayerBox.style.left = lastPosition.x+"px"
      youtubePlayerBox.style.top = lastPosition.y+"px"
      youtubePlayerBox.style.width = lastPosition.width+"px"
      youtubePlayerBox.style.height = lastPosition.height+"px"
      youtubePlayerBox.style.display = "block"
    }

    function hideYoutubePlayerBox(){
      youtubePlayerBox.style.display = "none"
    }

    function move(e){
      let newX = e.clientX - insideClick.x
      let newY = e.clientY - insideClick.y

      if(newX > window.innerWidth - minBorder){
        newX = window.innerWidth - minBorder
      }else if(newX + lastPosition.width < minBorder){
        newX = minBorder - lastPosition.width
      }

      if(newY > window.innerHeight - minBorder){
        newY = window.innerHeight - minBorder
      }else if(newY + lastPosition.height < minBorder){
        newY = minBorder - lastPosition.height
      }

      lastPosition.x = newX
      lastPosition.y = newY
      makeAppearYoutubePlayerBox()
    }
    makeAppearYoutubePlayerBox()






  return {

  }
})();
App.YoutubePlayer = YoutubePlayer;
window.App = App;
})(window);
