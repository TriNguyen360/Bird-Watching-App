const checklistApp = {
    data() {
        return {
            // The location data passed from the query parameters (latitude and longitude)
            location: null,
            // The user's search input for filtering species
            searchQuery: '',
            // The full list of species fetched from the backend
            species: [],
        };
    },
    computed: {
        // Dynamically filter the species list based on the search query
        filteredSpecies() {
            const query = this.searchQuery.trim().toLowerCase();
            // If the user typed something, show matching species; otherwise, show all
            return query
                ? this.species.filter(sp => sp.common_name.toLowerCase().includes(query))
                : this.species;
        },
        // Check if the user has added counts for at least one species
        hasSightings() {
            return this.species.some(sp => sp.count > 0);
        },
    },
    methods: {
        // Add one to the count for a species (because birds are cute and we saw one more)
        incrementCount(species) {
            species.count++;
        },
        // Subtract one from the count for a species (but never go below zero, because physics)
        decrementCount(species) {
            if (species.count > 0) species.count--;
        },
        // Send the user's checklist to the backend for processing
        async submitChecklist() {
            // Prepare a list of species with counts > 0 (no point in sending zero-count birds)
            const checklistData = this.species
                .filter(sp => sp.count > 0)
                .map(sp => ({
                    species_id: sp.id,
                    count: sp.count,
                    location: this.location, // Include the selected location
                }));

            try {
                // Make the POST request to send the data
                const response = await fetch('/bird_watching_app/submit_checklist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ checklist: checklistData }),
                });

                if (response.ok) {
                    alert('Checklist submitted successfully!'); // Yay! It worked!
                    this.resetCounts(); // Reset counts to zero after submission
                } else {
                    alert('Failed to submit checklist. Please try again.'); // Something went wrong, so let the user know
                }
            } catch (error) {
                console.error('Error submitting checklist:', error); // Log the error for debugging
            }
        },
        // Reset the count for all species to zero (like a clean slate)
        resetCounts() {
            this.species.forEach(sp => (sp.count = 0));
        },
        // Fetch the list of species from the backend (so we have something to show)
        async fetchSpecies() {
            try {
                const response = await fetch('/bird_watching_app/get_species_data');
                if (response.ok) {
                    const data = await response.json();
                    // Map the species data into the format we want and set counts to zero
                    this.species = data.species.map(sp => ({
                        id: sp.id,
                        common_name: sp.common_name,
                        count: 0,
                    }));
                } else {
                    console.error('Failed to fetch species data.'); // Backend didn't respond well
                }
            } catch (error) {
                console.error('Error fetching species:', error); // Something went really wrong
            }
        },
        // Parse location data (latitude and longitude) from the URL
        parseLocation() {
            const params = new URLSearchParams(window.location.search);
            const lat = params.get('lat');
            const lng = params.get('lng');

            if (lat && lng) {
                // Save the parsed location to the component's state
                this.location = { lat: parseFloat(lat), lng: parseFloat(lng) };
            } else {
                // If there's no location data, let the user know they messed up
                alert('No location data found. Please return to the map and select a location.');
            }
        },
    },
    // Do stuff when the page loads 
    async mounted() {
        this.parseLocation(); // Grab location info from the URL
        await this.fetchSpecies(); // Fetch the species list
    },
};

Vue.createApp(checklistApp).mount('#checklist-app');

  