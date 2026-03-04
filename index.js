var style331 = 'mapbox://styles/yunjieli/ciu7h63gy00052inrtutrxnfp';
var styleDark = 'mapbox://styles/mapbox/dark-v9';

// global constants, other candidates include , #9ee0f5
var colorStops = ['#f2f0f7','#cbc9e2','#9e9ac8','#756bb1','#54278f','#3f007d'];
var heightStop = 5000;
var colorActive = "#3cc";
var animationOptions = { duration: 5000, easing: .4 };
var typeList = ["combined", "AVG_YR_SCH", "INCOME"]; //IS FOR "TABS" BUT HAS TO BE COLUMN NAMES FOR NOW, SEE ACTIVETYPE VARIABLE BELOW FOR INFO

// for DDS threshholds, [total, density]
//"max" is for height AND colors! make a 2D array, one for education and one for income
//IN OUR TEST VERSION WE ARE USING DATA MAX VALUES OF EDUCATION AND INCOME COLUMNS FOR THE YEAR 2000 DATA!!!
//NOTE: VALUES MUST BE HERE AND MUST ALSO BE USED FOR ACTIVE TYPE AND ACTIVEDDS VARIABLES IN THE FOLLOWING LINES BELOW 
//OR THE POP UP WILL NOT WORK AND CAN'T SELECT A COUNTRY!!!
var max = {
    
    // "businesses": 46,
    // "combined": 283,
    // "noise": 278,
    // "establishment": 60,
    // "poisoning": 15,
    // "drinking": 8,
    // "smoking": 10,
    // "others": 9,
    // "totalDensity": 141.5,
    // "noiseDensity": 139,
    // "establishmentDensity": 20,
    // "poisoningDensity": 8,
    // "drinkingDensity": 5,
    // "smokingDensity": 10,
    // "othersDensity": 1.3,

    //NOTE: DON'T CHANGE OR MESS WITH THIS, WILL MAKE DATA NOT SHOW IF MESSING WITH THIS!
    "education": 12.96,
    "income": 37783.6626711242
};
//IS USED FOR THE ORGINAL LEGEND: var percentiles = {"combined":[1,1,3,5,14],"education":[1,1,3,6,20],"income":[1,1,2,3,6]};
var empty = {
    "type": "FeatureCollection",
    "features": []
};

var gridActive = {
    "type": "FeatureCollection",
    "features": []
};
var pointActive = {
    "type": "FeatureCollection",
    "features": []
};
var previousCamera = {
    speed: 0.3
};

// active filter for each of the filter session
var activeCamera = "hexbin";
var activeType = "INCOME"; //THIS HAS TO BE ONE OF THE "COLUMN VALUE NAMES" IN THE DATASET! IN THIS CASE WE ARE USING INCOME
//var activeType = "./grids.geojson";

// result data field of camera, type, method combined
//NOTE: DDS = active category aka map name, such as combined, education, or income
var activeDDS = "income"; //is grabbing "income" which was called "total" in the original dictionary called "max", see variable above
var maxColor = max[activeDDS];
var maxHeight = max[activeDDS];

//FUNCTION  BELOW IS NOT USED!
// preprocessing data
// function calculateDensity () {
//   gridsRaw.features.forEach(function(grid) {
//       // calclulate density
//       typeList.forEach(function(type) {
//           //in case businesses == 0
//           var density;

//           if (grid.properties.businesses > 0) {
//               density = grid.properties[type] / grid.properties.businesses;
//               // keep 1 decimal
//               density = Math.round(density * 10) / 10;
//           } else {
//               density = "";
//           };
//           grid.properties[type + "Density"] = density;
//       });
//   });
// };

//FUNCTION BELOW IS NOT USED!
// function calculatePercentiles () {
//   percentiles = {};
//   typeList.forEach(function(type) {
//     var featureList = gridsRaw.features.filter(function(feature) {
//       return feature.properties[type] > 0;
//     });
//     fullList = featureList.map(function(feature) {
//       return feature.properties[type];
//     });
//     var breakpoints = [10, 20, 40, 60, 80];
//     percentiles[type] = breakpoints.map(function(breakpoint) {
//       return parseInt( findPercentile(fullList, breakpoint) );
//     });
//     console.log(type, fullList.length, typeof(fullList[0]));

