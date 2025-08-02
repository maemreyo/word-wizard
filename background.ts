// Word Wizard Background Script - Message router and extension lifecycle management
// This is the main background script that acts as a message router
// Following clean architecture: ONLY routing, NO business logic

import { handleFeatureMessage } from "./lib/background/feature-handler"
import { handleApiMessage } from "./lib/background/api-handler"
import { handleStorageMessage } from "./lib/background/storage-handler"
import { handleWordWizardMessage } from "./lib/background/word-wizard-handler"

console.log("🧙‍♂️ Word Wizard background script loaded")

// Context menu setup for Word Wizard
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "word-wizard-lookup",
    title: "🧙‍♂️ Lookup with Word Wizard",
    contexts: ["selection"]
  })
  
  chrome.contextMenus.create({
    id: "word-wizard-sidepanel",
    title: "📚 Open IELTS Study Mode",
    contexts: ["page"]
  })
})

// Context menu handler for Word Wizard
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "word-wizard-lookup" && info.selectionText && tab?.id) {
    // Send selected text to Word Wizard popup
    chrome.action.openPopup()
    
    // Store selected text for popup to retrieve
    chrome.storage.local.set({
      'word-wizard-selected-text': {
        text: info.selectionText,
        timestamp: Date.now(),
        url: tab.url,
        title: tab.title
      }
    })
  } else if (info.menuItemId === "word-wizard-sidepanel" && tab?.id) {
    // Open IELTS Study Mode (sidepanel)
    chrome.sidePanel.open({ tabId: tab.id })
  }
})

// Word Wizard keyboard shortcuts
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "lookup-word" && tab?.id) {
    // Quick lookup shortcut
    chrome.tabs.sendMessage(tab.id, {
      type: "WORD_WIZARD_GET_SELECTION"
    })
  } else if (command === "open-sidepanel" && tab?.id) {
    // Open IELTS Study Mode shortcut
    chrome.sidePanel.open({ tabId: tab.id })
  }
})

// Message router - ONLY routing logic, NO business logic
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message.type)

  switch (message.type) {
    // Word Wizard specific messages
    case "WORD_WIZARD_LOOKUP":
    case "WORD_WIZARD_BATCH_PROCESS":
    case "WORD_WIZARD_SAVE_TO_NOTION":
    case "WORD_WIZARD_SAVE_TO_ANKI":
    case "WORD_WIZARD_GET_HISTORY":
    case "WORD_WIZARD_UPDATE_SETTINGS":
    case "TEST_NOTION_CONNECTION":
    case "TEST_ANKI_CONNECTION":
      handleWordWizardMessage(message, sender, sendResponse)
      return true // Keep message channel open for async response

    // Legacy handlers (maintaining backward compatibility)
    case "PROCESS_FEATURE":
      handleFeatureMessage(message.data, sendResponse)
      return true

    case "API_CALL":
      handleApiMessage(message.endpoint, message.data, sendResponse)
      return true

    case "STORAGE_OPERATION":
      handleStorageMessage(message.operation, message.key, message.value, sendResponse)
      return true

    case "OPEN_SIDE_PANEL":
      handleSidePanelOpen(message, sender)
      break

    case "GET_CONFIG":
      // Simple sync response for configuration
      sendResponse({
        success: true,
        data: {
          version: chrome.runtime.getManifest().version,
          environment: process.env.NODE_ENV || 'development',
          isWordWizard: true
        }
      })
      break

    default:
      console.warn("Unknown message type:", message.type)
      sendResponse({
        success: false,
        error: `Unknown message type: ${message.type}`
      })
  }
})

// Side panel handler - enhanced for Word Wizard
function handleSidePanelOpen(message: any, sender: chrome.runtime.MessageSender) {
  if (sender.tab?.id) {
    // Called from content script - use the tab ID
    chrome.sidePanel.open({ tabId: sender.tab.id })
    
    // If there's selectedText, store it for sidepanel to retrieve
    if (message.data?.selectedText) {
      chrome.storage.local.set({
        'word-wizard-sidepanel-data': {
          selectedText: message.data.selectedText,
          timestamp: Date.now(),
          url: sender.tab.url,
          title: sender.tab.title
        }
      })
    }
  } else {
    // Called from popup or other extension context - get active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.sidePanel.open({ tabId: tabs[0].id })
        
        // If there's selectedText, store it
        if (message.data?.selectedText) {
          chrome.storage.local.set({
            'word-wizard-sidepanel-data': {
              selectedText: message.data.selectedText,
              timestamp: Date.now(),
              url: tabs[0].url,
              title: tabs[0].title
            }
          })
        }
      }
    })
  }
}

// Handle extension startup - initialize Word Wizard
chrome.runtime.onStartup.addListener(() => {
  console.log("🧙‍♂️ Word Wizard extension started")
  
  // Initialize Word Wizard defaults if needed
  chrome.storage.local.get(['word-wizard-initialized'], (result) => {
    if (!result['word-wizard-initialized']) {
      chrome.storage.local.set({
        'word-wizard-initialized': true,
        'word-wizard-user-settings': {
          theme: 'light',
          language: 'en',
          notifications: true,
          defaultComplexity: 'intermediate'
        },
        'word-wizard-integration-settings': {
          autoSave: false,
          notion: { enabled: false },
          anki: { enabled: false, port: 8765 }
        }
      })
    }
  })
})

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log("🧙‍♂️ Word Wizard installed for the first time")
    // Open welcome/onboarding page
    chrome.tabs.create({
      url: chrome.runtime.getURL('options.html') + '?welcome=true'
    })
  } else if (details.reason === 'update') {
    console.log("🧙‍♂️ Word Wizard updated to version", chrome.runtime.getManifest().version)
  }
})

// Handle extension suspend (cleanup)
chrome.runtime.onSuspend.addListener(() => {
  console.log("🧙‍♂️ Word Wizard extension suspending")
  // Clean up any temporary data
  chrome.storage.local.remove([
    'word-wizard-selected-text',
    'word-wizard-sidepanel-data'
  ])
})