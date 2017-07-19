var Model = {
  location: {lat: 37.77493, lng: -122.419416},
  places: [],
  mapZoom: 14,
  mapStyles: [],
  map: null
};

var ViewModel = function() {
  var self = this;
  self.listLocations = ko.observableArray(Model.places.slice());
  self.filter = ko.pureComputed({
    read: function() {
      return "";
    },
    write: function(value) {
      if(value === ""){
        self.listLocations.removeAll();
        var list = Model.places;
        for(var i = 0; i < list.length; i++) {
          self.listLocations.push(list[i]);
        }
      }
      else {
        value = value.toLowerCase();
        self.listLocations.removeAll();
        var list = Model.places;
        for(var i = 0; i < list.length; i++) {
          if(list[i].title.toLowerCase().indexOf(value) !== -1) {
            self.listLocations.push(list[i]);
          }
        }
      }
    },
    owner: self
  });
};

function initMap() {
  $.ajax({
    url: apiStr(Model.location.lat,Model.location.lng),
    dataType: 'jsonp',
    jsonp: 'callback',
    success: function(data) {
      $.ajax({
        url: '/static/js/mapstyle.json',
        dataType: 'json',
        success: function(style) {
          Model.mapStyles = style;
          loadSanFranciscoMap(data);
          ko.applyBindings(ViewModel);
        },
        error: function(xhr, status, errorThrown) {
          alert("Error loading styles!\nPlease retry..")
        }
      });
    },
    error: function (xhr, status, errorThrown) {
      alert("ERROR IN RETRIEVING WIKIPEDIA DATA!\nError Code - " + xhr.status + ": \n" + xhr.responseText);
    }
  });
}

function loadSanFranciscoMap(data) {
  var n = data.query.geosearch.length;
  for(var i = 0; i < n; i++) {
    var page = new WikiPage(data.query.geosearch[i]);
    Model.places.push(page);
  }
  Model.map = new google.maps.Map(document.getElementById('map'), {
    center: Model.location,
    zoom: Model.mapZoom,
    styles: Model.mapStyles,
    scrollwheel: false,
    zoomControl: false,
    streetViewControl: false,
    navigationControl: false,
    mapTypeControl: false,
    draggable: false,
  });
}

var apiStr = function(lat, lng) {
  var wikiapistring = "https://en.wikipedia.org/w/api.php";
  wikiapistring += "?" + $.param({
  	"action": "query",
  	"format": "json",
  	"list": "geosearch",
  	"gscoord": lat+"|"+lng,
  	"gsradius": "5000",
  	"gslimit": "500"
  });
  return wikiapistring;
};

var WikiPage = function(data) {
  var self = this;
  this.title = data.title;
  this.latLng = {'lat': data.lat, 'lng': data.lon};
  this.page = "https://en.wikipedia.org/?" + $.param({'curid': data.pageid});
  this.distance = (data.dist * 0.000621371).toFixed(1) + " mi";
  this.marker = null;
  this.wiggle = null;
};
