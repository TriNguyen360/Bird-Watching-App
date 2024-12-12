"use strict";

// Vue.js app setup
let app = {};

app.data = {
    data() {
        return {
            my_value: 1, // Example value
            species_list: [],
            search_query: '',
            selected_species: '',
            show_dropdown: false,
            region_rectangle: null,
        };
    },
    computed: {
        filtered_species() {
            const q = this.search_query.toLowerCase();
            return this.species_list.filter(sp => sp.common_name.toLowerCase().includes(q));
        }
    },
    methods: {
        my_function() {
            this.my_value += 1;
        },
        loadSpeciesList() {
            axios.get('/bird_watching_app/get_species_data')
                .then(response => {
                    this.species_list = response.data.species;
                })
                .catch(error => {
                    console.error("Error loading species data:", error);
                });
        },
        hideDropdown() {
            setTimeout(() => {
                this.show_dropdown = false;
            }, 200);
        },
        selectSpecies(name) {
            this.selected_species = name;
            this.search_query = name;
            this.show_dropdown = false;
        },
        clearSearch() {
            this.search_query = '';
            this.selected_species = '';
            this.loadHeatmapData('');
        },
        loadHeatmapData(species) {
            let url = '/bird_watching_app/heatmap_data';
            if (species && species.trim()) {
                url += '?species=' + encodeURIComponent(species);
            }
            axios.get(url)
                .then(response => {
                    const points = response.data.points.map((p) => {
                        return {
                            location: new google.maps.LatLng(p[0], p[1]),
                            weight: p[2]
                        };
                    });
                    if (app.heatmap) {
                        app.heatmap.setData(points);
                    }
                })
                .catch((error) => {
                    console.error("Error loading heatmap data:", error);
                });
        },
        getRegionStats() {
            if (!this.region_rectangle) return;
            const bounds = this.region_rectangle.getBounds();
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
        
            window.location.href = "/bird_watching_app/location?ne_lat=" + ne.lat() +
                "&ne_lng=" + ne.lng() +
                "&sw_lat=" + sw.lat() +
                "&sw_lng=" + sw.lng();
        },
        deleteRegionRectangle() {
            if (this.region_rectangle) {
                this.region_rectangle.setMap(null); // Removes the rectangle from the map
                this.region_rectangle = null; // Clears the reference so buttons vanish
            }
        },
    },
    watch: {
        selected_species(newVal) {
            // Whenever the selected species changes, reload the heatmap
            this.loadHeatmapData(newVal);
        }
    },
    mounted() {
        this.loadSpeciesList();
    }
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

    // Create heatmap layer
    const heatmap = new google.maps.visualization.HeatmapLayer({
        data: [],
        map: app.map
    });

    // Store the heatmap for later updates
    app.heatmap = heatmap;

    // Initial load of all species data
    axios.get('/bird_watching_app/heatmap_data').then(response => {
        // response.data.points should be [[lat, lng, weight], ...]
        const points = response.data.points.map((p) => {
            return {
                location: new google.maps.LatLng(p[0], p[1]),
                weight: p[2]
            };
        });

        // Update the heatmap data
        heatmap.setData(points);
        heatmap.set('radius', 50);
    }).catch((error) => {
        console.error("Error loading heatmap data:", error);
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
        if (app.vue.region_rectangle) {
            app.vue.region_rectangle.setMap(null);
        }
        app.vue.region_rectangle = rectangle;
    });
};

// Global initMap function (called by Google Maps API)
window.initMap = function () {
    app.init_map();
};
