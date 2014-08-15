var TestResultsView = Backbone.View.extend({
  
  render: function(){
    var self = this;
    console.log(this.collection.toJSON());
    var tableEl = self.$el.find('table');
    tableEl.dataTable({
      data: self.collection.toJSON(),
      paging: true,
      pageLength: 20,
      columns:[
        {
          title: 'Device',
          data: 'deviceInfo.platform'  
        },
        {
          title: 'OS Version',
          data: 'deviceInfo.version',
        },
        {
          title: 'UUID',
          data: 'deviceInfo.uuid'
        },
        {
          title: 'Device Model',
          data: 'deviceInfo.model'
        },
        {
          title: 'Cordova Version',
          data: 'deviceInfo.cordova',
        },
        {
          title: 'Test Time',
          data: function(row, type){
            var testInfo = row.testInfo;
            var started = _.findWhere(testInfo, {stage: 'runner_starting'});
            if(started){
              var ts = started.ts;
              return moment(ts).fromNow();
            } else {
              return 'Unknown';
            }
          }
        },
        {
          title: 'Test Results (Failed/Total)',
          data: function(row, type, set, meta){
            var testInfo = row.testInfo;
            var completeInfo = _.findWhere(testInfo, {stage:'complete'});
            if(completeInfo){
              var result = completeInfo.data.failed_specs + '/' + completeInfo.data.total_specs;
              return result;
            } else {
              return 'Not Completed';
            }
          }
        }
      ]
    });
  }
});