(function(window) {
  'use strict';
  var App = window.App || {};
  let Plot1DataModel = (function() {

    /**From the csv file, task is to return the data object*/
    function prepareData(csvData,stacksSupperpose,stackClever){
      //getting all the categories
      let categories = []
      for (let prop in csvData[0]) {
        if (csvData[0].hasOwnProperty(prop)) {
          if (prop != 'Year') {
            categories.push(prop);
          }
        }
      };

      let maxScore =  Number.MIN_VALUE;
      //mapping each line to an array
      let arrayData = csvData.map(d => {
        //for each date:
        let values = []
        for (let prop in d) {
          //for each category:
          if (d.hasOwnProperty(prop) && prop != 'Year') {
            values.push(parseFloat(d[prop]))
          }
        }
        /* Convert "Year" column to Date format to benefit
        from built-in D3 mechanisms for handling dates. */
        let date = new Date(d.Year, 0, 1);
        let localMax = stacksSupperpose ? values.reduce((a,b) => a + b, 0) : values.reduce((a,b) => a > b ? a:b, 0)

        if(localMax>maxScore){
          maxScore = localMax
        }

        return {
          date : date,
          values : values
        }
      });

      let smallestDate = arrayData[0].date;
      let biggestDate = arrayData[arrayData.length - 1].date;

      return{
        categories:categories,
        maxScore:maxScore,
        values:arrayData,
        smallestDate:smallestDate,
        biggestDate:biggestDate,
      }
    }

    function getIndexes(data){
      //the idea here is to get the indexes of the data for the one two charts intersect
      let values = data.values.slice()
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
      let indicesOfEqualities = []
      let previousOrder = valuesSorted[0].map(x=>{return x[1]})
      for(let i = 1; i < valuesSorted.length; i++){
        let actualValues = valuesSorted[i].map(x=>{return x[0]})
        let actualOrder = valuesSorted[i].map(x=>{return x[1]})
        if(findDuplicates(actualValues).length > 0){
          indicesOfEqualities.push(i)
        }else{
          if(!arraysEqual(actualOrder,previousOrder)){
            indexesBeforeChanges.push(i-1)
          }
        }
        previousOrder = actualOrder
      }//end of for loop
      //console.log(indicesOfEqualities)
      //console.log(indexesBeforeChanges)
      data.timeStamps = getVerticalTimeStamps(data,indicesOfEqualities,indexesBeforeChanges)
    }

    function getVerticalTimeStamps(data,indicesOfEqualities,indexesBeforeChanges){
      let nbOfSep = 11
      let timeIntervalBetweenDates = data.values[1].date.getTime() - data.values[0].date.getTime()
      let stepWidth = timeIntervalBetweenDates/nbOfSep
      let timeStamps = []
      indicesOfEqualities.forEach(z=>{
        timeStamps.push(data.values[z].date.getTime())
      })
      indexesBeforeChanges.forEach(z=>{

        for (var i = 1; i < nbOfSep ; i++){
          let baseTemp = data.values[z].date.getTime()
          timeStamps.push(baseTemp + i * stepWidth)
        }
      })
      timeStamps = timeStamps.sort((a,b)=>{
        return a-b
      });
      return timeStamps
    }

    function findDuplicates(arr){
      let sorted_arr = arr.slice().sort((a,b)=>{
        return a-b
      });
      let results = [];
      for (let i = 0; i < sorted_arr.length - 1; i++) {
        if (sorted_arr[i + 1] == sorted_arr[i]) {
          results.push(sorted_arr[i]);
        }
      }
      return results;
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

    function getChartOrder(atTimeStamp){
      let heightDelta = 1/1000
      let paths = []
      for(var i = 0; i < data.categories.length; i++){
        let pathIdentifier = "path_nb_"+i
        let path = document.getElementById(pathIdentifier);
        paths.push(path)
      }
      let p = paths[0]

    }




  return {
    prepareData:prepareData,
  }
})();
App.Plot1DataModel = Plot1DataModel;
window.App = App;
})(window);
