var TestResultsView = Backbone.View.extend({
  template: "#results-template",

  render: function() {
    var self = this;
    console.log(this.collection.toJSON());

    var content = $(this.template).html();
    $(this.el).html(content);

    var tableEl = self.$el.find('table');
    var table = tableEl.DataTable({
      data: self.collection.toJSON(),
      paging: true,
      pageLength: 10,
      order: [5, 'desc'],
      "sDom": '<"top">rt<"bottom"lp><"clear">',
      columns: [
      {
        data: 'reporterId',
        visible: false
      },
      {
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
        type: 'num',
        data: function(row, type) {
          if(type === 'display'){
            if(!row.ts_text){
              var testInfo = row.testInfo;
              var started = _.findWhere(testInfo, {
                stage: 'runner_starting'
              });
              var ts = started.ts;
              row.ts = ts;
              row.ts_text = moment(ts).fromNow();
            }
            return row.ts_text;
          }

          return row.ts;
        }
      }, {
        title: 'Test Results (Failed/Total)',
        data: function(row, type, set, meta) {
          var result = new TestResult(row);
          return result.specsSummary();
        }
      }]
    });

    // Custom search
    $('input.search').on('keyup', function(e) {
      var search = $(e.currentTarget).val();
      table.search(search).draw();
    });

    tableEl.find('tbody').on('click', 'tr', function(){
      var rowData = table.row(this).data();
      window.router.navigate('result/' + rowData.reporterId, {trigger: true});
    });
  }
});

var ResultDetailView = Backbone.View.extend({
  template: '#result-detail-template',

  getSpecsData: function(){
    var totalSpecs = this.model.totalSpecs();
    var passedSpecs = this.model.passedSpecs();
    var failedSpecs = this.model.failedSpecs();
    var skippedSpecs = this.model.skippedSpecs();

    return [
      {type: 'info', title: 'Total', content: totalSpecs},
      {type: 'success', title: 'Passed', content: passedSpecs},
      {type: 'danger', title: 'Failed', content: failedSpecs},
      {type: 'default', title: 'Skipped', content: skippedSpecs}
    ]
  },

  render: function(){
    var duration = Math.ceil(moment.duration(this.model.totalTime()).asSeconds());
    var summaryData = {summary_data: this.getSpecsData(), device: this.model.get('deviceInfo'), duration: duration, spec_suites: this.model.specsData()};
    var html = $(this.template).html();
    var template = Handlebars.compile(html);
    $(this.el).html(template(summaryData));
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