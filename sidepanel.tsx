// Word Wizard Side Panel - IELTS Study Mode with batch processing
// Advanced vocabulary learning features for serious students

import React, { useState, useEffect } from "react"
import { 
  useWordWizardActions, 
  useLookupState, 
  useBatchState,
  useLearningState,
  useUserState 
} from "./lib/stores"
import { WordLookupCard } from "./components/word-wizard/word-lookup-card"
import { IELTSBatchProcessor } from "./components/word-wizard/ielts-batch-processor"
import { VocabularyHistory } from "./components/word-wizard/vocabulary-history"
import { LearningStats } from "./components/word-wizard/learning-stats"
import { QuotaIndicator } from "./components/word-wizard/quota-indicator"

import "./styles/sidepanel.css"

export default function SidePanel() {
  const [activeTab, setActiveTab] = useState<'ielts' | 'lookup' | 'history' | 'stats'>('ielts')
  const [selectedText, setSelectedText] = useState("")

  // Word Wizard stores
  const { 
    lookupWord, 
    processBatch,
    clearCurrentLookup,
    clearBatch 
  } = useWordWizardActions()

  const { 
    currentLookup, 
    isLookingUp, 
    error: lookupError 
  } = useLookupState()

  const {
    words: batchWords,
    results: batchResults,
    isProcessing: isBatchProcessing,
    error: batchError
  } = useBatchState()

  const {
    history: vocabularyHistory,
    stats: learningStats
  } = useLearningState()

  const {
    plan,
    quotaRemaining,
    quotaLimit
  } = useUserState()

  // Listen for messages from popup and background script
  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.type === "OPEN_SIDE_PANEL" && message.data?.selectedText) {
        setSelectedText(message.data.selectedText)
        setActiveTab('lookup')
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)
    return () => chrome.runtime.onMessage.removeListener(messageListener)
  }, [])

  const canUseBatch = plan !== 'free' // Batch processing is premium feature

  const renderIELTSTab = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h3>📚 IELTS Vocabulary Mode</h3>
        <p className="tab-description">
          Batch process 5-25 words for comprehensive synonym analysis
        </p>
      </div>

      <IELTSBatchProcessor
        disabled={!canUseBatch}
        onUpgradeNeeded={() => chrome.runtime.openOptionsPage()}
        quotaRemaining={quotaRemaining}
      />

      {batchResults.length > 0 && (
        <div className="batch-results">
          <div className="results-header">
            <h4>📊 Batch Results ({batchResults.length})</h4>
            <button onClick={clearBatch} className="secondary-button">
              Clear Results
            </button>
          </div>
          <div className="results-grid">
            {batchResults.map((result, index) => (
              <div key={index} className="batch-result-item">
                {result.synonyms.source !== 'error' ? (
                  <WordLookupCard 
                    wordData={result.synonyms}
                    compact={true}
                  />
                ) : (
                  <div className="error-card">
                    <h5>{result.word}</h5>
                    <p className="error-text">{result.synonyms.definition}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderLookupTab = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h3>🔍 Individual Word Lookup</h3>
        <p className="tab-description">
          Detailed analysis of single words or phrases
        </p>
      </div>

      {selectedText && (
        <div className="selected-text-section">
          <label>📝 Text from page:</label>
          <div className="selected-text-display">"{selectedText}"</div>
          <button 
            onClick={() => lookupWord({ term: selectedText })}
            disabled={isLookingUp}
            className="primary-button"
          >
            {isLookingUp ? '🧙‍♂️ Analyzing...' : '🧙‍♂️ Analyze This Text'}
          </button>
        </div>
      )}

      {lookupError && (
        <div className="error-section">
          <div className="error-message">
            <strong>⚠️ Error:</strong> {lookupError}
          </div>
        </div>
      )}

      {currentLookup && (
        <div className="lookup-result">
          <WordLookupCard 
            wordData={currentLookup}
            showSaveButtons={true}
            onSaveToNotion={() => {/* TODO: Implement manual save */}}
            onSaveToAnki={() => {/* TODO: Implement manual save */}}
          />
        </div>
      )}

      {!selectedText && !currentLookup && (
        <div className="lookup-hint">
          <p>💡 Select text on any webpage and click the Word Wizard icon, or use the popup for quick lookups.</p>
        </div>
      )}
    </div>
  )

  const renderHistoryTab = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h3>📚 Vocabulary History</h3>
        <p className="tab-description">
          Your learning progress and word collection
        </p>
      </div>

      <VocabularyHistory 
        history={vocabularyHistory.map((wordData, index) => ({
          id: `vocab_${wordData.timestamp}_${index}`,
          term: wordData.term,
          definition: wordData.definition,
          timestamp: new Date(wordData.timestamp),
          lookupCount: 1,
          lastViewed: new Date(wordData.timestamp),
          mastered: false,
          difficulty: 'medium' as const,
          source: 'sidepanel' as const
        }))}
        onWordClick={(word) => lookupWord({ term: word.term })}
        onExport={() => {/* TODO: Implement export */}}
        onClear={() => {/* TODO: Implement clear */}}
      />
    </div>
  )

  const renderStatsTab = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h3>📊 Learning Analytics</h3>
        <p className="tab-description">
          Track your vocabulary learning progress
        </p>
      </div>

      <LearningStats 
        stats={{
          totalWords: learningStats.totalWords,
          masteredWords: learningStats.masteredWords,
          wordsThisWeek: learningStats.weeklyProgress,
          wordsThisMonth: learningStats.weeklyProgress * 4,
          averageDaily: Math.round(learningStats.weeklyProgress / 7),
          longestStreak: learningStats.currentStreak,
          currentStreak: learningStats.currentStreak,
          difficultyBreakdown: {
            easy: 0,
            medium: 0,
            hard: 0
          },
          topicsBreakdown: {},
          dailyProgress: [],
          weeklyGoal: 50,
          monthlyGoal: 200
        }}
        quotaStatus={{ remaining: quotaRemaining, limit: quotaLimit, plan }}
      />
    </div>
  )

  return (
    <div className="sidepanel-container word-wizard-sidepanel">
      <header className="sidepanel-header">
        <div className="header-content">
          <h1>🧙‍♂️ Word Wizard</h1>
          <QuotaIndicator 
            remaining={quotaRemaining}
            limit={quotaLimit}
            plan={plan}
            compact={true}
          />
        </div>
        <div className="header-subtitle">IELTS Study Mode</div>
      </header>

      <nav className="sidepanel-nav">
        <button
          className={`nav-button ${activeTab === 'ielts' ? 'active' : ''}`}
          onClick={() => setActiveTab('ielts')}
          title="Batch process words for IELTS preparation"
        >
          📚 IELTS
          {!canUseBatch && <span className="premium-badge">PRO</span>}
        </button>
        <button
          className={`nav-button ${activeTab === 'lookup' ? 'active' : ''}`}
          onClick={() => setActiveTab('lookup')}
          title="Individual word analysis"
        >
          🔍 Lookup
        </button>
        <button
          className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          title="Your vocabulary collection"
        >
          📚 History
          <span className="count-badge">{vocabularyHistory.length}</span>
        </button>
        <button
          className={`nav-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
          title="Learning progress and statistics"
        >
          📊 Stats
        </button>
      </nav>

      <main className="sidepanel-main">
        {activeTab === 'ielts' && renderIELTSTab()}
        {activeTab === 'lookup' && renderLookupTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'stats' && renderStatsTab()}
      </main>
    </div>
  )
}