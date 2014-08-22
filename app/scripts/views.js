var TestResultsView = Backbone.View.extend({
  template: "#results-template",

  events: {
    'click .devices-view-btn': 'renderDevicesView',
    'click .tests-view-btn': 'renderTestsView'
  },

  renderDevicesView: function(){
    window.router.navigate('results/devicesView', {trigger: true});
  },

  renderTestsView: function(){
     window.router.navigate('results/testsView', {trigger: true});
  },

  getDevicesViewTableData: function(){
    var self = this;
    return {
      data: self.collection.toJSON(),
      paging: true,
      pageLength: 10,
      order: [6, 'desc'],
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
                order: 0
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
    };
  },

  getTestsViewTableData: function(){
    var self = this;
    var data = this.collection.failedSpecsDetails();
    return {
      data: data,
      paging: true,
      pageLength: 10,
      order: [2, 'desc'],
      "sDom": '<"top">rt<"bottom"lp><"clear">',
      columns:[
        {
          title: 'Spec Name',
          data: 'specName',
          width: '55%'
        },
        {
          title: 'Failures',
          data: 'failureCount',
          width: '5%'
        },
        {
          title: 'Last Failure',
          type: 'num',
          width: '15%',
          data: function(row, type){
            if(type === 'display'){
              return moment(row.lastFail).fromNow();
            }
            return row.lastFail;
          }
        },
        {
          title: 'Devices',
          data: function(row, type){
            var devices = _.map(row.devices, function(device){
              return [device.platform, device.version, '(' + device.cordova + ')'].join(' ');
            });
            return devices.join(',');
          }
        }
      ]
    }
  },

  render: function(viewType) {
    var self = this;

    var content = $(this.template).html();
    $(this.el).html(content);

    var viewBtn = '.devices-view-btn';
    var tableData = this.getDevicesViewTableData();
    if(viewType === 'testsView'){
      viewBtn = '.tests-view-btn';
      tableData = this.getTestsViewTableData();
    }

    $(this.el).find('.meta .btn-group .active').removeClass('active');
    $(this.el).find(viewBtn).addClass('active');

    var tableEl = self.$el.find('table');
    var table = tableEl.DataTable(tableData);

    // Custom search
    $('input.search').unbind().on('keyup', function(e) {
      var search = $(e.currentTarget).val();
      table.search(search).draw();
    });

    tableEl.find('tbody').on('click', 'tr', function(){
      var rowData = table.row(this).data();
      if(viewType === 'testsView'){
        window.router.navigate('spec/' + rowData.id, {trigger: true});
      } else {
        window.router.navigate('result/' + rowData.reporterId, {trigger: true});
      }
    });
  }
});

