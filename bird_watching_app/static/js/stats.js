"use strict";

let statsApp = {
    data() {
        return {
            species: [], // To be fetched from the API
            filteredSpecies: [],
            trends: [], // To be fetched from the API
            speciesDetails: {}, // To be fetched when a species is selected
            speciesSearch: "",
            selectedSpecies: null,
            trendChart: null,
            speciesTrendChart: null,
            speciesMap: null,
        };
    },
    mounted() {
        this.fetchSpeciesObserved(); // Fetch species observed by the user
        this.fetchTrends(); // Fetch bird-watching trends
        console.log("Vue app mounted successfully!");
    },
    methods: {
        async fetchSpeciesObserved() {
            try {
                const response = await fetch('/bird_watching_app/api/stats/species_observed');
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success') {
                        this.species = data.species;
                        this.filteredSpecies = data.species; // Initialize filtered list
                        console.log("Fetched species data:", this.species);
                        // Optionally, initialize charts that depend on species data here
                    } else {
                        console.error("Failed to fetch species data:", data.message);
                        alert(`Error: ${data.message}`);
                    }
                } else {
                    console.error("Failed to fetch species data.");
                    alert('Failed to fetch species data. Please try again.');
                }
            } catch (error) {
                console.error("Error fetching species data:", error);
                alert('An error occurred while fetching species data.');
            }
        },
        async fetchTrends() {
            try {
                const response = await fetch('/bird_watching_app/api/stats/trends');
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success') {
                        this.trends = data.trends;
                        console.log("Fetched trends data:", this.trends);
                        this.loadTrendsChart(); // Initialize the trends chart
                    } else {
                        console.error("Failed to fetch trends data:", data.message);
                        alert(`Error: ${data.message}`);
                    }
                } else {
                    console.error("Failed to fetch trends data.");
                    alert('Failed to fetch trends data. Please try again.');
                }
            } catch (error) {
                console.error("Error fetching trends data:", error);
                alert('An error occurred while fetching trends data.');
            }
        },
        filterSpecies() {
            const search = this.speciesSearch.toLowerCase();
            this.filteredSpecies = this.species.filter((s) =>
                s.common_name.toLowerCase().includes(search)
            );
        },
        async selectSpecies(species) {
            // Set the selected species
            this.selectedSpecies = species;
            console.log("Selected species:", this.selectedSpecies);
        
            // Fetch details for the selected species
            await this.fetchSpeciesDetails(species.id);
        },
        async fetchSpeciesDetails(speciesId) {
            try {
                const response = await fetch(`/bird_watching_app/api/stats/species_details/${speciesId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success') {
                        this.speciesDetails = data.species_details;
                        console.log("Fetched species details:", this.speciesDetails);
                        this.loadSpeciesDetailsChart(); // Initialize the species trend chart
                        this.loadSpeciesMap(); // Initialize the map
                    } else {
                        console.error("Failed to fetch species details:", data.message);
                        alert(`Error: ${data.message}`);
                        this.selectedSpecies = null; // Deselect species on error
                    }
                } else {
                    console.error("Failed to fetch species details.");
                    alert('Failed to fetch species details. Please try again.');
                }
            } catch (error) {
                console.error("Error fetching species details:", error);
                alert('An error occurred while fetching species details.');
            }
        },
        loadTrendsChart() {
            const ctx = document.getElementById("trendChart").getContext("2d");
            if (this.trendChart) {
                this.trendChart.destroy(); // Destroy existing chart instance if any
            }
            this.trendChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: this.trends.map((t) => t.date),
                    datasets: [
                        {
                            label: "Bird-Watching Trends",
                            data: this.trends.map((t) => t.count),
                            borderColor: "rgba(75, 192, 192, 1)",
                            backgroundColor: "rgba(75, 192, 192, 0.2)",
                            fill: true,
                            tension: 0.1,
                        },
                    ],
                },
                options: { responsive: true },
            });
        },
        loadSpeciesDetailsChart() {
            const ctx = document.getElementById("speciesTrendChart").getContext("2d");
            if (this.speciesTrendChart) {
                this.speciesTrendChart.destroy(); // Destroy existing chart instance if any
            }
            this.speciesTrendChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: this.speciesDetails.dates,
                    datasets: [
                        {
                            label: `${this.selectedSpecies.common_name} Observations`,
                            data: this.speciesDetails.counts,
                            backgroundColor: "rgba(54, 162, 235, 0.5)",
                            borderColor: "rgba(54, 162, 235, 1)",
                            borderWidth: 1,
                        },
                    ],
                },
                options: { responsive: true },
            });
        },
        loadSpeciesMap() {
            // Remove existing map instance if any
            if (this.speciesMap) {
                this.speciesMap.remove();
            }
            this.speciesMap = L.map("speciesMap").setView([0, 0], 2); // Initialize with a global view
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
            }).addTo(this.speciesMap);
    
            // Add markers for each location
            this.speciesDetails.locations.forEach((loc) => {
                L.marker([loc.lat, loc.lng]).addTo(this.speciesMap);
            });
    
            // Adjust the map view to fit all markers
            if (this.speciesDetails.locations.length > 0) {
                const bounds = L.latLngBounds(this.speciesDetails.locations.map(loc => [loc.lat, loc.lng]));
                this.speciesMap.fitBounds(bounds, { padding: [50, 50] });
            }
        },
    },
};

// Mount the Vue app
Vue.createApp(statsApp).mount("#stats-app");
