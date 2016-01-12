var USER_ICON_URL = 'img/currentlocation.png';
var EVENT_ICON_URL = 'img/flag.png';
var DEFAULT_POSITION = [ 37.784, -122.409 ]; // Hack Reactor

homeModule.controller('HomeController', function($scope, Map, Directions, Markers, HTTP, User, DummyData, DateFormat) {
  $scope.map; // google map object

  $scope.initMap = function(callback) {
    $scope.loading = true; // boolean to determine whether to display loading gif
    
    // Optional preliminary step for production
    // Render last location saved on the computer, to minimize lag on page
    $scope.position = Map.getLocalPosition();
    $scope.loading = false;
    $scope.map = Map.render($scope.position);
    callback();

    // Uncomment the below code for production
    // Render the actual location, once it is found
    // Map.getRealLocation(function(position) {
    //   Map.setLocalPosition(position);
    //   $scope.position = position;
    //   $scope.$apply(function() {
    //     // $apply notifies angular to watch changes and re-evaluate ng-if/show expressions
    //     $scope.loading = false;
    //   });
    //   $scope.map = Map.render(position);
    //   callback();
    // });
  };

  $scope.initRoutes = function() {
    // Sets visibility of directions box (should likely be renamed for clarity)
    $scope.boxAppear = false;

    var displayRouteHandler = function() {
      $scope.$apply(function() {
        $scope.boxAppear = true;
      });
      Directions.displayRoute($scope.map);
    }

    // Register event listeners to display route whenever endpoints change
    document.getElementById('start').addEventListener('change', displayRouteHandler);
    document.getElementById('end').addEventListener('change', displayRouteHandler);
  };

  $scope.initMarkers = function() {
    $scope.allEvents = []; // not being utilized yet
    $scope.markers = [];

    // Add marker for user
    Markers.addUserMarker($scope.map, Map.getLocalPosition());
    
    // Seeds events with dummy data and adds corresponding markers
    // This should be deleted for production
    $scope.allEvents = DummyData;
    _.forEach($scope.allEvents, function(event) {
      var marker = Markers.addEventMarker($scope.map, event);
      $scope.markers.push(marker);
    });
  };

  // Triggers click on marker from click on event in feed
  $scope.callMarker = function($index){
    var marker = $scope.markers[$index];
    Markers.triggerClick(marker);
  };

  // Clears all markers from map - only used for testing purposes now
  // Eventually may be utilized for removing expired events
  $scope.clearMarkers = function() {
    _.forEach($scope.markers, function(marker) {
      Markers.removeFromMap(marker);
    });
  };

  // Gets the events from the server
  $scope.getEvents = function(callback){
    HTTP.sendRequest('GET', '/events')
    .then(function(response) {
      var events = response.data;

      // Performs client-side filtering for events a user should see
      // (i.e. public events, user's own events, and friend's events)
      events = _.filter(events, function(event) {
        return event.isPublic ||
               event.userId === User.getId() ||
               _.pluck($scope.friends, '_id').indexOf(event.userId) !== -1;
      });

      callback(events);
    });
  };

  // Updates $scope.allEvents with new events and adds markers accordingly
  // Currently never removes events, even if inactive
  $scope.updateEvents = function(events) {
    _.forEach(events, function(event) {
      if (_.pluck($scope.allEvents, '_id').indexOf(event._id) === -1) {
        $scope.allEvents.push(event);
        console.log('got new event from server:', event);

        //add marker for event
        var marker = Markers.addEventMarker($scope.map, event);
        $scope.markers.push(marker);
      }
    });
  };

  $scope.prettifyDate = DateFormat.prettifyDate;

  // Get user's friends, to be able to filter events
  // Assumes friends do not change during their visit to the page
  User.getFriends()
  .then(function(response) {
    $scope.friends = response.data;
    $scope.initMap(function() { //finishes asynchronously
      $scope.initRoutes();
      $scope.initMarkers();
      setInterval(function(){
        $scope.getEvents(function(events) {
          $scope.updateEvents(events);
        });
      }, 1000);
    });
  });
})
.factory('DummyData', function() {
  return [
    {
      id: 1,
      userName: "Greg Domorski",
      title: "Really bored",
      description: "I'm at Starbucks Bros!",
      endedAt: '2016-12-31T04:00:00.000Z',
      location: { coordinates: [ -122.401268, 37.793686 ] },
      isPublic: true
    },
    {
      id: 2,
      userName: "Max O'Connell",
      title: "Come hang out with me",
      description: "I'm at SF GreenSpace HACKING! YEAH HACK REACTOR",
      endedAt: '2016-12-31T06:00:00.000Z',
      location: { coordinates: [ -122.400831, 37.786710 ] },
      isPublic: true
    },
    {
      id: 3,
      userName: "Gloria Ma",
      title: "I'm going to the club!",
      description: "I'm  hanging out at the Hyatt!! Come join me",
      endedAt: '2016-12-31T04:00:00.000Z',
      location: { coordinates: [ -122.39573, 37.794301 ] },
      isPublic: true
    },
    {
      id: 4,
      userName: "Rachel RoseFigura",
      title: "Anyone want to get coffee!",
      description: "I'm at Starbucks Bros!",
      endedAt: '2016-12-31T04:00:00.000Z',
      location: { coordinates: [ -122.406435, 37.784118 ] },
      isPublic: true
    },    
    ];
});

