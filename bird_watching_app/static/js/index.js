"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


app.data = {    
    data: function() {
        return {
            // Complete as you see fit.
            my_value: 1, // This is an example.
        };
    },
    methods: {
        // Complete as you see fit.
        my_function: function() {
            // This is an example.
            this.my_value += 1;
        },
    },
};

app.vue = Vue.createApp(app.data).mount("#app");

app.init_map = function () {
    const defaultLocation = { lat: 37.7749, lng: -122.4194 };
    
    app.map = new google.maps.Map(document.getElementById("map"), {
        center: defaultLocation,
        zoom: 10,
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                app.map.setCenter(userLocation);
            },
            () => {
                console.error("Geolocation failed. Using default location.");
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
    }

    app.heatmap = new google.maps.visualization.HeatmapLayer({
        data: [],
        map: app.map,
    });

    axios.get(my_callback_url).then((response) => {
        let heatmapData = response.data.points.map((point) => {
            return {
                location: new google.maps.LatLng(point[0], point[1]),
                weight: point[2],
            };
        });
        app.heatmap.setData(heatmapData);
    });

    const drawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ["rectangle"],
        },
    });
    drawingManager.setMap(app.map);

    google.maps.event.addListener(drawingManager, "rectanglecomplete", function (rectangle) {
        const bounds = rectangle.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        axios.post(my_callback_url, {
            ne_lat: ne.lat(),
            ne_lng: ne.lng(),
            sw_lat: sw.lat(),
            sw_lng: sw.lng(),
        }).then((response) => {
            console.log("Region Stats:", response.data.stats);
        });

        rectangle.setMap(null);
    });
};

app.init_map();