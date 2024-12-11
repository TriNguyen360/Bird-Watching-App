"use strict";

// Vue.js app setup
let app = {};
app.data = {
    data: function () {
        return {
            my_value: 1, // Example value
        };
    },
    methods: {
        my_function: function () {
            this.my_value += 1;
        },
    },
};

app.vue = Vue.createApp(app.data).mount("#app");

// Map initialization logic
app.init_map = function () {
    // Default location
    const defaultLocation = { lat: 37.7749, lng: -122.4194 };

    // Create map
    app.map = new google.maps.Map(document.getElementById("map"), {
        center: defaultLocation,
        zoom: 10,
    });

    // Geolocation
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

    // Heatmap layer
    app.heatmap = new google.maps.visualization.HeatmapLayer({
        data: [],
        map: app.map,
    });

    // Fetch heatmap data
    axios.get(my_callback_url).then((response) => {
        const heatmapData = response.data.points.map((point) => {
            return {
                location: new google.maps.LatLng(point[0], point[1]),
                weight: point[2],
            };
        });
        app.heatmap.setData(heatmapData);
    });

    // Drawing manager
    const drawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ["rectangle"],
        },
    });
    drawingManager.setMap(app.map);

    // Event listener for rectangle complete
    google.maps.event.addListener(drawingManager, "rectanglecomplete", function (rectangle) {
        const bounds = rectangle.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        // Send rectangle bounds to backend
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

// Global initMap function (called by Google Maps API)
window.initMap = function () {
    app.init_map();
};
