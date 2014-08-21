var TestResult = Backbone.Model.extend({
  idAttribute: 'reporterId',

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

  specsData: function(type){
    var testInfo = this.get('testInfo');
    var suitesCompletes = _.filter(testInfo, function(data){
      if(data.stage === 'suite_complete'){
        if(typeof type === 'boolean'){
          if(data.data.passed === type){
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
    var ret = _.map(suitesCompletes, function(data, index){
      return {
        ts: data.ts,
        suite_name: data.data.name,
        passed: data.data.passed,
        total_assertions: data.data.totalCount,
        inverted: index%2 === 0
      }
    });
    return ret;
  }
});

var TestResults = Backbone.Collection.extend({
  model: TestResult,

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
  }
});