var initcalled = false;
$(document).ready(function() {
  $('.spinner').spin();
  $fh.on('fhinit', function(err, cloud) {
    initcalled = true;
    if (err) {
      showErrorPanel('FH SDK failed to init. Something is wrong...');
    } else {
      loadApp();
    }
  });
  setTimeout(function() {
    if (!initcalled) {
      showErrorPanel('FH SDK failed to init in 5 seconds. You should find out why...');
    }
  }, 5000);
});

function showErrorPanel(text) {
  var p = $('<div>').addClass('panel panel-danger').append($('<div>').addClass('panel-heading').text('Error')).append($('<div>').addClass('panel-body').text(text));
  $('.results').empty().append(p);
}

function loadApp() {
  $fh.cloud({
    path: '/recordTest',
    method: 'get',
    contentType: 'application/json'
  }, function(res) {
    $('.spinner').remove();
    var resultsCollection = new TestResults(res);
    var el = $('.content')[0];

    // Sidebar utils
    var Sidebar = {
      removeActive: function() {
        $('.sidebar-nav li').removeClass('active');
      },
      makeActive: function(link) {
        this.removeActive();
        $('.sidebar-nav a[href=' + link + ']').find('li').addClass('active');
      }
    };

    var Router = Backbone.Router.extend({
      routes: {
        "about": "about",
        "help": "help",
        "results": "results",
        "result/:reportId": "result",
        "charts": "charts",
        '*path': 'default'
      },

      help: function() {
        var view = new HelpView({
          collection: resultsCollection,
          el: el
        });
        view.render();
        Sidebar.makeActive('#help');
      },

      about: function() {
        var view = new AboutView({
          collection: resultsCollection,
          el: el
        });
        view.render();
        Sidebar.makeActive('#about');
      },

      charts: function() {
        var view = new TestChartsView({
          collection: resultsCollection,
          el: el
        });
        view.render();
        Sidebar.makeActive('#charts');
      },

      results: function() {
        var view = new TestResultsView({
          collection: resultsCollection,
          el: el
        });
        view.render();
        Sidebar.makeActive('#results');
      },

      result: function(reportId){
        var resultModel = resultsCollection.get(reportId);
        console.log(resultModel);
        var view = new ResultDetailView({
          model: resultModel,
          el: el
        });
        view.render();
        Sidebar.makeActive('#results');
      },

      default: function() {
        this.navigate("results", {
          trigger: true
        })
      }
    });

    var router = new Router();
    Backbone.history.start();
    window.router = router;
  }, function(err) {
    showErrorPanel('Failed to load test results. You should find out why. Error : ' + err);
  });
}