var ResultDetailView = Backbone.View.extend({
  template: '#result-detail-template',

  events: {
    'click .specs-counters': 'filterSpecs'
  },

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
    var summaryData = {summary_data: this.getSpecsData(), device: this.model.get('deviceInfo'), duration: duration};
    var html = $(this.template).html();
    var template = Handlebars.compile(html);
    $(this.el).html(template(summaryData));
    this.renderSuites();
  },

  renderSuites: function(type){
    var self = this;
    var specsData = this.model.specsData(type);
    //this is not good, but how to do this in handlebar?
    var html = ['<ul class="timeline">'];
    _.each(specsData, function(data, index){
      self.renderSuitesView(data, html, type);
    });
    html.push('</ul>');
    $(this.el).find('.result-detail-timeline').html(html.join(''));
  },

  renderSuitesView: function(data, html, type){
    var self = this;
    html.push('<li class="timeline-inverted">');
    var className = data.passed? 'success': 'danger';
    var iconClass = data.passed? 'fa-check': 'fa-times';
    html.push('<div class="timeline-badge ' +className+'">');
    html.push('<i class="fa '+iconClass+'"></i>');
    html.push('</div>');
    html.push('<div class="timeline-panel">');
    html.push('<div class="timeline-heading">');
    html.push('<h4 class="timeline-title">');
    html.push('<a data-toggle="collapse" href="#suite_'+data.id+'">');
    html.push(data.suite_name);
    html.push('</a>');
    html.push('</h4>');
    html.push('</div>');
    html.push('<div id="suite_'+data.id+'" class="panel-collaps collapse">');
    html.push('<div class="timeline-body">');
    if(data.specs){
      //html.push('<ul class="specs list-group">');
      _.each(data.specs, function(spec, index){
        if(typeof type === 'boolean'){
          if(type === spec.passed){
            self.renderSpecView(spec, html);
          }
        } else {
          self.renderSpecView(spec, html);
        }
        
      });
      //html.push('</ul>');
    }
    if(data.children){
      html.push('<ul class="timeline">')
      _.each(data.children, function(childSuite, index){
        self.renderSuitesView(childSuite, html, type);
      });
      html.push('</ul>');
    }
    html.push('</div>');
    html.push('</div>');
    html.push('</div>');
    html.push('</li>');
  },

  renderSpecView: function(spec, html){
    var className = spec.passed? 'panel-success':'panel-danger';
    var iconClass = spec.passed? 'fa-check': 'fa-times';
    html.push('<div class="panel '+className+'">');
    html.push('<div class="panel-heading">');  
    html.push('<i class="fa '+iconClass+'"></i> ');
    html.push(spec.desc);
    html.push('</div>');
    if(!spec.passed){
      html.push('<div class="panel-body">');
      _.each(spec.resultData || spec.results, function(result, index){
        if(result){
          html.push('<p>');
          var st = result.stackTrace? result.stackTrace.replace(/\n/g, '<br/>') : (result.message? result.message : 'N/A');
          html.push(st);
          html.push('</p>');
        }
      });
      html.push('</div>');
    }
    html.push('</div>');
  },

  filterSpecs: function(event){
    var target = $(event.currentTarget);
    var filterType = null;
    if(target.hasClass('success')){
      filterType = true;
    }
    if(target.hasClass(('danger'))){
      filterType = false;
    }
    this.renderSuites(filterType);
  }
});

var SpecDetailView = Backbone.View.extend({
  template: "#spec-detail-template",

  render: function(specDetail){
    var self = this;
    var html = $(this.template).html();

    Handlebars.registerHelper('fromNow', function(ts){
      return moment(ts).fromNow();
    });

    var template = Handlebars.compile(html);
    $(this.el).html(template(specDetail));
  }
});


var TestChartsView = Backbone.View.extend({
  template: "#charts-template",
  platforms: [],

  render: function() {
    var self = this;
    var html = $(this.template).html();
    var template = Handlebars.compile(html);
    self.platforms = self.collection.getPlatforms();
    $(this.el).html(template({platforms: self.platforms}));
    this.renderOS();
    this.renderCordova();
    this.renderDevice();
    _.each(self.platforms, function(pl){
      self.renderFailure(pl);
    });
  },

  renderOS: function() {
    var el = this.$el.find('#os');
    var data = this.collection.byOS();
    var ctx = el.get(0).getContext("2d");
    var chart = new Chart(ctx).Doughnut(data);
  },

  renderCordova: function() {
    var el = this.$el.find('#cordova_version');
    var data = this.collection.byCordova();
    var ctx = el.get(0).getContext("2d");
    var chart = new Chart(ctx).Doughnut(data);
  },

  renderDevice: function() {
    var el = this.$el.find('#model');
    var data = this.collection.byDevice();
    var ctx = el.get(0).getContext("2d");
    var chart = new Chart(ctx).Doughnut(data);
  },

  renderFailure: function(pl){
    var el = this.$el.find('#failures_' + pl);
    var data = this.collection.failureData(pl);
    var ctx = el.get(0).getContext('2d');
    var chart = new Chart(ctx).Bar(data, {});
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