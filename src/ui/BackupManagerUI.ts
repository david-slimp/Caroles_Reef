import { backupManager } from '../utils/BackupManager';

import { toast } from './toast';

/**
 * UI component for backup/restore functionality
 */
export class BackupManagerUI {
  private container: HTMLElement;
  private backupButton: HTMLButtonElement;
  private restoreButton: HTMLButtonElement;
  private fileInput: HTMLInputElement;

  constructor(containerId: string = 'backup-manager') {
    this.container = document.createElement('div');
    this.container.id = containerId;
    this.container.className = 'backup-manager';

    // Create backup button
    this.backupButton = document.createElement('button');
    this.backupButton.className = 'btn-backup';
    this.backupButton.title = 'Backup Game Data';
    this.backupButton.innerHTML = '💾 Backup';
    this.backupButton.addEventListener('click', () => this.handleBackup());

    // Create restore button
    this.restoreButton = document.createElement('button');
    this.restoreButton.className = 'btn-restore';
    this.restoreButton.title = 'Restore Game Data';
    this.restoreButton.innerHTML = '🔄 Restore';
    this.restoreButton.addEventListener('click', () => this.fileInput.click());

    // Create hidden file input for restore
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json';
    this.fileInput.style.display = 'none';
    this.fileInput.addEventListener('change', e => this.handleFileUpload(e));

    // Add elements to container
    this.container.appendChild(this.backupButton);
    this.container.appendChild(this.restoreButton);
    this.container.appendChild(this.fileInput);

    // Add styles
    this.addStyles();
  }

  /**
   * Add the backup manager to the DOM
   * @param parentElement Optional parent element to append to (defaults to document.body)
   */
  public mount(parentElement: HTMLElement | Element | null = null): void {
    // Default to body if no parent element provided
    const target = parentElement || document.body;
    if (!target) {
      console.error('Could not mount BackupManagerUI: No parent element found');
      return;
    }

    // Remove existing instance if it exists
    const existing = document.getElementById(this.container.id);
    if (existing) {
      existing.remove();
    }

    // Use type assertion to handle both Element and HTMLElement
    (target as HTMLElement).appendChild(this.container);
  }

