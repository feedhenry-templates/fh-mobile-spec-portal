var TestResult = Backbone.Model.extend({
  idAttribute: 'reporterId',
  failedSpecsMap: null,

  startTime: function(){
    var testInfo = this.get('testInfo');
    var started = _.findWhere(testInfo, {
      order: 0
    });
    var ts = started.ts;
    return ts;
  },

  getCompleteInfo: function(){
    var testInfo = this.get('testInfo');
    var completeInfo = _.findWhere
    (testInfo, {
      stage: 'complete'
    });
    return completeInfo;
  },

  totalSpecs: function(){
    var completeInfo = this.getCompleteInfo();
    if(completeInfo){
      return completeInfo.data.total_specs;
    } else {
      return 'N/A';
    }
  },

  failedSpecs: function(){
    var completeInfo = this.getCompleteInfo();
    if(completeInfo){
      return completeInfo.data.failed_specs;
    } else {
      return 'N/A';
    }
  },

  passedSpecs: function(){
    var completeInfo = this.getCompleteInfo();
    if(completeInfo){
      return completeInfo.data.passed_specs;
    } else {
      return 'N/A';
    }
  },

  skippedSpecs: function(){
    var completeInfo = this.getCompleteInfo();
    if(completeInfo){
      return completeInfo.data.skipped_specs;
    } else {
      return 'N/A';
    }
  },

  specsSummary: function(){
    if(this.getCompleteInfo()){
      return this.failedSpecs() + '/' + this.totalSpecs();
    } else {
      return 'Not Completed';
    }
  },

  totalTime: function(){
    var testInfo = this.get('testInfo');
    var start = testInfo[0].ts;
    var end = testInfo[testInfo.length-1].ts;
    var duration = end - start;
    return duration;
  },

  mergeFailed: function(testResultData){
    var failed = _.findWhere(testResultData, {stage:'spec_failed'});
    if(failed){
      var failedSpecs = {};
      _.each(testResultData, function(data){
        if(data.stage === 'spec_failed'){
          console.log(data);
          failedSpecs[data.order] = data.data;
        } else if(data.stage === 'suite_complete'){
          if(_.keys(failedSpecs).length > 0){
            data.data.specs = failedSpecs;
            failedSpecs = {};
          }
        }
      });
    }
    return testResultData;
  },

  specsData: function(type){
    var testInfo = this.mergeFailed(this.get('testInfo'));
    var suitesMap = {};
    var suitesCompletes = _.filter(testInfo, function(data){
      if(data.stage === 'suite_complete'){
        if(typeof type === 'boolean'){
          if(data.data.passed === type || (type && data.data.parents && data.data.parents.length === 0)){
            return true;
          } else {
            return false;
          }
        } else {
          return true;
        }
      } else {
        return false;
      }
    });

   
    _.each(suitesCompletes, function(suite){
      var addTarget = suitesMap;

      if(suite.data.parents && suite.data.parents.length > 0){
        var parentIds = suite.data.parents;
        for(var i=parentIds.length - 1; i >= 0; i--){
          var parentId = parentIds[i];
          if(!addTarget[parentId]){
            addTarget[parentId] = {
              children: {}
            };
          }
          addTarget = addTarget[parentId].children;
        }
      }

      addTarget[suite.data.suiteId] = addTarget[suite.data.suiteId] || {};
      addTarget[suite.data.suiteId].suite_name = suite.data.desc || suite.data.name;
      addTarget[suite.data.suiteId].total_assertions = suite.data.totalCount;
      addTarget[suite.data.suiteId].passed = suite.data.passed;
      addTarget[suite.data.suiteId].id = suite.data.suiteId;
      if(suite.data.specs){
        addTarget[suite.data.suiteId].specs = suite.data.specs;
      }
    });

    console.log(suitesMap);
    return suitesMap;
  },

  failedSpecsDetails: function(){
    var self = this;
    if(self.failedSpecsMap){
      return self.failedSpecsMap;
    } else {
      var suitesContaisFailedSpecs = this.specsData(false);
      var failedSpecsMap = {};

      var findFailedSpecs = function(suite, parentSuite){
        if(suite.specs){
          _.each(suite.specs, function(spec){
            if(!spec.passed){
              spec.parentSuites = [].concat(parentSuite).concat([suite.suite_name]);
              spec.ts = self.startTime();
              if(!failedSpecsMap[spec.desc]){
                failedSpecsMap[spec.desc] = spec;
              }
            }
          })
        }
        if(suite.children){
          parentSuite = parentSuite.concat([suite.suite_name]);
          _.each(suite.children, function(childSuite){
            findFailedSpecs(childSuite, parentSuite);
          });
        }
      }

      _.each(suitesContaisFailedSpecs, function(suite, index){
        findFailedSpecs(suite, []);
      });

      self.failedSpecsMap = failedSpecsMap;
      return self.failedSpecsMap;
    }
  }
});

