"use strict";

const editChecklistsApp = {
  data() {
    return {
      checklist: null, // Store the checklist data
      species: [], // Store the list of species for the dropdown
      isLoading: false, // Loading indicator
      errorMessage: '', // Store any error messages
    };
  },
  methods: {
    async fetchSpecies() {
      try {
        const response = await fetch('/bird_watching_app/get_species_data');
        if (response.ok) {
          const data = await response.json();
          this.species = data.species;
        } else {
          console.error('Failed to fetch species data.');
          this.errorMessage = 'Failed to load species data.';
        }
      } catch (error) {
        console.error('Error fetching species:', error);
        this.errorMessage = 'An error occurred while loading species data.';
      }
    },
    async fetchChecklist() {
      this.isLoading = true;
      try {
        const checklistId = this.getChecklistIdFromURL();

        if (!checklistId) {
          this.errorMessage = 'No checklist ID provided.';
          return;
        }

        const response = await fetch(`/bird_watching_app/api/get_checklist/${checklistId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            this.checklist = data.checklist;
          } else {
            this.errorMessage = data.message || 'Failed to fetch checklist data.';
          }
        } else {
          console.error('Failed to fetch checklist data.');
          this.errorMessage = 'Failed to load checklist data.';
        }
      } catch (error) {
        console.error('Error fetching checklist:', error);
        this.errorMessage = 'An error occurred while loading the checklist.';
      } finally {
        this.isLoading = false;
      }
    },
    getChecklistIdFromURL() {
      const path = window.location.pathname;
      const parts = path.split('/');
      const id = parts[parts.length - 1];
      return id;
    },
    async updateChecklist() {
      try {
        const checklistId = this.checklist.id;
        const payload = {
          latitude: this.checklist.latitude,
          longitude: this.checklist.longitude,
          observation_date: this.checklist.observation_date,
          time_observations_started: this.checklist.time_observations_started,
          duration_minutes: this.checklist.duration_minutes,
          sightings: this.checklist.sightings.map(s => ({
            species_id: s.species_id,
            observation_count: s.observation_count,
          })),
        };

        const response = await fetch(`/bird_watching_app/api/update_checklist/${checklistId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
          alert(result.message);
          // Optionally, redirect to "My Checklists" page
          window.location.href = '/bird_watching_app/my_checklists';
        } else {
          alert(`Failed to update checklist: ${result.message}`);
        }
      } catch (error) {
        console.error('Error updating checklist:', error);
        alert('An error occurred while updating the checklist. Please try again.');
      }
    },
  },
  async mounted() {
    await this.fetchSpecies();
    await this.fetchChecklist();
  },
};

Vue.createApp(editChecklistsApp).mount('#edit-checklist-app');
