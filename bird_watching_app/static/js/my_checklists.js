const myChecklistsApp = {
    data() {
      return {
        checklists: checklistsData || [], // Bind the data passed from the backend
      };
    },
    methods: {
      async deleteChecklist(id) {
        if (confirm("Are you sure you want to delete this checklist?")) {
          try {
            const response = await fetch(`/delete_checklist/${id}`, { method: "DELETE" });
            if (response.ok) {
              this.checklists = this.checklists.filter((checklist) => checklist.id !== id);
              alert("Checklist deleted successfully!");
            } else {
              alert("Failed to delete the checklist.");
            }
          } catch (error) {
            console.error("Error deleting checklist:", error);
          }
        }
      },
    },
  };
  
  Vue.createApp(myChecklistsApp).mount("#my-checklists-app");
  