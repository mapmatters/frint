mapboxgl.accessToken =
  'pk.eyJ1IjoibWFwbWF0dGVycyIsImEiOiJjamc0Y2p1OWwxNWN6MnBzMTJ6czRrZnY1In0.Beyp8DKNzxakGHxuSIgNfA';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapmatters/ckc0bvrdw2oxt1jpmr45jt90g',
  center: [127.4755, 37.5185],
  zoom: 9,
  scrollZoom: true,
  maxZoom: 15,
  minZoom: 7
});

map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    fitBoundsOptions: {
      maxZoom: 12
    },
    trackUserLocation: true,
    showAccuracyCircle: false
  })
  );
  
map.addControl(new mapboxgl.NavigationControl());
// Holds visible airport features for filtering
var campingsites = [];
var hoveredStateId = null;

// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
  closeButton: false
});

var span = document.getElementsByClassName("close")[0];

var filterEl = document.getElementById('feature-filter');
var listingEl = document.getElementById('feature-listing');

function imgClick(img) {
  img.style.border = '5px solid pink';
}

function renderListings(features) {
  var empty = document.createElement('p');
  // Clear any existing listings
  listingEl.innerHTML = '';
  if (features.length) {
    features.forEach(function (feature) {
      var prop = feature.properties;
      var item = document.createElement('a');
      var img = document.createElement('img');
      item.textContent = prop.name + ' '
      item.style = "text-decoration:none;";
      img.href = "https://www.instagram.com/explore/tags/" + prop.hashtag;
      item.addEventListener('mouseover', function () {
        // Highlight corresponding feature on the map
        popup
          .setLngLat(feature.geometry.coordinates)
          .setText(
            feature.properties.name +
            ' (' +
            feature.properties.addr +
            ')'
          )
          .addTo(map);
      });
      img.addEventListener('click', function () {
        var win = window.open(this.href, 'bar');
        win.focus();
      });
      img.style = "width:24px;height:24px;"
      img.target = 'bar';
      img.setAttribute('src', "img/instagram.png");
      img.setAttribute("onclick", "imgClick(href)");
      listingEl.appendChild(item).appendChild(img);
    });

    // Show the filter input
    filterEl.parentNode.style.display = 'block';
  } else if (features.length === 0 && filterEl.value !== '') {
    empty.textContent = 'No results found';
    listingEl.appendChild(empty);
  } else {
    empty.textContent = 'Drag the map to populate results';
    listingEl.appendChild(empty);

    // Hide the filter input
    filterEl.parentNode.style.display = 'none';

    // remove features filter
    map.setFilter('camping', ['has', 'name']);
  }
}

function normalize(string) {
  return string.trim().toLowerCase();
}

function getUniqueFeatures(array, comparatorProperty) {
  var existingFeatureKeys = {};
  // Because features come from tiled vector data, feature geometries may be split
  // or duplicated across tile boundaries and, as a result, features may appear
  // multiple times in query results.
  var uniqueFeatures = array.filter(function (el) {
    if (existingFeatureKeys[el.properties[comparatorProperty]]) {
      return false;
    } else {
      existingFeatureKeys[el.properties[comparatorProperty]] = true;
      return true;
    }
  });

  return uniqueFeatures;
}


map.on('load', function () {
  map.addSource('campingsites', {
    'type': 'vector',
    'url': 'mapbox://mapmatters.9ilda2dr',
    'cluster': true,
    // 'clusterRadius': 80
    clusterMaxZoom: 14, // Max zoom to cluster points on
    clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
  });


  // ponit layer
  map.addLayer({
        'id': 'camping-icon',
        'source': 'campingsites',
        'source-layer': 'camp_geo-1m11gy',
        'type': 'symbol',
        'layout': {},
        'paint': {
          'fill-color': '#627BC1',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0.5
          ]
        }
      // 'layout': {
      //     'icon-image': 'mountain-15',
      //     'icon-padding': 0,
      //     'icon-size': ['case',['boolean', ['camping-sites', 'hover'], false],10,5],
      //     // 'icon-size': 1.5,
      //     'icon-allow-overlap': true
      // }
  });

  map.addLayer({
    'id': 'camping',
    'type': 'circle',
    'source': 'campingsites',
    'source-layer': 'camp_geo-1m11gy',
    'paint': {
      'circle-radius': ['/',['sqrt',['+', 50, ['number', ['get', 'posts']]]],2],
      "circle-stroke-width": 0.9,
      "circle-stroke-color": '#74A7E1',
      'circle-stroke-opacity': 0.7,
      'circle-opacity': 0.6,
      'circle-color': '#09BFF9'
    }
  });
       

  // // Layer with just labels that are only visible from a certain zoom level
  map.addLayer({
    "id": "camping-label",
    "type": "symbol",
    "source": "campingsites",
    'source-layer': 'camp_geo-1m11gy',
    "minzoom": 10, // Set zoom level to whatever suits your needs
    'layout': {
      'text-field': ['get', 'name'],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-radial-offset': 0.5,
      'text-font': ['Noto Sans CJK JP Regular'],
      // 'text-color': '#48567A',
      "text-size": [
        "interpolate",
        ["linear"],
        ["zoom"],
        7,
        8,
        22,
        26
      ],
      'text-justify': 'auto'
    },
    "paint": {
      "text-color": "#044B9C",
      "text-halo-color": "#fff",
      "text-halo-width": 1
    },
  });

  map.on('click', 'camping', function (e) {
    var feature = e.features[0];
    var coordinates = feature.geometry.coordinates
    var description = //'<div class="popup">' +
    // "<span class='close' onclick='document.getElementById('popup').innerHTML = '''>&times;</a>" +
    '<h3>' + feature.properties.name + '</h3>' +
      '<a style="text-decoration:none;" href=" ' + 
        " https://www.instagram.com/explore/tags/" + feature.properties.hashtag + ' " target="bar"> ' +
        '<img class="middle" src="img/instagram.png" alt="hashtag" style="width:24px;height:24px;">' + ' </a>' +
      ' #' + feature.properties.hashtag + ' ' + feature.properties.posts + ' posts' + 
        // '<br>' +
        // '<a style="text-decoration:none;" href=" ' +
      // "https://www.youtube.com/results?search_query=" + feature.properties.hashtag + ' " target="bar">' +
      //   '<img src="img/youtube.png" alt="youtube" style="width:24px;height:24px;">' + ' </a>' +
      '<br>' + feature.properties.addr + '<br>' + feature.properties.call_num + '<br>' + '</div>'
    map.flyTo({ center: coordinates });
    document.getElementById("popup").innerHTML = description;
  });

  map.on('mousemove', 'camping-icon', function (e) {
    if (e.features.length > 0) {
      if (hoveredStateId) {
        map.setFeatureState({
          source: 'campingsites',
          id: hoveredStateId
        }, {
          hover: false
        });
      }
      hoveredStateId = e.features[0].id;
      map.setFeatureState({
        source: 'campingsites',
        id: hoveredStateId
      }, {
        hover: true
      });
    }
  });

  map.on('dragend', function () {
    document.getElementById("popup").innerHTML = "";
  });

  map.on('mouseenter', 'camping', function () {
    map.getCanvas().style.cursor = 'pointer';
  });

  // map.on('mouseleave', 'camping', function () {
  //   map.getCanvas().style.cursor = '';
  //   popup.remove();
  // });

  map.on('mouseleave', 'camping-icon', function () {
    if (hoveredStateId) {
      map.setFeatureState({
        source: 'campingsites',
        id: hoveredStateId
      }, {
        hover: false
      });
    }
    hoveredStateId = null;
  });

});