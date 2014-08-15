var initcalled = false;
$(document).ready(function(){
  $('.spinner').spin();
  $fh.on('fhinit', function(err, cloud){
    initcalled = true;
    if(err){
      showErrorPanel('FH SDK failed to init. Something is wrong...');
    } else {
      loadApp();
    }
  });
  setTimeout(function(){
    if(!initcalled){
      showErrorPanel('FH SDK failed to init in 5 seconds. You should find out why...');
    }
  }, 5000);
});

function showErrorPanel(text){
  var p = $('<div>').addClass('panel panel-danger').append($('<div>').addClass('panel-heading').text('Error')).append($('<div>').addClass('panel-body').text(text));
  $('.results').empty().append(p);
}

function loadApp(){
  $fh.cloud({
    path: '/recordTest',
    method: 'get',
    contentType: 'application/json'
  }, function(res){
    $('.spinner').remove();
    var resultsCollection = new TestResults(res);
    var resultsView = new TestResultsView({
      collection: resultsCollection,
      el: $('.results')[0]
    });
    resultsView.render();
  }, function(err){
    showErrorPanel('Failed to load test results. You should find out why. Error : ' + err);
  });
}