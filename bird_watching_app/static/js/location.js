"use strict";

// We use this to track what is currently being displayed
// This is useful for having/using multiple charts to keep track of the right ones.
let currentChart = null;

const locationApp = {
    data() {
        return {
            regionStats: [],
            topContributors: [],
            selectedSpecies: null,
            ne_lat: null,
            ne_lng: null,
            sw_lat: null,
            sw_lng: null,
        };
    },
    methods: {
        parseURLParams() {
            const urlParams = new URLSearchParams(window.location.search);
            this.ne_lat = urlParams.get('ne_lat');
            this.ne_lng = urlParams.get('ne_lng');
            this.sw_lat = urlParams.get('sw_lat');
            this.sw_lng = urlParams.get('sw_lng');
        },
        loadRegionData() {
            axios.get('/bird_watching_app/get_region_data', {
                params: {
                    ne_lat: this.ne_lat,
                    ne_lng: this.ne_lng,
                    sw_lat: this.sw_lat,
                    sw_lng: this.sw_lng
                }
            })
                .then(response => {
                    this.regionStats = response.data.region_species;
                    this.topContributors = response.data.top_contributors;
                })
                .catch(error => {
                    console.error("Error loading region data:", error);
                });
        },
        selectSpecies(species) {
            this.selectedSpecies = species;
            this.$nextTick(() => {
                this.loadSpeciesTimeData(species);
            });
        },
        loadSpeciesTimeData(species) {
            if (!species) return;
            axios.get('/bird_watching_app/get_species_time_data', {
                params: {
                    species: species,
                    ne_lat: this.ne_lat,
                    ne_lng: this.ne_lng,
                    sw_lat: this.sw_lat,
                    sw_lng: this.sw_lng
                }
            })
                .then(response => {
                    const data = response.data.time_series;
                    this.renderChart(species, data);
                })
                .catch(error => {
                    console.error("Error loading species time data:", error);
                });
        },
        renderChart(species, data) {
            const chartContainer = document.getElementById("speciesChart");
            if (!chartContainer) {
                console.error("Canvas element not found.");
                return;
            }

            const ctx = chartContainer.getContext("2d");

            if (currentChart) {
                currentChart.destroy();
            }

            currentChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: data.map((d) => d.date),
                    datasets: [
                        {
                            label: `${species} Sightings Over Time`,
                            data: data.map((d) => d.count),
                            borderColor: "rgba(75, 192, 192, 1)",
                            backgroundColor: "rgba(75, 192, 192, 0.2)",
                            fill: true,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                },
            });
        },
    },
    mounted() {
        this.parseURLParams();
        this.loadRegionData();
    },
};

Vue.createApp(locationApp).mount("#location-app");