//     function findPercentile( array, percentile ) {
//       fullList.sort(function(a,b) {return a - b;});
//       var index = percentile / 100 * (array.length - 1);
//       return array[Math.round(index)];
//     };
//   });
//   console.log(percentiles);
// };

var grids = gridsRaw;

mapboxgl.accessToken = 'pk.eyJ1IjoieXVuamllbGkiLCJhIjoiY2lxdmV5MG5rMDAxNmZta3FlNGhyMmpicSJ9.CTEQgAyZGROcpJouZuzJyA';
var map = new mapboxgl.Map({
    container: 'map', // container ID
    style: style331, // style URL
    zoom: 1.2, // starting zoom
    minZoom: 1,
    center: [0, 20] // starting center
});



// declare the coordinated chart as well as other variables.
// let chart = null;
//     activeLayer = "income";
//     worldData = null;

// create a few constant variables.
const incomeBreaks = [0, 2000, 5000, 10000, 20000, 40000];
//const incomeColors = ['#f2f0f7','#cbc9e2','#9e9ac8','#756bb1','#54278f','#3f007d'];
//NOTE: WE ONLY NEED EDUCATION COLORING FOR COMBINED MAPS, SO COMMENTED OUT LINE ABOVE
const schoolingBreaks = [0, 3, 6, 9, 12];
const schoolingColors = ['#edf8fb','#b2e2e2','#66c2a4','#2ca25f','#006d2c'];

// create the legend object and anchor it to the html element with id legend.
const legend = document.getElementById('legend');

// disable scroll if it's embedded in a blog post
if (window.location.search.indexOf('embed') !== -1) {
    map.scrollZoom.disable();
};

