var Model = {
  center: {lat: 37.770172, lng: -122.449820},
  location: {lat: 37.770172, lng: -122.449820},
  places: [],
  mapZoom: 14,
  mapStyles: [],
  map: null,
  markerPin: null,
  currentInfoWindow: null,
  activeMarker: null,
  itemsShown: true
};

var ViewModel = function() {
  var self = this;
  self.listLocations = ko.observableArray(Model.places.slice());
  self.itemsShown = ko.observable(Model.itemsShown);
  self.itemsAvailable = ko.computed(function(){
    return self.listLocations().length === 0;
  });
  self.toggleItems = function() {
    var shown = self.itemsShown();
    self.itemsShown(!shown);
  };
  self.recenterMap = function() {
    if(Model.map !== null) {
      Model.map.setZoom(Model.mapZoom);
      Model.map.panTo(Model.location);
      if(Model.activeMarker !== null) {
        Model.activeMarker.setAnimation(null);
      }
      if(Model.currentInfoWindow !== null) {
        Model.currentInfoWindow.close();
      }
    }
  };
  self.filter = ko.pureComputed({
    read: function() {
      return "";
    },
    write: function(value) {
      var list;
      for(var i = 0; i < Model.places.length; i++) {
        Model.places[i].marker.setVisible(false);
      }
      if(value === ""){
        self.listLocations.removeAll();
        list = Model.places;
        for(i = 0; i < list.length; i++) {
          self.listLocations.push(list[i]);
          list[i].marker.setVisible(true);
        }
      }
      else {
        value = value.toLowerCase();
        self.listLocations.removeAll();
        list = Model.places;
        for(i = 0; i < list.length; i++) {
          if(list[i].title.toLowerCase().indexOf(value) !== -1) {
            self.listLocations.push(list[i]);
            list[i].marker.setVisible(true);
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
          alert("Error loading styles!\nPlease retry..");
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
    var page = new WikiPage(data.query.geosearch[i], i*10);
    Model.places.push(page);
  }
  Model.map = new google.maps.Map(document.getElementById('map'), {
    center: Model.center,
    zoom: Model.mapZoom,
    styles: Model.mapStyles,
    scrollwheel: false,
    zoomControl: false,
    streetViewControl: false,
    navigationControl: false,
    mapTypeControl: false,
    draggable: false,
  });
  Model.markerPin = {
    url: '/static/imgs/pin.png',
    scaledSize: new google.maps.Size(24, 24)
  };
  var sideBar = document.getElementById("sidebar");
  Model.map.controls[google.maps.ControlPosition.TOP_LEFT].push(sideBar);
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

var WikiPage = function(data, timeout) {
  var self = this;
  this.title = data.title;
  this.latLng = {'lat': data.lat, 'lng': data.lon};
  this.page = "https://en.wikipedia.org/?" + $.param({'curid': data.pageid});
  this.distance = (data.dist * 0.000621371).toFixed(1) + " mi";
  this.marker = null;
  this.infowindow = new google.maps.InfoWindow({
    content: "<h4>" + this.title + "</h3>" +
             "<a href='" + this.page + "' target='_blank'>"  +
             "<input type='button' value='SHOW ON WIKIPEDIA' class='buttonFlat googleButton'/></a>"
  });
  setTimeout(function(){
    self.marker = new google.maps.Marker({
      map: Model.map,
      icon: Model.markerPin,
      position: self.latLng,
      animation: google.maps.Animation.DROP,
      title: self.title
    });
    google.maps.event.addListener(self.marker, 'mousedown', function(self){
      return function() {
        return focusLocation(self);
      };
    }(self));
  }, timeout);
  this.wiggle = function() {
    return focusLocation(self);
  };
};

function focusLocation(self) {
  Model.map.panTo(self.latLng);
  openInfoWindow(self);
  return wiggle(self);
}

function wiggle(self) {
  if(Model.activeMarker !== null) {
    Model.activeMarker.setAnimation(null);
  }
  if(self.marker.getAnimation() !== null) {
    self.marker.setAnimation(null);
  }
  self.marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(function() {
    self.marker.setAnimation(null);
  }, 2800);
  return true;
}

function openInfoWindow(self) {
  if(Model.currentInfoWindow !== null) {
    Model.currentInfoWindow.close();
  }
  Model.currentInfoWindow = self.infowindow;
  Model.currentInfoWindow.open(Model.map, self.marker);
}

function mapError() {
  window.alert("Failed to load Google Maps API");
}
