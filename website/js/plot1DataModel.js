(function(window) {
  'use strict';
  var App = window.App || {};
  let Plot1DataModel = (function() {

    let pixelStepWidth = 30

    /**From the csv file, task is to return the data object*/
    function prepareData(csvData){
      //getting all the categories
      let categories = []
      for (let prop in csvData[0]) {
        if (csvData[0].hasOwnProperty(prop)) {
          if (prop != 'date') {
            categories.push(prop);
          }
        }
      };

      let maxSingleScore =  Number.MIN_VALUE;
      let maxScoreAtTimeStamp =  Number.MIN_VALUE;
      //mapping each line to an array
      let arrayData = csvData.map(d => {
        //for each date:
        let values = []
        for (let prop in d) {
          //for each category:
          if (d.hasOwnProperty(prop) && prop != 'date') {
            values.push(parseFloat(d[prop]))
          }
        }

        let date = new Date(Date.parse(d.date))
        let localSingleMax = values.reduce((a,b) => a > b ? a:b, 0)
        let localTemporalMax = values.reduce((a,b) => a + b, 0)

        if(localSingleMax>maxSingleScore){
          maxSingleScore = localSingleMax
        }

        if(localTemporalMax>maxScoreAtTimeStamp){
          maxScoreAtTimeStamp = localTemporalMax
        }

        return {
          date : date,
          values : values
        }
      });

      let smallestDate = arrayData[0].date;
      let biggestDate = arrayData[arrayData.length - 1].date;

      //we must compute the critical time stamps where any 2 lines might intersect
      let criticalIndexes = getCriticalIndexes(arrayData.slice())

      return{
        categories:categories,
        maxSingleScore:maxSingleScore,
        maxScoreAtTimeStamp:maxScoreAtTimeStamp,
        values:arrayData,
        smallestDate:smallestDate,
        biggestDate:biggestDate,
        criticalIndexes:criticalIndexes,
      }
    }

    function getCriticalIndexes(values){
      //the idea here is to get the indexes before any path could cross an other
      let valuesSorted = values.map(vs =>{
        let array = vs.values
        let arrayExtended = array.map((value, index)=>{
          return [value, index]
        })
        return arrayExtended.sort((b,a)=>{
          return a[0]-b[0]
        })
      })
      let indexesBeforeChanges = []
      let orderBeforeChanges = []
      let orderAfterChanges = []

      let startingOrder = valuesSorted[0].map(x=>{return x[1]})
      let previousOrder = startingOrder
      for(let i = 1; i < valuesSorted.length; i++){
        let actualOrder = valuesSorted[i].map(x=>{return x[1]})

        if(!arraysEqual(actualOrder,previousOrder)){
          indexesBeforeChanges.push(i-1)
          orderBeforeChanges.push(previousOrder)
          orderAfterChanges.push(actualOrder)
        }

        previousOrder = actualOrder
      }//end of for loop

      return{
        indexesBeforeChanges:indexesBeforeChanges,
        orderBeforeChanges:orderBeforeChanges,
        orderAfterChanges:orderAfterChanges,
        startingOrder:startingOrder,
      }
    }



    function computeTimeStampsBreaks(lines,data,xScale,dateDisplayedInterval){

      //how much pixels separate two values on screen for the actual scale
      let pixelIntervalBetweenDates = xScale(data.values[1].date) - xScale(data.values[0].date)
      let timeIntervalBetweenDates = data.values[1].date.getTime() - data.values[0].date.getTime()
      let nbOfInterval = Math.ceil(pixelIntervalBetweenDates/pixelStepWidth)

      let realStepWidth = timeIntervalBetweenDates/nbOfInterval
      let delta_x = pixelIntervalBetweenDates/nbOfInterval

      const smallestTimeStamp = dateDisplayedInterval[0].getTime()
      const largestTimeStamp = dateDisplayedInterval[1].getTime()


      let actualOrder = data.criticalIndexes.startingOrder
      let orderUntil = []
      let afterMinDate = false
      let beforeMaxDate = true

      data.criticalIndexes.indexesBeforeChanges.forEach((criticalIndex,i)=>{
        let expectedFinalOrder = data.criticalIndexes.orderAfterChanges[i]
        let baseTemp = data.values[criticalIndex].date.getTime()
        for (var i = 1; i < nbOfInterval ; i++){
          if(!arraysEqual(expectedFinalOrder,actualOrder)){
            let newTimeStamp = baseTemp + i * realStepWidth
            if(newTimeStamp>=smallestTimeStamp){
              afterMinDate = true
            }
            if(newTimeStamp>largestTimeStamp){
              beforeMaxDate = false
            }
            if(afterMinDate && beforeMaxDate){
              let orderAtT = getChartOrderNearTimeStamp(lines, newTimeStamp,delta_x,xScale)
              if(!arraysEqual(orderAtT,actualOrder)){
                orderUntil.push([actualOrder, newTimeStamp])
                actualOrder = orderAtT
              }
            }
          }
        }
        if(!arraysEqual(actualOrder,expectedFinalOrder) && beforeMaxDate){
          if(afterMinDate){
            console.log("Missing something")
            console.log(new Date( baseTemp + (nbOfInterval-1) * realStepWidth))
            console.log(actualOrder)
            console.log(expectedFinalOrder)
            //we missed something
            orderUntil.push([actualOrder, baseTemp + (nbOfInterval-1) * realStepWidth])
          }
          actualOrder = expectedFinalOrder
        }
      })

      if (orderUntil.length == 0){
        orderUntil.push([actualOrder, largestTimeStamp])
      }

      if(orderUntil[orderUntil.length-1][1]<largestTimeStamp){
        orderUntil.push([actualOrder, largestTimeStamp])
      }

      return orderUntil
    }



    function arraysEqual(a, b) {
      if (a === b) return true;
      if (a == null || b == null) return false;
      if (a.length != b.length) return false;

      for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }


    function getChartOrderNearTimeStamp(lines, timeStamp, delta_x, xScale){


      let toSort = []
      let x = xScale(timeStamp)
      lines.forEach(line=>{
        let totalLength = line.upperPathElem.getTotalLength()
        toSort.push([line.id, getPointAtX(x,delta_x,0,totalLength,line.upperPathElem).y])
      })
      toSort =  toSort.sort((a,b)=>{
        return a[1]-b[1]
      })

      let order = []
      toSort.forEach(el=>{
        order.push(el[0])
      })
      return order
    }


    function getPointAtX(x,delta,minX,maxX, path){
      let middle = (maxX+minX)/2
      let middlePoint = path.getPointAtLength(middle)
      var i = 0
      while (Math.abs(x-middlePoint.x)>=delta/2 && i < 100) {
        if(middlePoint.x < x){
          minX = middle
        }else{
          maxX = middle
        }
        middle = (minX + maxX)/2
        middlePoint = path.getPointAtLength(middle)
        i++
      }
      return middlePoint
    }


    return {
      prepareData:prepareData,
      computeTimeStampsBreaks:computeTimeStampsBreaks,
    }
  })();
  App.Plot1DataModel = Plot1DataModel;
  window.App = App;
})(window);
