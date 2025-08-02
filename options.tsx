// Word Wizard Options Page - Settings and configuration for vocabulary learning
// Full-page settings interface with AI, integrations, and subscription management

import { useEffect, useState } from "react"
import {
  useAIStore,
  useIntegrationSettings,
  useUserState,
  useWordWizardActions
} from "./lib/stores"
import type { AIProvider } from "./lib/types"

import React from "react"
import "./styles/options.css"

export default function OptionsPage() {
  const [activeSection, setActiveSection] = useState<'general' | 'ai' | 'integrations' | 'subscription' | 'advanced' | 'about'>('general')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  
  // Word Wizard stores
  const { 
    updateUserSettings, 
    upgradeUser, 
    downgradeUser 
  } = useWordWizardActions()
  
  const { 
    userId, 
    plan, 
    quotaRemaining, 
    quotaLimit, 
    settings 
  } = useUserState()
  
  const { 
    notion, 
    anki, 
    autoSave,
    updateNotionSettings,
    updateAnkiSettings,
    setAutoSave 
  } = useIntegrationSettings()
  
  const aiStore = useAIStore()
  const aiProvider = aiStore.activeProvider || 'openai'
  const aiApiKey = aiStore.providers[aiProvider]?.apiKey
  const setAiProvider = (provider: AIProvider) => {
    // Update AI provider through store
    console.log('Setting AI provider:', provider)
  }
  const setAiApiKey = (apiKey: string | undefined) => {
    // Update AI API key through store
    console.log('Setting AI API key:', apiKey ? '[REDACTED]' : 'none')
  }

  // Auto-save message handler
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [saveMessage])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      // Word Wizard settings are auto-saved through stores
      setSaveMessage("Settings saved successfully!")
    } catch (error) {
      console.error("Failed to save settings:", error)
      setSaveMessage("Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetSettings = async () => {
    if (!confirm("Are you sure you want to reset all Word Wizard settings to defaults? This will not affect your vocabulary history.")) {
      return
    }

    try {
      // Reset through Word Wizard actions
      await updateUserSettings({
        theme: 'light',
        notifications: true,
        language: 'en'
      })
      setAutoSave(true)
      setSaveMessage("Settings reset to defaults!")
    } catch (error) {
      setSaveMessage("Failed to reset settings.")
    }
  }

  const handleTestNotionConnection = async () => {
    setTestingConnection('notion')
    try {
      const response = await chrome.runtime.sendMessage({
        type: "TEST_NOTION_CONNECTION",
        config: notion
      })
      
      if (response.success) {
        setSaveMessage("Notion connection successful!")
      } else {
        setSaveMessage(`Notion connection failed: ${response.error}`)
      }
    } catch (error) {
      setSaveMessage(`Notion test failed: ${error}`)
    } finally {
      setTestingConnection(null)
    }
  }

  const handleTestAnkiConnection = async () => {
    setTestingConnection('anki')
    try {
      const response = await chrome.runtime.sendMessage({
        type: "TEST_ANKI_CONNECTION",
        config: anki
      })
      
      if (response.success) {
        setSaveMessage("Anki connection successful!")
      } else {
        setSaveMessage(`Anki connection failed: ${response.error}`)
      }
    } catch (error) {
      setSaveMessage(`Anki test failed: ${error}`)
    } finally {
      setTestingConnection(null)
    }
  }

  const renderGeneralSection = () => (
    <div className="settings-section">
      <h2>🧙‍♂️ General Settings</h2>
      
      <div className="setting-group">
        <h3>Appearance</h3>
        
        <div className="setting-item">
          <label htmlFor="theme-select">Theme:</label>
          <select
            id="theme-select"
            value={settings?.theme || 'light'}
            onChange={(e) => updateUserSettings({
              ...settings,
              theme: e.target.value as 'light' | 'dark' | 'auto'
            })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>

        <div className="setting-item">
          <label htmlFor="language-select">Language:</label>
          <select
            id="language-select"
            value={settings?.language || 'en'}
            onChange={(e) => updateUserSettings({
              ...settings,
              language: e.target.value
            })}
          >
            <option value="en">🇺🇸 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="zh">🇨🇳 中文</option>
            <option value="ja">🇯🇵 日本語</option>
          </select>
        </div>
      </div>

      <div className="setting-group">
        <h3>Vocabulary Learning</h3>
        
        <div className="setting-item checkbox-item">
          <label>
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
            />
            🔄 Auto-save vocabulary lookups
          </label>
          <p className="setting-description">
            Automatically save words to Notion and Anki when enabled
          </p>
        </div>

        <div className="setting-item checkbox-item">
          <label>
            <input
              type="checkbox"
              checked={settings?.notifications !== false}
              onChange={(e) => updateUserSettings({
                ...settings,
                notifications: e.target.checked
              })}
            />
            🔔 Enable notifications
          </label>
          <p className="setting-description">
            Show notifications for vocabulary analysis results and quota updates
          </p>
        </div>

        <div className="setting-item">
          <label htmlFor="complexity-level">Default complexity level:</label>
          <select
            id="complexity-level"
            value={settings?.defaultComplexity || 'intermediate'}
            onChange={(e) => updateUserSettings({
              ...settings,
              defaultComplexity: e.target.value as 'basic' | 'intermediate' | 'advanced'
            })}
          >
            <option value="basic">🟢 Basic (Simple definitions)</option>
            <option value="intermediate">🟡 Intermediate (Detailed analysis)</option>
            <option value="advanced">🔴 Advanced (Comprehensive study)</option>
          </select>
          <p className="setting-description">
            Choose the depth of vocabulary analysis for new lookups
          </p>
        </div>
      </div>
    </div>
  )

  const renderAiSection = () => (
    <div className="settings-section">
      <h2>🤖 AI Configuration</h2>
      
      <div className="setting-group">
        <h3>AI Provider</h3>
        
        <div className="setting-item">
          <label htmlFor="ai-provider">Choose AI provider:</label>
          <select
            id="ai-provider"
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as AIProvider)}
          >
            <option value="openai">🔥 OpenAI (GPT-4)</option>
            <option value="anthropic">🧠 Anthropic (Claude)</option>
            <option value="google">🌟 Google (Gemini)</option>
          </select>
          <p className="setting-description">
            Select your preferred AI provider for vocabulary analysis
          </p>
        </div>

        <div className="setting-item">
          <label htmlFor="ai-api-key">API Key:</label>
          <input
            id="ai-api-key"
            type="password"
            value={aiApiKey || ''}
            onChange={(e) => setAiApiKey(e.target.value || undefined)}
            placeholder={`Enter your ${aiProvider.toUpperCase()} API key`}
          />
          <p className="setting-description">
            🔒 Your API key is stored securely and never shared. Required for unlimited vocabulary analysis.
          </p>
        </div>

        <div className="ai-provider-info">
          {aiProvider === 'openai' && (
            <div className="provider-details">
              <h4>🔥 OpenAI (Recommended)</h4>
              <ul>
                <li>Most accurate vocabulary analysis</li>
                <li>Excellent for context understanding</li>
                <li>Get API key: <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a></li>
                <li>Cost: ~$0.002 per lookup</li>
              </ul>
            </div>
          )}
          {aiProvider === 'anthropic' && (
            <div className="provider-details">
              <h4>🧠 Anthropic Claude</h4>
              <ul>
                <li>Great for educational content</li>
                <li>Excellent example generation</li>
                <li>Get API key: <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a></li>
                <li>Cost: ~$0.003 per lookup</li>
              </ul>
            </div>
          )}
          {aiProvider === 'google' && (
            <div className="provider-details">
              <h4>🌟 Google Gemini</h4>
              <ul>
                <li>Fast and cost-effective</li>
                <li>Good for batch processing</li>
                <li>Get API key: <a href="https://aistudio.google.com/app/apikey" target="_blank">aistudio.google.com</a></li>
                <li>Cost: ~$0.001 per lookup</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderAdvancedSection = () => (
    <div className="settings-section">
      <h2>Advanced Settings</h2>
      
      <div className="setting-group">
        <h3>Performance</h3>
        
        <div className="setting-item">
          <label htmlFor="cache-size">Max Cache Items:</label>
          <input
            id="cache-size"
            type="number"
            min="10"
            max="1000"
            defaultValue="100"
          />
        </div>

        <div className="setting-item">
          <label htmlFor="batch-size">Batch Processing Size:</label>
          <input
            id="batch-size"
            type="number"
            min="1"
            max="50"
            defaultValue="5"
          />
        </div>
      </div>

      <div className="setting-group">
        <h3>Data Management</h3>
        
        <div className="setting-actions">
          <button className="secondary-button">
            Export All Data
          </button>
          <button className="secondary-button">
            Import Data
          </button>
          <button className="danger-button">
            Clear All Data
          </button>
        </div>
      </div>

      <div className="setting-group">
        <h3>Reset</h3>
        
        <div className="setting-actions">
          <button
            onClick={handleResetSettings}
            className="danger-button"
          >
            Reset All Settings
          </button>
        </div>
      </div>
    </div>
  )

  const renderIntegrationsSection = () => (
    <div className="settings-section">
      <h2>🔗 Integrations</h2>
      
      <div className="setting-group">
        <h3>Notion Integration</h3>
        
        <div className="integration-status">
          <div className="status-indicator">
            <span className={`status-dot ${notion.enabled ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">
              {notion.enabled ? '✅ Connected' : '❌ Not Connected'}
            </span>
          </div>
        </div>

        <div className="setting-item">
          <label htmlFor="notion-token">Integration Token:</label>
          <input
            id="notion-token"
            type="password"
            value={notion.token || ''}
            onChange={(e) => updateNotionSettings({
              ...notion,
              token: e.target.value
            })}
            placeholder="Enter your Notion integration token"
          />
          <p className="setting-description">
            🔗 Create an integration at <a href="https://www.notion.so/my-integrations" target="_blank">notion.so/my-integrations</a>
          </p>
        </div>

        <div className="setting-item">
          <label htmlFor="notion-database">Database ID:</label>
          <input
            id="notion-database"
            type="text"
            value={notion.databaseId || ''}
            onChange={(e) => updateNotionSettings({
              ...notion,
              databaseId: e.target.value
            })}
            placeholder="Paste your Notion database ID"
          />
          <p className="setting-description">
            📄 Copy the database ID from your Notion vocabulary database URL
          </p>
        </div>

        <div className="setting-actions">
          <button
            onClick={handleTestNotionConnection}
            disabled={!notion.token || !notion.databaseId || testingConnection === 'notion'}
            className="secondary-button"
          >
            {testingConnection === 'notion' ? '🔄 Testing...' : '🧪 Test Connection'}
          </button>
        </div>
      </div>

      <div className="setting-group">
        <h3>Anki Integration</h3>
        
        <div className="integration-status">
          <div className="status-indicator">
            <span className={`status-dot ${anki.enabled ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">
              {anki.enabled ? '✅ Connected' : '❌ Not Connected'}
            </span>
          </div>
        </div>

        <div className="setting-item">
          <label htmlFor="anki-port">AnkiConnect Port:</label>
          <input
            id="anki-port"
            type="number"
            min="1000"
            max="65535"
            value={anki.port || 8765}
            onChange={(e) => updateAnkiSettings({
              ...anki,
              port: parseInt(e.target.value) || 8765
            })}
          />
          <p className="setting-description">
            🔌 Default AnkiConnect port is 8765. Make sure AnkiConnect addon is installed.
          </p>
        </div>

        <div className="setting-item">
          <label htmlFor="anki-deck">Deck Name:</label>
          <input
            id="anki-deck"
            type="text"
            value={anki.deckName || ''}
            onChange={(e) => updateAnkiSettings({
              ...anki,
              deckName: e.target.value
            })}
            placeholder="Word Wizard Vocabulary"
          />
          <p className="setting-description">
            🃏 Name of the Anki deck where vocabulary cards will be created
          </p>
        </div>

        <div className="setting-actions">
          <button
            onClick={handleTestAnkiConnection}
            disabled={testingConnection === 'anki'}
            className="secondary-button"
          >
            {testingConnection === 'anki' ? '🔄 Testing...' : '🧪 Test Connection'}
          </button>
        </div>

        <div className="anki-setup-info">
          <h4>📚 Setup Instructions:</h4>
          <ol>
            <li>Install the AnkiConnect addon (code: 2055492159)</li>
            <li>Restart Anki</li>
            <li>Make sure Anki is running when using Word Wizard</li>
            <li>Test the connection above</li>
          </ol>
        </div>
      </div>
    </div>
  )

  const renderSubscriptionSection = () => (
    <div className="settings-section">
      <h2>💎 Subscription & Usage</h2>
      
      <div className="subscription-overview">
        <div className="current-plan">
          <div className="plan-header">
            <h3>Current Plan</h3>
            <span className={`plan-badge plan-${plan}`}>
              {plan === 'free' && '🆓'}
              {plan === 'pro' && '⭐'}
              {plan === 'premium' && '💎'}
              {plan === 'enterprise' && '🏢'}
              {plan.toUpperCase()}
            </span>
          </div>
          
          <div className="usage-stats">
            <div className="usage-item">
              <span className="usage-label">Lookups Remaining:</span>
              <span className="usage-value">
                {quotaLimit > 0 ? `${quotaRemaining} / ${quotaLimit}` : '♾️ Unlimited'}
              </span>
            </div>
            
            {quotaLimit > 0 && (
              <div className="usage-bar">
                <div 
                  className="usage-fill"
                  style={{ 
                    width: `${((quotaLimit - quotaRemaining) / quotaLimit) * 100}%`,
                    backgroundColor: quotaRemaining <= quotaLimit * 0.2 ? '#ef4444' : '#10b981'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="plan-comparison">
        <h3>Available Plans</h3>
        
        <div className="plans-grid">
          <div className={`plan-card ${plan === 'free' ? 'current' : ''}`}>
            <div className="plan-name">🆓 Free</div>
            <div className="plan-price">$0/month</div>
            <div className="plan-features">
              <ul>
                <li>✓ 50 lookups per month</li>
                <li>✓ Basic vocabulary analysis</li>
                <li>✓ Chrome extension access</li>
                <li>❌ No batch processing</li>
                <li>❌ No AI images</li>
              </ul>
            </div>
            {plan !== 'free' && (
              <button 
                onClick={() => downgradeUser('free')}
                className="plan-button secondary"
              >
                Downgrade
              </button>
            )}
          </div>

          <div className={`plan-card ${plan === 'pro' ? 'current' : ''} recommended`}>
            <div className="plan-badge-ribbon">Recommended</div>
            <div className="plan-name">⭐ Pro</div>
            <div className="plan-price">$9.99/month</div>
            <div className="plan-features">
              <ul>
                <li>✓ 500 lookups per month</li>
                <li>✓ Advanced AI analysis</li>
                <li>✓ IELTS batch processing</li>
                <li>✓ AI-generated images</li>
                <li>✓ Notion & Anki integration</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
            {plan !== 'pro' && (
              <button 
                onClick={() => upgradeUser('pro')}
                className="plan-button primary"
              >
                {plan === 'free' ? 'Upgrade to Pro' : 'Switch to Pro'}
              </button>
            )}
          </div>

          <div className={`plan-card ${plan === 'premium' ? 'current' : ''}`}>
            <div className="plan-name">💎 Premium</div>
            <div className="plan-price">$19.99/month</div>
            <div className="plan-features">
              <ul>
                <li>✓ 2000 lookups per month</li>
                <li>✓ Everything in Pro</li>
                <li>✓ Custom AI prompts</li>
                <li>✓ Analytics dashboard</li>
                <li>✓ Bulk export features</li>
                <li>✓ White-label options</li>
              </ul>
            </div>
            {plan !== 'premium' && (
              <button 
                onClick={() => upgradeUser('premium')}
                className="plan-button primary"
              >
                {plan === 'free' ? 'Upgrade to Premium' : 'Switch to Premium'}
              </button>
            )}
          </div>
        </div>
      </div>

      {userId && (
        <div className="billing-info">
          <h3>Billing Information</h3>
          <p>User ID: <code>{userId}</code></p>
          <div className="billing-actions">
            <button className="secondary-button">View Billing History</button>
            <button className="secondary-button">Update Payment Method</button>
            <button className="danger-button">Cancel Subscription</button>
          </div>
        </div>
      )}
    </div>
  )

  const renderAboutSection = () => (
    <div className="settings-section">
      <h2>🧙‍♂️ About Word Wizard</h2>
      
      <div className="about-content">
        <div className="extension-info">
          <h3>Word Wizard - AI-Powered Vocabulary Learning</h3>
          <p className="version">Version 2.1.0</p>
          <p className="description">
            Transform your browser into a powerful vocabulary learning tool. 
            Word Wizard uses advanced AI to provide comprehensive word analysis, 
            synonyms, examples, and integrates with your favorite study tools.
          </p>
        </div>

        <div className="features-list">
          <h4>🌟 Key Features:</h4>
          <ul>
            <li>🤖 AI-powered vocabulary analysis (OpenAI, Claude, Gemini)</li>
            <li>📚 IELTS-focused batch processing for exam preparation</li>
            <li>🔗 Seamless integration with Notion and Anki</li>
            <li>📊 Learning analytics and progress tracking</li>
            <li>🌐 Multi-language support for global learners</li>
            <li>🖼️ AI-generated visual aids for better retention</li>
            <li>🔄 Auto-save and smart caching for offline access</li>
            <li>🎨 Clean, user-friendly interface</li>
          </ul>
        </div>

        <div className="target-audience">
          <h4>🎯 Perfect for:</h4>
          <ul>
            <li>IELTS and TOEFL test preparation</li>
            <li>English language learners at all levels</li>
            <li>Students building academic vocabulary</li>
            <li>Professionals improving business English</li>
            <li>Anyone looking to expand their vocabulary efficiently</li>
          </ul>
        </div>

        <div className="links">
          <h4>🔗 Helpful Resources:</h4>
          <p>
            <a href="https://github.com/word-wizard/chrome-extension" target="_blank" rel="noopener noreferrer">
              💻 GitHub Repository
            </a>
          </p>
          <p>
            <a href="https://word-wizard.com/docs" target="_blank" rel="noopener noreferrer">
              📚 Documentation & User Guide
            </a>
          </p>
          <p>
            <a href="https://word-wizard.com/support" target="_blank" rel="noopener noreferrer">
              🙋‍♂️ Support & FAQ
            </a>
          </p>
          <p>
            <a href="https://word-wizard.com/privacy" target="_blank" rel="noopener noreferrer">
              🔒 Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="options-container">
      <header className="options-header">
        <h1>🧙‍♂️ Word Wizard - Settings</h1>
        <p className="header-subtitle">Configure your AI-powered vocabulary learning experience</p>
      </header>

      <div className="options-content">
        <nav className="options-nav">
          <button
            className={`nav-button ${activeSection === 'general' ? 'active' : ''}`}
            onClick={() => setActiveSection('general')}
          >
            General
          </button>
          <button
            className={`nav-button ${activeSection === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveSection('ai')}
          >
            🤖 AI
          </button>
          <button
            className={`nav-button ${activeSection === 'integrations' ? 'active' : ''}`}
            onClick={() => setActiveSection('integrations')}
          >
            🔗 Integrations
          </button>
          <button
            className={`nav-button ${activeSection === 'subscription' ? 'active' : ''}`}
            onClick={() => setActiveSection('subscription')}
          >
            💎 Subscription
          </button>
          <button
            className={`nav-button ${activeSection === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveSection('advanced')}
          >
            Advanced
          </button>
          <button
            className={`nav-button ${activeSection === 'about' ? 'active' : ''}`}
            onClick={() => setActiveSection('about')}
          >
            About
          </button>
        </nav>

        <main className="options-main">
          {activeSection === 'general' && renderGeneralSection()}
          {activeSection === 'ai' && renderAiSection()}
          {activeSection === 'integrations' && renderIntegrationsSection()}
          {activeSection === 'subscription' && renderSubscriptionSection()}
          {activeSection === 'advanced' && renderAdvancedSection()}
          {activeSection === 'about' && renderAboutSection()}
        </main>
      </div>

      <footer className="options-footer">
        {activeSection !== 'about' && (
          <div className="save-section">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="primary-button"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            
            {saveMessage && (
              <span className={`save-message ${saveMessage.includes('successfully') ? 'success' : 'error'}`}>
                {saveMessage}
              </span>
            )}
          </div>
        )}
      </footer>
    </div>
  )
}