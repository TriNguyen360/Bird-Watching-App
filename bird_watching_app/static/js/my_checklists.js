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
        // Fetch checklists from the backend
        const response = await fetch('/bird_watching_app/my_checklists');
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
        });
        if (response.ok) {
          alert('Checklist deleted successfully!');
          this.checklists = this.checklists.filter(checklist => checklist.id !== id);
        } else {
          alert('Failed to delete checklist. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting checklist:', error);
      }
    },
  },
  async mounted() {
    console.log('Component mounted: Fetching checklists...'); // Debugging: Log lifecycle event
    await this.fetchChecklists();
  },
};

Vue.createApp(myChecklistsApp).mount('#my-checklists-app');
