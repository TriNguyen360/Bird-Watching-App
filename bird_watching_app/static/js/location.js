"use strict";

// We use this to track what is currently being displayed
// This is useful for having/using multiple charts to keep track of the right ones.
let currentChart = null;

const locationApp = {
    data() {
        return {
            regionStats: [
                { species: "Mordecai", checklists: 15, sightings: 42 },
                { species: "Rigby", checklists: 10, sightings: 25 },
                { species: "TheBird", checklists: 5, sightings: 8 },
            ],
            selectedSpecies: null,
            topContributors: [
                { name: "Fredrick", contributions: 30 },
                { name: "Chica", contributions: 20 },
                { name: "Bonnie", contributions: 15 },
            ],
        };
    },
    methods: {
        selectSpecies(species) {
            this.selectedSpecies = species;
            // Used this to help me figure out how to delay chart rendering until DOM updates finish:
            // https://stackoverflow.com/questions/47634258/what-is-nexttick-and-what-does-it-do-in-vue-js
            this.$nextTick(() => {
                this.renderChart(species);
            });
        },
        renderChart(species) {
            const data = [
                { date: "December 7", count: 5 },
                { date: "December 8", count: 10 },
                { date: "December 9", count: 8 },
            ];

            const chartContainer = document.getElementById("speciesChart");

            if (!chartContainer) {
                console.error("Canvas element not found.");
                return;
            }

            const ctx = chartContainer.getContext("2d");

            // We get rid of the old chart for the new one.
            if (currentChart) {
                currentChart.destroy();
            }

            // Create the new chart
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
        console.log("Location page initialized.");
    },
};

Vue.createApp(locationApp).mount("#location-app");