var TestResults = Backbone.Collection.extend({
  model: TestResult,
  allFailedSpecs : null,

  _colourForKey: function(key) {
    if (key.toLowerCase() === 'win32nt') {
      return "#fb9d00";
    } else if (key.toLowerCase() === 'blackberry') {
      return "#df3f1f";
    } else if (key.toLowerCase() === 'ios') {
      return "#666666";
    } else if (key.toLowerCase() === 'android') {
      return "#7bb900";
    } else if (key.toLowerCase() === 'studio') {
      return '#3d96ae';
    } else if (key.toLowerCase() === 'ipad') {
      return '#aa4643';
    } else if (key.toLowerCase() === 'ios') {
      return '#484848';
    } else if (key.toLowerCase() === 'embed') {
      return '#4572a7';
    } else if (key.toLowerCase() === 'fhc') {
      return '#492970';
    } else if (key.toLowerCase() === 'web') {
      return '#92A8CD';
    } else if (key.toLowerCase() === 'mobile') {
      return '#80699B';
    } else if (key.toLowerCase() === '') {
      // Other
      return '#db843d';
    } else {
      var random_colours = ['#aa4643', '#80699b', '#db843d', '#4572A7', '#AA4643', '#89A54E', '#3D96AE', '#DB843D', '#A47D7C', '#B5CA92'];
      var random_colour = random_colours[Math.floor(Math.random() * random_colours.length)];
      return random_colour;
    }
  },

  _filterDeviceInfo: function(key) {
    var deviceInfo = {};

    this.each(function(model, i) {
      var device = model.get('deviceInfo');
      var item = device[key];
      if (!_.has(deviceInfo, item)) {
        // New, add
        deviceInfo[item] = {
          value: 1,
          label: item
        };
      } else {
        // Existing, update value
        var existing = deviceInfo[item];
        deviceInfo[item] = {
          value: existing.value += 1,
          label: existing.label
        };
      }
    }, this);

    var data = [];

    _.each(deviceInfo, function(object, key) {
      var color = this._colourForKey(key);
      data.push({
        value: object.value,
        label: key,
        color: color,
        highlight: color
      });
    }, this);

    return data;
  },

  byOS: function() {
    return this._filterDeviceInfo('platform');
  },

  byCordova: function() {
    return this._filterDeviceInfo('cordova');
  },

  byDevice: function() {
    return this._filterDeviceInfo('model');
  },

  getPlatforms: function (){
    var allplatforms = [];
    this.each(function(model){
      var pl = model.get('deviceInfo').platform.toLowerCase();
      if(allplatforms.indexOf(pl) === -1){
        allplatforms.push(pl);
      }
    });
    return allplatforms;
  },

  failureData: function(platform){
    var self = this;
    var dataForPlatform = this.filter(function(model){
      return model.get('deviceInfo').platform.toLowerCase() === platform.toLowerCase();
    });

    var color = self._colourForKey(platform);
    var labels = [];
    var datasets = [{
      label: platform + ' Failed Sepcs',
      fillColor: color,
      strokeColor: color,
      highlightFill: color,
      highlightStroke: color,
      data:[]
    }];

    if(dataForPlatform.length > 0){
      
      _.each(dataForPlatform, function(model){
        var timelabel = moment(model.startTime()).format('MM-DD,H:mm');
        labels.push(timelabel);
        datasets[0].data.push(model.failedSpecs() === 'N/A'?0: model.failedSpecs());
      });
    }

    return {
      labels: labels,
      datasets: datasets
    }
  },

  failedSpecsDetails: function(){
    var self = this;
    if(self.allFailedSpecs){
      return self.allFailedSpecs;
    } else {
      var failedSpecsMap = {};
      this.each(function(model){
        var failedSpecs = model.failedSpecsDetails();
        _.each(failedSpecs, function(failedSpec, key){
          if(!failedSpecsMap[key]){
            failedSpecsMap[key] = {failureCount: 0, devices: [], lastFail: -1};
          }
          failedSpecsMap[key].failureCount++;
          if(failedSpec.ts && failedSpec.ts > failedSpecsMap[key].lastFail){
            failedSpecsMap[key].lastFail = failedSpec.ts;
          }
          var exists = self.deviceExists(failedSpecsMap[key].devices, model.get('deviceInfo'));
          if(!exists){
            var data = _.clone(model.get('deviceInfo'));
            data.tests = {};
            data.tests[model.get('reporterId')] = {
              reporterId: model.get('reporterId'),
              result: model.specsSummary(),
              ts: failedSpec.ts
            }
            failedSpecsMap[key].devices.push(data);
          } else {
            if(!exists.tests[model.get('reporterId')]){
              exists.tests[model.get('reporterId')] = {
                reporterId: model.get('reporterId'),
                result: model.specsSummary(),
                ts: failedSpec.ts
              }
            }
          }
        });
      });
      var ret = [];
      _.each(failedSpecsMap, function(value, key){
        var data = value;
        data.id = ret.length;
        value.specName = key;
        ret.push(data);
      });
      self.allFailedSpecs = ret;
      console.log(ret);
      return self.allFailedSpecs;
    }
  },

  deviceExists: function(deviceArray, device){
    var exists = _.findWhere(deviceArray, device);
    return exists;
  }
});