  /**
   * Show backup tag input dialog
   */
  private showBackupDialog(): void {
    // Create dialog container
    const dialog = document.createElement('div');
    dialog.className = 'backup-dialog';

    // Create dialog content
    dialog.innerHTML = `
      <div class="backup-dialog-content">
        <h3>Create Backup</h3>
        <p>Enter a tag for your backup (letters and numbers only):</p>
        <input type="text" id="backupTag" maxlength="20" placeholder="e.g. before_update" 
               pattern="[A-Za-z0-9]+" title="Only letters and numbers are allowed">
        <div class="dialog-buttons">
          <button id="cancelBackup">Cancel</button>
          <button id="confirmBackup" class="primary">Create Backup</button>
        </div>
      </div>
    `;

    // Add styles if not already added
    if (!document.getElementById('backup-dialog-styles')) {
      const style = document.createElement('style');
      style.id = 'backup-dialog-styles';
      style.textContent = `
        .backup-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .backup-dialog-content {
          background: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .backup-dialog h3 {
          margin-top: 0;
          color: #fff;
        }
        
        .backup-dialog p {
          margin: 10px 0;
          color: #ddd;
        }
        
        .backup-dialog input[type="text"] {
          width: 100%;
          padding: 8px;
          margin: 10px 0;
          border: 1px solid #444;
          border-radius: 4px;
          background: #333;
          color: #fff;
          font-size: 14px;
        }
        
        .backup-dialog input[type="text"]:focus {
          outline: none;
          border-color: #4a9ff5;
          box-shadow: 0 0 0 2px rgba(74, 159, 245, 0.3);
        }
        
        .dialog-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        
        .dialog-buttons button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        
        .dialog-buttons button:first-child {
          background: #444;
          color: #fff;
        }
        
        .dialog-buttons button.primary {
          background: #4a9ff5;
          color: white;
        }
        
        .dialog-buttons button:hover {
          opacity: 0.9;
        }
      `;
      document.head.appendChild(style);
    }

    // Add to document
    document.body.appendChild(dialog);

    // Focus the input
    const input = dialog.querySelector('input');
    input?.focus();

    // Handle confirm button
    const confirmBtn = dialog.querySelector('#confirmBackup') as HTMLButtonElement | null;
    confirmBtn?.addEventListener('click', () => {
      const tag = (input?.value || '').trim();
      if (tag && !/^[A-Za-z0-9]+$/.test(tag)) {
        alert('Please use only letters and numbers in the tag');
        return;
      }

      dialog.remove();
      this.performBackup(tag);
    });

    // Handle cancel button
    const cancelBtn = dialog.querySelector('#cancelBackup');
    cancelBtn?.addEventListener('click', () => {
      dialog.remove();
    });

    // Close on escape key
    dialog.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        dialog.remove();
      } else if (e.key === 'Enter' && confirmBtn) {
        confirmBtn.click();
      }
    });
  }

  /**
   * Perform the actual backup with the given tag
   * @param tag Optional tag to include in the filename
   */
  private performBackup(tag?: string): void {
    try {
      backupManager.downloadBackup(tag);
      toast('Backup created successfully!');
    } catch (error) {
      console.error('Backup failed:', error);
      toast('Failed to create backup', true);
    }
  }

  /**
   * Handle backup button click
   */
  private handleBackup(): void {
    this.showBackupDialog();
  }

  /**
   * Handle file upload for restore
   */
  private async handleFileUpload(event: Event): Promise<void> {
    console.log('handleFileUpload called');
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      console.log('No files selected');
      return;
    }

    const file = input.files[0];
    console.log('Selected file:', file.name);

    if (!file.name.endsWith('.json')) {
      const errorMsg = 'Please select a valid JSON backup file';
      console.error(errorMsg);
      toast(errorMsg, true);
      return;
    }

    try {
      console.log('Showing restore confirmation dialog');
      const preserveTankFish = await this.showRestoreConfirmation();
      console.log('User selected preserveTankFish:', preserveTankFish);

      if (preserveTankFish === null) {
        console.log('User cancelled restore operation');
        return; // User cancelled
      }

      console.log('Starting backup restore...');
      const success = await backupManager.handleFileUpload({ file, preserveTankFish });
      console.log('Backup restore completed with status:', success);

      if (success) {
        const message = preserveTankFish
          ? 'Game data restored successfully! Your current fish are still in the tank.'
          : 'Game data restored successfully!';
        console.log(message);
        toast(message);

        // Notify the UI to update without reloading
        const event = new CustomEvent('backupRestoredUI', {
          detail: {
            timestamp: new Date().toISOString(),
            preserveTankFish,
          },
        });
        window.dispatchEvent(event);
      } else {
        const errorMsg = 'Failed to restore backup';
        console.error(errorMsg);
        toast(errorMsg, true);
      }
    } catch (error) {
      const errorMsg = `Restore failed: ${(error as Error).message}`;
      console.error(errorMsg, error);
      toast(errorMsg, true);
    } finally {
      // Reset the file input
      console.log('Resetting file input');
      input.value = '';
    }
  }

  /**
   * Shows a confirmation dialog for restore with option to preserve tank fish
   * @returns {Promise<boolean | null>} True to preserve tank fish, false to not, null if cancelled
   */
  private showRestoreConfirmation(): Promise<boolean | null> {
    console.log('showRestoreConfirmation called');
    return new Promise(resolve => {
      try {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = [
          'position: fixed',
          'top: 0',
          'left: 0',
          'right: 0',
          'bottom: 0',
          'background-color: rgba(0, 0, 0, 0.7)',
          'display: flex',
          'justify-content: center',
          'align-items: center',
          'z-index: 10000',
        ].join(';');

        // Create dialog
        const dialog = document.createElement('div');
        dialog.id = 'restore-confirmation-dialog';
        dialog.style.cssText = [
          'background: #1a365d',
          'border: 2px solid #4a5568',
          'border-radius: 8px',
          'padding: 25px',
          'color: white',
          'max-width: 90%',
          'width: 400px',
          'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7)',
        ].join(';');

        // Add dialog content
        dialog.innerHTML = `
          <h3 style="margin: 0 0 15px 0; color: #f6e05e; font-size: 1.5em;">Restore Backup</h3>
          <p style="margin: 0 0 20px 0; font-size: 1.1em;">
            This will overwrite your current game data.
          </p>
          <div style="margin-bottom: 20px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="preserveTankFish" checked style="margin-right: 10px;">
              Keep fish currently in the tank
            </label>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="cancelRestore" style="padding: 8px 16px; background: #4a5568; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Cancel
            </button>
            <button id="confirmRestore" style="padding: 8px 16px; background: #48bb78; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
              Restore
            </button>
          </div>
        `;

        // Add to DOM
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Prevent scrolling
        document.body.style.overflow = 'hidden';

        // Get references to elements
        const confirmBtn = dialog.querySelector('#confirmRestore') as HTMLButtonElement;
        const cancelBtn = dialog.querySelector('#cancelRestore') as HTMLButtonElement;
        const preserveCheckbox = dialog.querySelector('#preserveTankFish') as HTMLInputElement;

        // Log if elements were found
        console.log('Confirm button found:', !!confirmBtn);
        console.log('Cancel button found:', !!cancelBtn);
        console.log('Preserve checkbox found:', !!preserveCheckbox);

        if (!confirmBtn || !cancelBtn || !preserveCheckbox) {
          console.error('One or more required elements not found in dialog');
          console.log('Dialog HTML for debugging:', dialog.innerHTML);
          if (overlay.parentNode) {
            document.body.removeChild(overlay);
          }
          document.body.style.overflow = '';
          resolve(null);
          return;
        }

        // Focus the confirm button by default
        console.log('Focusing confirm button');
        confirmBtn.focus();

        // Set up cleanup function
        const cleanup = () => {
          console.log('Cleaning up dialog');
          if (overlay.parentNode) {
            document.body.removeChild(overlay);
          }
          document.removeEventListener('keydown', handleKeyDown);
          document.body.style.overflow = ''; // Restore scrolling
        };

        // Set up event handlers
        const handleConfirm = () => {
          console.log('User confirmed restore with preserveTankFish:', preserveCheckbox.checked);
          cleanup();
          resolve(preserveCheckbox.checked);
        };

        const handleCancel = () => {
          console.log('User cancelled restore');
          cleanup();
          resolve(null);
        };

        // Handle keyboard navigation
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            handleCancel();
          } else if (e.key === 'Enter' && document.activeElement === confirmBtn) {
            handleConfirm();
          } else if (e.key === 'Enter' && document.activeElement === cancelBtn) {
            handleCancel();
          } else if (e.key === ' ' || e.key === 'Spacebar') {
            if (document.activeElement === preserveCheckbox) {
              e.preventDefault();
              preserveCheckbox.checked = !preserveCheckbox.checked;
            }
          }
        };

        // Add event listeners
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        document.addEventListener('keydown', handleKeyDown);

        // Log dialog visibility
        setTimeout(() => {
          const dialogEl = document.getElementById('restore-confirmation-dialog');
          if (dialogEl) {
            console.log('Dialog is in DOM, checking visibility');
            const style = window.getComputedStyle(dialogEl);
            console.log('Dialog display style:', style.display);
            console.log('Dialog visibility:', style.visibility);
            console.log('Dialog opacity:', style.opacity);
          }
        }, 100);
      } catch (error) {
        console.error('Error in showRestoreConfirmation:', error);
        resolve(null);
      }
    });
  }

  /**
   * Add styles for the backup manager
   */
  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .backup-manager {
        display: flex;
        gap: 8px;
        margin-left: 8px;
      }
      
      .backup-manager button {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 10px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        cursor: pointer;
        font-size: 0.9em;
        transition: all 0.2s;
      }
      
      .backup-manager button:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .btn-backup:hover {
        background: rgba(76, 175, 80, 0.3) !important;
      }
      
      .btn-restore:hover {
        background: rgba(33, 150, 243, 0.3) !important;
      }
    `;
    document.head.appendChild(style);
  }
}

// Create and export a singleton instance
export const backupManagerUI = new BackupManagerUI();

// Auto-initialize if this is the main module
if (import.meta.url === `file://${new URL(import.meta.url).pathname}`) {
  document.addEventListener('DOMContentLoaded', () => {
    backupManagerUI.mount(document.querySelector('.topbar'));
  });
}