map.on('load', function() {

    setLegend();

    map.addControl(new mapboxgl.NavigationControl({
        position: 'top-right'
    }));
    // addCustomControl();

    addLayers();

    // custom control in navigation control
    $("#control-pitch").click(function() {
        $(this).toggleClass('pitch');

        var pitch = $(this).hasClass('pitch') ? 60 : 0;
        map.setPitch(pitch);
    });

    map.on("zoom", function() {
        if (activeCamera !== "inspector") {
            var zoom = map.getZoom();
            activeCamera = zoom > 14 ? "dotted" : "hexbin";
            setLayers();
        };
    });

    // // reset height/color if toggle normalization
    // $("#density").click(function() {
    //     activeDDS = $(this).is(":checked") ? activeType + 'Density' : activeType;
    //     setDDS();
    // });

    // filter type
    $("#types .btn").click(function() {
        $("#types .btn").removeClass('active');

        if (this.id === activeType) {
            // click again to clear filter
            activeType = "combined";
        } else {
            activeType = this.id;
            $(this).addClass('active');
        };

        // for hexbin
        activeDDS = $("#density").is(":checked") ? activeType + "Density" : activeType;
        setDDS();

        // for dotted
        var filter = activeType === "combined" ? ["has", "Complaint Type"] : ["in", "Complaint Type"].concat(types[activeType]["values"]);
        map.setFilter("points-complaints", filter);
    });

    // Create a popup, but don't add it to the map yet.
    var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        anchor: 'top',
    });
    // tooltip
    map.on("mousemove", function(e) {
        var coordinates = [e.lngLat.lng, e.lngLat.lat];
        var html = "";
        map.on("zoom", function() {
            return;
        });
        if (activeCamera === "hexbin") {
            var query = map.queryRenderedFeatures(e.point, {
                layers: ["grids-3d"]
            });
            if (query.length) {
                gridActive.features = [query[0]];
                var numberComplaints = query[0].properties["AVG_YR_SCH"];
                //ORGINAL: var numberBusinesses = query[0].properties.businesses;
                var income_val = query[0].properties["INCOME"];
                var label = activeType.charAt(0).toUpperCase() + activeType.slice(1);
                html = "<div class='grid grid--gut6 color-white align-center'>" + "<div class='col--6'><div class='txt-xl txt-bold custom-ffc300'>" + numberComplaints + "</div><p class='mx3'>" + label + " Average Years of Schooling</p></div>" + "<div class='col--6'><div class='txt-xl txt-bold custom-ffc300'>" + income_val + "</div><p class='mx3'>Average Income in US Dollars</p></div>" + "<div class='col--12 color-gray mt12'></div></div>";
            };
            map.getSource('grid-active').setData(gridActive);
            // else: "dotted" or "inspector"
        } else {
            var queryComplaints = map.queryRenderedFeatures(e.point, {
                layers: ["points-complaints"]
            });
            if (queryComplaints.length) {
                var numberComplaints = queryComplaints.length;
                var labelComplaints = numberComplaints == 1 ? " complaint" : " complaints";
                var typeComplaints = activeType === 'combined' ? '' : ' about ' + activeType;
                html += "<div class='grid grid--gut6 color-white align-center'>"
                    + "<div class='col--12 px6'><div class='txt-xl txt-bold custom-ffc300'>" + numberComplaints
                    + "</div><p>" + labelComplaints + " from this address" + typeComplaints + "</p></div><div class='col--12 mx12 pl6 grid my12'>";

                if (activeType === 'combined') {
                    var typeCount = typeList.map(function(type) {
                        var count = 0;
                        // uppercase first letter of type
                        var type = type.charAt(0).toUpperCase() + type.slice(1);
                        queryComplaints.forEach(function(feature) {
                            if (feature.properties['Complaint Type'].includes(type)) {
                                count += 1;
                            }
                        });
                        return count;
                    });

                    for (var i = 1; i < typeList.length; i++) {
                        html += "<div class='col--4 " + typeList[i] + " grid pt6 color-gray-light'><div class='icon mx3'></div>" + typeCount[i] + "</div>";
                    }
                }
                html += "</div>";

                pointActive.features = queryComplaints;
                map.getSource('point-active').setData(pointActive);
            } else {
                map.getSource('point-active').setData(empty);
            };
        };

        if (html === "") {
            $('.mapboxgl-popup').css('opacity', 0);
            $(".mapboxgl-canvas-container").css("cursor", "-webkit-grab");
        } else {
            $(".mapboxgl-canvas-container").css("cursor", "none");
            popup.setLngLat(coordinates)
                .setHTML(html)
                .addTo(map);
            $('.mapboxgl-popup').css('opacity', 1);
        };
    });

    // drill down a hexbin /////TODO, CUT THIS, IS FOR ZOOM IN THING
    // map.on('click', function(e) {
    //     if (activeCamera === "hexbin") {
    //         var query = map.queryRenderedFeatures(e.point, {
    //             layers: ["grids-3d"]
    //         });
    //         // it's the same hexbin as the current highlight
    //         if (query.length && query[0].properties.id === gridActive.features[0].properties.id) {
    //             // UI changes
    //             $("#back").show();

    //             // prepare layers
    //             activeCamera = "inspector";
    //             setLayers();

    //             // Camera
    //             getCamera();
    //             var center = turf.center(gridActive);
    //             map.flyTo({
    //                 center: center.geometry.coordinates,
    //                 zoom: 15,
    //                 pitch: 0,
    //                 speed: .3
    //             });
    //         };
    //     };
    // });

    // resume to overview
    $("#back").click(function() {

        activeCamera = "hexbin";
        // exception: only for inspector > hexbin case
        map.setPaintProperty('grid-active', 'fill-extrusion-height', {
            property: activeDDS,
            stops: [
                [0, 0],
                [maxHeight, heightStop]
            ]
        });
        setLayers();

        map.flyTo(previousCamera, animationOptions);

        $(this).hide();
    });

    // mobile menu toggle
    $(".show-more").click(function() {
        $(".session").toggle();
        $("#title").show();
        $(".session.style").hide();
        $("#style-" + activeCamera).show();

        // toggle show-less and show-more
        $(".mobile-btn").toggle();

        $("#sidebar").css('height', '50vh');
        $("#map").css('height', 'calc(100% - 50vh');
        $("#map").css('top', '50vh');
    });
    $(".show-less").click(function() {
        $(".session").toggle();
        $("#title").show();
        $(".session.style").hide();

        // toggle show-less and show-more
        $(".mobile-btn").toggle();
        $("#sidebar").css('height', '30vh');
        $("#map").css('height', 'calc(100% - 30vh');
        $("#map").css('top', '30vh');
    });

    // note about legend
    $(".legend-note-icon").click( function() {
      $(".legend-note").toggleClass('none');
    });

    function addLayers() {

        map.addSource("grids", {
            "type": "geojson",
            "data": grids
        });
        // grid-3d
        map.addLayer({
            "id": "grids-3d",
            "type": "fill-extrusion",
            "source": "grids",
            "paint": {
                "fill-extrusion-color": {
                    property: activeDDS,
                    stops: [
                        [maxColor * .2, colorStops[2]],
                        [maxColor * .5, colorStops[3]],
                        [maxColor * .8, colorStops[4]],
                        [maxColor, colorStops[5]]
                    ]
                },
                "fill-extrusion-opacity": .6,
                "fill-extrusion-height": {
                    property: activeDDS,
                    stops: [
                        [0, 0],
                        [maxHeight, heightStop]
                    ]
                },
                "fill-extrusion-height-transition": {
                    duration: 2000
                },
                "fill-extrusion-color-transition": {
                    duration: 2000
                }
            },
            "filter": ["all", ["!=", activeDDS, 0],
                ["!=", "businesses", 0]
            ]
        }, "admin-2-boundaries-dispute");

        // subtle labels to show count by grid for 2D
        map.addLayer({
            "id": "grids-count",
            "type": "symbol",
            "source": "grids",
            "layout": {
                "text-field": "{" + activeDDS + "}",
                "text-size": 14
            },
            "paint": {
                "text-color": colorActive,
                "text-opacity": {
                    stops: [
                        [13, 0],
                        [14, .8]
                    ]
                },
                "text-halo-color": "#2d2d2d",
                "text-halo-width": 2,
                "text-halo-blur": 1
            }
        });

        map.addSource("grid-active", {
            "type": "geojson",
            "data": gridActive
        });
        map.addLayer({
            "id": "grid-active",
            "type": "fill-extrusion",
            "source": "grid-active",
            "paint": {
                "fill-extrusion-color": colorActive,
                "fill-extrusion-opacity": .6,
                "fill-extrusion-height": {
                    property: activeDDS,
                    stops: [
                        [0, 0],
                        [maxHeight, heightStop]
                    ]
                },
                "fill-extrusion-height-transition": {
                    duration: 1500
                },
                "fill-extrusion-color-transition": {
                    duration: 1500
                }
            }
        }, "admin-2-boundaries-dispute");

        // add businesses from tileset
        map.addSource("points-businesses", {
            "type": "vector",
            "url": "mapbox://yunjieli.3i12h479"
        });
        map.addLayer({
            "id": "points-businesses",
            "type": "circle",
            "source": "points-businesses",
            "source-layer": "data_businesses-0lvzk6",
            "paint": {
                "circle-radius": {
                    stops: [
                        [12, 3],
                        [15, 8]
                    ]
                },
                "circle-color": colorStops[5],
                "circle-opacity": 0
            },
        }, "admin-2-boundaries-dispute");

        // addd complaints from tileset
        map.addSource("points-complaints", {
            "type": "vector",
            "url": "mapbox://yunjieli.7l1fqjio"
        });
        map.addLayer({
            "id": "points-complaints",
            "type": "circle",
            "source": "points-complaints",
            "source-layer": "data_complaints-1emuz6",
            "paint": {
                "circle-radius": {
                    stops: [
                        [12, 1],
                        [15, 5]
                    ]
                },
                "circle-color": colorStops[2],
                "circle-opacity": 0
            }
        }, "admin-2-boundaries-dispute");

        map.addSource("point-active", {
            "type": "geojson",
            "data": pointActive
        });
        map.addLayer({
            "id": "point-active",
            "type": "circle",
            "source": "point-active",
            // "layout": {
            //     "icon-image": "highlight",
            //     "icon-rotation-alignment": "map"
            // },
            "paint": {
                "circle-radius": 15,
                "circle-color": colorStops[2],
                "circle-opacity": .3,
                "circle-blur": 1
            }
        }, "points-businesses");
    };

    function setLayers() {
        $('.mapboxgl-popup').css('opacity', 0);
        if (activeCamera === "hexbin") {
            map.setPaintProperty('points-complaints', 'circle-opacity', 0);
            map.setPaintProperty('points-businesses', 'circle-opacity', 0);
            map.setPaintProperty('grids-3d', 'fill-extrusion-opacity', 0.6);
            map.setPaintProperty('grid-active', 'fill-extrusion-opacity', 0.6);
            map.getSource('point-active').setData(empty);
        } else if (activeCamera === "dotted") {
            map.setPaintProperty('points-complaints', 'circle-opacity', 0.3);
            map.setPaintProperty('points-businesses', 'circle-opacity', .2);
            map.setPaintProperty('grids-3d', 'fill-extrusion-opacity', 0);
            map.setPaintProperty('grid-active', 'fill-extrusion-opacity', 0);
            // map.getSource('grid-active').setData(empty);
        } else if (activeCamera === "inspector") {
            map.setPaintProperty('points-complaints', 'circle-opacity', 0.3);
            map.setPaintProperty('points-businesses', 'circle-opacity', .2);
            map.setPaintProperty('grids-3d', 'fill-extrusion-opacity', 0);
            map.setPaintProperty('grid-active', 'fill-extrusion-opacity', 0.2);
            map.setPaintProperty('grid-active', 'fill-extrusion-height', 0);
        };

        // set legend
        // if it's dotted, it's the same as dotted
        var camera = activeCamera === "inspector" ? "dotted" : activeCamera;
        $(".style").hide();
        $("#style-" + camera).show();
    };

    function setDDS() {
        setLegend();

        maxColor = max[activeDDS];
        maxHeight = $("#density").is(":checked") ? max["totalDensity"] : max["combined"];

        map.setPaintProperty('grids-3d', 'fill-extrusion-color', {
            property: activeDDS,
            stops: [
                [0, colorStops[1]],
                [maxColor * .2, colorStops[2]],
                [maxColor * .5, colorStops[3]],
                [maxColor * .8, colorStops[4]],
                [maxColor, colorStops[5]]
            ]
        });
        map.setPaintProperty('grids-3d', 'fill-extrusion-height', {
            property: activeDDS,
            stops: [
                [0, 0],
                [maxHeight, heightStop]
            ]
        });
        map.setLayoutProperty('grids-count', 'text-field', '{' + activeDDS + '}');

        // if inside inspector, don't change height
        if (activeCamera === "hexbin") {
            map.setPaintProperty('grid-active', 'fill-extrusion-height', {
                property: activeDDS,
                stops: [
                    [0, 0],
                    [maxHeight, heightStop]
                ]
            });
        };

        // update max number in legend
        $(".label.max").html(maxColor);
    };

    function setLegend(type) {
    //   var heights = percentiles[activeType];
    //   var maxnumber = max[activeType];
    //   // for visual brevity, set max height to 60 while others stay proportional
    //   // var maxheight = maxnumber / heights[4] > 3 ? heights[4] * 3 : maxnumber;
    //   var maxheight = Math.log(maxnumber);
    //   var base = 60;

    //   $("#style-hexbin .hh1").height( Math.max( 1, Math.log(heights[1]) / maxheight * base) );
    //   $("#style-hexbin .hh2").height( Math.max( 1, Math.log(heights[2]) / maxheight * base) );
    //   $("#style-hexbin .hh3").height( Math.max( 1, Math.log(heights[3]) / maxheight * base) );
    //   $("#style-hexbin .hh4").height( Math.max( 1, Math.log(heights[4]) / maxheight * base) );
    //   $("#style-hexbin .hh5").height(base);
    //   $("#style-hexbin .max").text(maxnumber);
    //   $("#style-hexbin .chart-title").text("Total complaints");
        let breaks = type === "combined" ? incomeBreaks : schoolingBreaks;
        let colors = type === "combined" ? incomeColors : schoolingColors;

        let labels = [`<strong>${type === "combined" ? "Avg Yearly Income (USD)" : "Avg Years Schooling"}</strong>`];

        for (let i = 0; i < breaks.length - 1; i++) {
            labels.push(`
                <p class="break">
                    <span class="dot" style="background:${colors[i]}; width:18px; height:18px;"></span>
                    <span class="dot-label">${breaks[i]} – ${breaks[i+1]}</span>
                </p>
            `);
        }

        legend.innerHTML = labels.join('');


    };

    function getCamera() {
        // if pitch==0, don't update Camera
        if (map.getPitch()) {
            previousCamera.center = map.getCenter();
            previousCamera.zoom = map.getZoom();
            previousCamera.pitch = map.getPitch();
            previousCamera.bearing = map.getBearing();
        };
    };
});
