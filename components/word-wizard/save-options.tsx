// Save Options Component - Configure auto-save settings
// Clean React component following separation of concerns

import React, { useState } from 'react'
import { useWordWizardActions } from '../../lib/stores'

interface SaveOptionsProps {
  notionEnabled: boolean
  ankiEnabled: boolean
  autoSaveEnabled: boolean
  onClose: () => void
}

export function SaveOptions({ 
  notionEnabled, 
  ankiEnabled, 
  autoSaveEnabled,
  onClose 
}: SaveOptionsProps) {
  const [localAutoSave, setLocalAutoSave] = useState(autoSaveEnabled)
  const { updateNotionSettings, updateAnkiSettings, setAutoSave } = useWordWizardActions()

  const handleAutoSaveToggle = () => {
    const newValue = !localAutoSave
    setLocalAutoSave(newValue)
    setAutoSave(newValue)
  }

  const handleNotionToggle = () => {
    updateNotionSettings(!notionEnabled)
  }

  const handleAnkiToggle = () => {
    updateAnkiSettings(!ankiEnabled)
  }

  const handleOpenSettings = () => {
    chrome.runtime.openOptionsPage()
    onClose()
  }

  return (
    <div className="save-options-panel">
      <div className="save-options-header">
        <h4>💾 Save Options</h4>
        <button onClick={onClose} className="close-button">✕</button>
      </div>

      <div className="save-options-content">
        {/* Auto-save toggle */}
        <div className="option-row">
          <div className="option-info">
            <span className="option-label">🔄 Auto-save</span>
            <span className="option-description">
              Automatically save looked up words
            </span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={localAutoSave}
              onChange={handleAutoSaveToggle}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Notion integration */}
        <div className="option-row">
          <div className="option-info">
            <span className="option-label">📝 Notion</span>
            <span className="option-description">
              {notionEnabled ? 'Connected' : 'Not configured'}
            </span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notionEnabled}
              onChange={handleNotionToggle}
              disabled={!notionEnabled} // Prevent toggle if not properly configured
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Anki integration */}
        <div className="option-row">
          <div className="option-info">
            <span className="option-label">🧠 Anki</span>
            <span className="option-description">
              {ankiEnabled ? 'Connected' : 'Not configured'}
            </span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={ankiEnabled}
              onChange={handleAnkiToggle}
              disabled={!ankiEnabled} // Prevent toggle if not properly configured
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Configuration hint */}
        {(!notionEnabled && !ankiEnabled) && (
          <div className="config-hint">
            <p>⚙️ Configure integrations in Settings</p>
            <button onClick={handleOpenSettings} className="config-button">
              Open Settings
            </button>
          </div>
        )}

        {/* Save behavior explanation */}
        <div className="save-behavior-info">
          <h5>How it works:</h5>
          <ul>
            <li>
              <strong>Auto-save ON:</strong> Words are saved immediately after lookup
            </li>
            <li>
              <strong>Auto-save OFF:</strong> Manual save buttons will appear
            </li>
            <li>
              <strong>Integrations:</strong> Must be configured in Settings first
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// CSS styles for the component
const styles = `
.save-options-panel {
  background: var(--panel-bg, #ffffff);
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin: 12px 0;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.save-options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--header-bg, #f9fafb);
  border-bottom: 1px solid var(--border-light, #f3f4f6);
}

.save-options-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color, #374151);
}

.close-button {
  background: none;
  border: none;
  font-size: 14px;
  color: var(--secondary-text, #6b7280);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background: var(--hover-bg, #f3f4f6);
  color: var(--text-color, #374151);
}

.save-options-content {
  padding: 16px;
}

.option-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light, #f3f4f6);
}

.option-row:last-of-type {
  border-bottom: none;
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.option-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color, #374151);
}

.option-description {
  font-size: 12px;
  color: var(--secondary-text, #6b7280);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--toggle-off, #cbd5e1);
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: var(--toggle-on, #10b981);
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--toggle-on, #10b981);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

input:disabled + .slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.config-hint {
  margin-top: 16px;
  padding: 12px;
  background: var(--hint-bg, #f8fafc);
  border: 1px solid var(--hint-border, #e2e8f0);
  border-radius: 6px;
  text-align: center;
}

.config-hint p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--secondary-text, #6b7280);
}

.config-button {
  background: var(--primary-color, #2563eb);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.config-button:hover {
  background: var(--primary-hover, #1d4ed8);
}

.save-behavior-info {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light, #f3f4f6);
}

.save-behavior-info h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color, #374151);
}

.save-behavior-info ul {
  margin: 0;
  padding-left: 16px;
  font-size: 11px;
  color: var(--secondary-text, #6b7280);
  line-height: 1.4;
}

.save-behavior-info li {
  margin-bottom: 4px;
}

.save-behavior-info strong {
  color: var(--text-color, #374151);
}
`