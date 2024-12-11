"use strict";

let statsApp = {
    data() {
        return {
            species: [
                { id: 1, common_name: "Sparrow", sightings: 25 },
                { id: 2, common_name: "Robin", sightings: 18 },
                { id: 3, common_name: "Eagle", sightings: 5 },
            ],
            filteredSpecies: [],
            trends: [
                { date: "2024-12-01", count: 10 },
                { date: "2024-12-02", count: 15 },
                { date: "2024-12-03", count: 8 },
            ],
            speciesDetails: {
                1: {
                    dates: ["2024-12-01", "2024-12-02"],
                    counts: [5, 10],
                    locations: [{ lat: 37.7749, lng: -122.4194 }],
                },
                2: {
                    dates: ["2024-12-01", "2024-12-03"],
                    counts: [8, 10],
                    locations: [{ lat: 40.7128, lng: -74.006 }],
                },
                3: {
                    dates: ["2024-12-02", "2024-12-03"],
                    counts: [3, 2],
                    locations: [{ lat: 34.0522, lng: -118.2437 }],
                },
            },
            speciesSearch: "",
            selectedSpecies: null,
        };
    },
    mounted() {
        this.filteredSpecies = this.species; // Initialize filtered list
        console.log("Vue app mounted successfully!");
        console.log("Species data:", this.species);

        this.loadTrends(); // Load global trends chart
    },
    methods: {
        filterSpecies() {
            const search = this.speciesSearch.toLowerCase();
            this.filteredSpecies = this.species.filter((s) =>
                s.common_name.toLowerCase().includes(search)
            );
        },
        selectSpecies(species) {
            // Set the selected species
            this.selectedSpecies = species;
            console.log("Selected species:", this.selectedSpecies);
        
            // Load details for the selected species
            this.loadSpeciesDetails(species.id);
        },        
        loadTrends() {
            const ctx = document.getElementById("trendChart").getContext("2d");
            new Chart(ctx, {
                type: "line",
                data: {
                    labels: this.trends.map((t) => t.date),
                    datasets: [
                        {
                            label: "Bird-Watching Trends",
                            data: this.trends.map((t) => t.count),
                            borderColor: "rgba(75, 192, 192, 1)",
                            fill: false,
                        },
                    ],
                },
                options: { responsive: true },
            });
        },
        loadSpeciesDetails(speciesId) {
            const details = this.speciesDetails[speciesId];
            if (!details) {
                console.error("No details found for species ID:", speciesId);
                return;
            }

            const ctx = document.getElementById("speciesTrendChart").getContext("2d");
            new Chart(ctx, {
                type: "bar",
                data: {
                    labels: details.dates,
                    datasets: [
                        {
                            label: `${this.selectedSpecies.common_name} Observations`,
                            data: details.counts,
                            backgroundColor: "rgba(54, 162, 235, 0.5)",
                        },
                    ],
                },
                options: { responsive: true },
            });

            const map = L.map("speciesMap").setView(details.locations[0], 10);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
            }).addTo(map);

            details.locations.forEach((loc) => {
                L.marker(loc).addTo(map);
            });
        },
    },
};

// Mount the Vue app
Vue.createApp(statsApp).mount("#stats-app");
