"use strict";

const myChecklistsApp = {
  data() {
    return {
      checklists: [], // Store the user's checklists
    };
  },
  methods: {
    async fetchChecklists() {
      try {
        const response = await fetch('/bird_watching_app/api/my_checklists');
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched checklists:', data.checklists); // Debugging: Log fetched data
          this.checklists = data.checklists; // Populate the checklists array
        } else {
          console.error('Failed to fetch checklists.');
        }
      } catch (error) {
        console.error('Error fetching checklists:', error);
      }
    },
    async deleteChecklist(id) {
      if (!confirm('Are you sure you want to delete this checklist?')) {
        return;
      }
      try {
        const response = await fetch(`/bird_watching_app/delete_checklist/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        if (response.ok && result.status === 'success') {
          alert(result.message);
          this.checklists = this.checklists.filter(checklist => checklist.id !== id);
        } else {
          alert(`Failed to delete checklist: ${result.message}`);
        }
      } catch (error) {
        console.error('Error deleting checklist:', error);
        alert('An error occurred while deleting the checklist. Please try again.');
      }
    },
    goToEditChecklist(id) {
      window.location.href = `/bird_watching_app/edit_checklist/${id}`;
    },
  },
  async mounted() {
    console.log('Component mounted: Fetching checklists...'); // Debugging: Log lifecycle event
    await this.fetchChecklists();
  },
};

Vue.createApp(myChecklistsApp).mount('#my-checklists-app');
