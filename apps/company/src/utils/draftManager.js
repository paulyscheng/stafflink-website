import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY_PREFIX = 'project_draft_';
const DRAFTS_LIST_KEY = 'project_drafts_list';

class DraftManager {
  // Save draft
  async saveDraft(projectData, draftId = null) {
    try {
      const id = draftId || `${DRAFT_KEY_PREFIX}${Date.now()}`;
      const draft = {
        id,
        data: projectData,
        lastModified: new Date().toISOString(),
        currentStep: projectData.currentStep || 1,
        completedSteps: projectData.completedSteps || [],
      };

      // Save draft data
      await AsyncStorage.setItem(id, JSON.stringify(draft));

      // Update drafts list
      const draftsList = await this.getDraftsList();
      const existingIndex = draftsList.findIndex(d => d.id === id);
      
      const draftMeta = {
        id,
        name: projectData.projectName || '未命名项目',
        lastModified: draft.lastModified,
        currentStep: draft.currentStep,
      };

      if (existingIndex >= 0) {
        draftsList[existingIndex] = draftMeta;
      } else {
        draftsList.unshift(draftMeta);
      }

      // Keep only last 10 drafts
      if (draftsList.length > 10) {
        const removedDrafts = draftsList.splice(10);
        // Remove old draft data
        for (const oldDraft of removedDrafts) {
          await AsyncStorage.removeItem(oldDraft.id);
        }
      }

      await AsyncStorage.setItem(DRAFTS_LIST_KEY, JSON.stringify(draftsList));
      return id;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  }

  // Load draft
  async loadDraft(draftId) {
    try {
      const draftStr = await AsyncStorage.getItem(draftId);
      if (!draftStr) return null;
      
      const draft = JSON.parse(draftStr);
      return draft;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  }

  // Get drafts list
  async getDraftsList() {
    try {
      const listStr = await AsyncStorage.getItem(DRAFTS_LIST_KEY);
      if (!listStr) return [];
      
      return JSON.parse(listStr);
    } catch (error) {
      console.error('Error loading drafts list:', error);
      return [];
    }
  }

  // Delete draft
  async deleteDraft(draftId) {
    try {
      // Remove draft data
      await AsyncStorage.removeItem(draftId);

      // Update drafts list
      const draftsList = await this.getDraftsList();
      const filteredList = draftsList.filter(d => d.id !== draftId);
      await AsyncStorage.setItem(DRAFTS_LIST_KEY, JSON.stringify(filteredList));
      
      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      return false;
    }
  }

  // Clear all drafts
  async clearAllDrafts() {
    try {
      const draftsList = await this.getDraftsList();
      
      // Remove all draft data
      for (const draft of draftsList) {
        await AsyncStorage.removeItem(draft.id);
      }

      // Clear drafts list
      await AsyncStorage.removeItem(DRAFTS_LIST_KEY);
      
      return true;
    } catch (error) {
      console.error('Error clearing drafts:', error);
      return false;
    }
  }

  // Auto-save with debouncing
  setupAutoSave(getDataFn, draftId = null, interval = 30000) {
    let saveTimer = null;
    let lastSavedData = null;

    const save = async () => {
      try {
        const currentData = getDataFn();
        
        // Only save if data has changed
        if (JSON.stringify(currentData) !== JSON.stringify(lastSavedData)) {
          const id = await this.saveDraft(currentData, draftId);
          lastSavedData = currentData;
          return id;
        }
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    };

    // Save immediately
    save();

    // Set up interval
    saveTimer = setInterval(save, interval);

    // Return cleanup function
    return () => {
      if (saveTimer) {
        clearInterval(saveTimer);
        save(); // Final save
      }
    };
  }
}

export default new DraftManager();