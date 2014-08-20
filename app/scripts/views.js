var TestResultsView = Backbone.View.extend({
  template: "#results-template",

  render: function() {
    var self = this;
    console.log(this.collection.toJSON());

    var content = $(this.template).html();
    $(this.el).html(content);

    var tableEl = self.$el.find('table');
    var table = tableEl.dataTable({
      data: self.collection.toJSON(),
      paging: true,
      pageLength: 10,
      "sDom": '<"top">rt<"bottom"lp><"clear">',
      columns: [{
        title: 'Device',
        data: 'deviceInfo.platform'
      }, {
        title: 'OS Version',
        data: 'deviceInfo.version',
      }, {
        title: 'UUID',
        data: 'deviceInfo.uuid'
      }, {
        title: 'Device Model',
        data: 'deviceInfo.model'
      }, {
        title: 'Cordova Version',
        data: 'deviceInfo.cordova',
      }, {
        title: 'Test Time',
        data: function(row, type) {
          var testInfo = row.testInfo;
          var started = _.findWhere(testInfo, {
            stage: 'runner_starting'
          });
          if (started) {
            var ts = started.ts;
            return moment(ts).fromNow();
          } else {
            return 'Unknown';
          }
        }
      }, {
        title: 'Test Results (Failed/Total)',
        data: function(row, type, set, meta) {
          var testInfo = row.testInfo;
          var completeInfo = _.findWhere(testInfo, {
            stage: 'complete'
          });
          if (completeInfo) {
            var result = completeInfo.data.failed_specs + '/' + completeInfo.data.total_specs;
            return result;
          } else {
            return 'Not Completed';
          }
        }
      }]
    });

    // Custom search
    $('input.search').on('keyup', function(e) {
      var search = $(e.currentTarget).val();
      table.fnFilter(search);
    });
  }
});


var TestChartsView = Backbone.View.extend({
  template: "#charts-template",

  render: function() {
    var self = this;
    var content = $(this.template).html();
    $(this.el).html(content);

    this.renderOS();
    this.renderCordova();
    this.renderDevice();
  },

  renderOS: function() {
    var el = this.$el.find('#os');
    var data = this.collection.byOS();
    var ctx = el.get(0).getContext("2d");
    var chart = new Chart(ctx).Doughnut(data, this.doughnutOptions);
  },

  renderCordova: function() {
    var el = this.$el.find('#cordova_version');
    var data = this.collection.byCordova();
    var ctx = el.get(0).getContext("2d");
    var chart = new Chart(ctx).Doughnut(data, this.doughnutOptions);
  },

  renderDevice: function() {
    var el = this.$el.find('#model');
    var data = this.collection.byDevice();
    var ctx = el.get(0).getContext("2d");
    var chart = new Chart(ctx).Doughnut(data, this.doughnutOptions);
  }
});

var AboutView = Backbone.View.extend({
  template: "#about-template",

  render: function() {
    var self = this;
    var content = $(this.template).html();
    $(this.el).html(content);
  }
});

var HelpView = Backbone.View.extend({
  template: "#help-template",

  render: function() {
    var self = this;
    var content = $(this.template).html();
    $(this.el).html(content);
  }
});