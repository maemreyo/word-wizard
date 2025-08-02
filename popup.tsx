// Word Wizard Popup Component - AI-powered vocabulary lookup
// Clean React component following separation of concerns

import { useState, useEffect } from "react"
import { 
  useWordWizardActions, 
  useLookupState, 
  useUserState,
  useIntegrationSettings 
} from "./lib/stores"
import type { LookupRequest } from "./lib/types"
import { WordLookupCard } from "./components/word-wizard/word-lookup-card"
import { QuotaIndicator } from "./components/word-wizard/quota-indicator"
import { SaveOptions } from "./components/word-wizard/save-options"

import "./styles/popup.css"

export default function Popup() {
  const [inputText, setInputText] = useState("")
  const [selectedText, setSelectedText] = useState("")
  const [showSaveOptions, setShowSaveOptions] = useState(false)
  
  // Word Wizard stores
  const { 
    lookupWord, 
    clearCurrentLookup,
    setSelectedText: setStoreSelectedText 
  } = useWordWizardActions()
  
  const { 
    currentLookup, 
    isLookingUp, 
    error 
  } = useLookupState()
  
  const { 
    userId, 
    plan, 
    quotaRemaining, 
    quotaLimit 
  } = useUserState()
  
  const { 
    notion, 
    anki, 
    autoSave 
  } = useIntegrationSettings()

  // Get selected text from active tab on popup open
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "GET_SELECTED_TEXT"
        }).then((response) => {
          if (response?.selectedText) {
            const text = response.selectedText.trim()
            setSelectedText(text)
            setInputText(text)
            setStoreSelectedText(text)
          }
        }).catch(() => {
          // No content script or no response, that's ok
        })
      }
    })
  }, [setStoreSelectedText])

  const handleLookup = async () => {
    if (!inputText.trim()) return

    // Check if it's a single word or phrase (optimal for Word Wizard)
    const term = inputText.trim()
    const wordCount = term.split(/\s+/).length
    
    if (wordCount > 5) {
      alert("For best results, please lookup 1-5 words at a time. Use the Side Panel for longer text analysis.")
      return
    }

    const lookupRequest: LookupRequest = {
      term,
      context: selectedText !== term ? selectedText : undefined,
      options: {
        includeImage: plan !== 'free', // Only for paid plans
        includeExamples: true,
        includeWordFamily: true,
        saveToNotion: autoSave && notion.enabled,
        saveToAnki: autoSave && anki.enabled,
        complexityLevel: 'intermediate'
      }
    }

    await lookupWord(lookupRequest)
  }

  const handleOpenSidePanel = () => {
    chrome.runtime.sendMessage({
      type: "OPEN_SIDE_PANEL",
      data: { selectedText: inputText || selectedText }
    })
  }

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  const handleSaveOptions = () => {
    setShowSaveOptions(!showSaveOptions)
  }

  const isQuotaLow = quotaRemaining <= quotaLimit * 0.2 // Less than 20% remaining
  const canLookup = quotaRemaining > 0 || plan !== 'free'

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="header-title">
          <h1>🧙‍♂️ Word Wizard</h1>
          <QuotaIndicator 
            remaining={quotaRemaining}
            limit={quotaLimit}
            plan={plan}
            isLow={isQuotaLow}
          />
        </div>
        <div className="header-actions">
          <button 
            className="icon-button" 
            onClick={handleSaveOptions}
            title="Save Options"
            data-active={showSaveOptions}
          >
            💾
          </button>
          <button 
            className="icon-button" 
            onClick={handleOpenOptions}
            title="Settings"
          >
            ⚙️
          </button>
          <button 
            className="icon-button" 
            onClick={handleOpenSidePanel}
            title="IELTS Mode"
          >
            📚
          </button>
        </div>
      </header>

      <main className="popup-main">
        {selectedText && selectedText !== inputText && (
          <div className="selected-text-info">
            <p className="info-label">📝 Selected from page:</p>
            <p className="selected-text">"{selectedText}"</p>
          </div>
        )}

        <div className="input-section">
          <label htmlFor="input-text" className="input-label">
            🔍 Word or phrase to lookup:
          </label>
          <input
            id="input-text"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter word or phrase..."
            className="input-field"
            disabled={isLookingUp}
            maxLength={100}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canLookup && inputText.trim()) {
                handleLookup()
              }
            }}
          />
          <div className="input-hints">
            💡 Best results with 1-5 words • Press Enter to lookup
          </div>
        </div>

        {showSaveOptions && (
          <SaveOptions
            notionEnabled={notion.enabled}
            ankiEnabled={anki.enabled}
            autoSaveEnabled={autoSave}
            onClose={() => setShowSaveOptions(false)}
          />
        )}

        <div className="actions-section">
          <button
            onClick={handleLookup}
            disabled={!inputText.trim() || isLookingUp || !canLookup}
            className="primary-button lookup-button"
          >
            {isLookingUp ? (
              <>
                <span className="spinner-small"></span>
                Analyzing...
              </>
            ) : !canLookup ? (
              '⚠️ Quota Exceeded'
            ) : (
              '🧙‍♂️ Analyze Word'
            )}
          </button>

          {currentLookup && (
            <button
              onClick={clearCurrentLookup}
              className="secondary-button"
            >
              🗑️ Clear
            </button>
          )}
        </div>

        {error && (
          <div className="error-section">
            <div className="error-message">
              <strong>⚠️ Error:</strong> {error}
              {error.includes('quota') && (
                <button 
                  onClick={handleOpenOptions}
                  className="link-button"
                >
                  Upgrade Plan
                </button>
              )}
            </div>
          </div>
        )}

        {currentLookup && (
          <WordLookupCard 
            wordData={currentLookup}
            onSaveToNotion={() => {/* TODO: Implement manual save */}}
            onSaveToAnki={() => {/* TODO: Implement manual save */}}
            showSaveButtons={!autoSave}
          />
        )}
      </main>

      <footer className="popup-footer">
        <div className="status-info">
          <span className={`status-indicator ${canLookup ? 'success' : 'warning'}`}></span>
          <span className="status-text">
            Word Wizard v2.1.0 • {plan.toUpperCase()} Plan
          </span>
        </div>
        {!userId && (
          <div className="upgrade-hint">
            <button onClick={handleOpenOptions} className="link-button">
              Sign up for more lookups
            </button>
          </div>
        )}
      </footer>
    </div>
  )
}