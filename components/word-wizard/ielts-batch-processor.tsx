// IELTS Batch Processor Component - Process multiple words for comprehensive analysis
// Clean React component following separation of concerns

import React, { useState } from 'react'
import { useBatchState, useWordWizardActions } from '../../lib/stores'

interface IELTSBatchProcessorProps {
  disabled?: boolean
  onUpgradeNeeded?: () => void
  quotaRemaining: number
}

export function IELTSBatchProcessor({ 
  disabled = false, 
  onUpgradeNeeded,
  quotaRemaining 
}: IELTSBatchProcessorProps) {
  const [inputWords, setInputWords] = useState('')
  const [processingMode, setProcessingMode] = useState<'synonyms' | 'comprehensive'>('synonyms')
  
  const { processBatch, clearBatch } = useWordWizardActions()
  const { 
    words: batchWords,
    isProcessing,
    error: batchError
  } = useBatchState()

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputWords(e.target.value)
  }

  const parseWords = (input: string): string[] => {
    // Smart word parsing - handles comma-separated, line-separated, or space-separated
    return input
      .split(/[,\n\r\s]+/)
      .map(word => word.trim())
      .filter(word => word.length > 0)
      .slice(0, 25) // Max 25 words for batch processing
  }

  const handleStartBatch = async () => {
    if (disabled && onUpgradeNeeded) {
      onUpgradeNeeded()
      return
    }

    const words = parseWords(inputWords)
    
    if (words.length < 5) {
      alert('Please enter at least 5 words for batch processing.')
      return
    }

    if (words.length > quotaRemaining && quotaRemaining > 0) {
      const proceed = confirm(
        `This batch will use ${words.length} lookups but you only have ${quotaRemaining} remaining. Continue anyway?`
      )
      if (!proceed) return
    }

    await processBatch()
  }

  const handleClear = () => {
    setInputWords('')
    clearBatch()
  }

  const currentWords = parseWords(inputWords)
  const wordCount = currentWords.length
  const isValidBatch = wordCount >= 5 && wordCount <= 25

  return (
    <div className="ielts-batch-processor">
      {disabled && (
        <div className="upgrade-notice">
          <div className="notice-content">
            <h4>🔒 Premium Feature</h4>
            <p>IELTS Batch Processing is available for Pro and Premium subscribers.</p>
            <button onClick={onUpgradeNeeded} className="upgrade-button">
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}

      <div className={`batch-input-section ${disabled ? 'disabled' : ''}`}>
        <div className="input-header">
          <label htmlFor="batch-words" className="input-label">
            📝 Enter 5-25 words for analysis:
          </label>
          <div className="word-counter">
            <span className={`count ${isValidBatch ? 'valid' : wordCount > 25 ? 'over' : 'under'}`}>
              {wordCount}/25 words
            </span>
          </div>
        </div>

        <textarea
          id="batch-words"
          value={inputWords}
          onChange={handleInputChange}
          placeholder="Enter words separated by commas, spaces, or new lines:&#10;remarkable, magnificent, outstanding, exceptional, extraordinary..."
          className="batch-textarea"
          disabled={disabled || isProcessing}
          rows={4}
          maxLength={500}
        />

        <div className="processing-mode-section">
          <label className="mode-label">🧙‍♂️ Analysis Type:</label>
          <div className="mode-options">
            <label className="mode-option">
              <input
                type="radio"
                name="processing-mode"
                value="synonyms"
                checked={processingMode === 'synonyms'}
                onChange={(e) => setProcessingMode(e.target.value as 'synonyms')}
                disabled={disabled || isProcessing}
              />
              <span className="mode-text">
                <strong>Synonyms Focus</strong>
                <small>Fast analysis with synonyms and basic definition</small>
              </span>
            </label>
            <label className="mode-option">
              <input
                type="radio"
                name="processing-mode"
                value="comprehensive"
                checked={processingMode === 'comprehensive'}
                onChange={(e) => setProcessingMode(e.target.value as 'comprehensive')}
                disabled={disabled || isProcessing}
              />
              <span className="mode-text">
                <strong>Comprehensive</strong>
                <small>Full analysis with examples, word families, and detailed info</small>
              </span>
            </label>
          </div>
        </div>

        <div className="batch-actions">
          <button
            onClick={handleStartBatch}
            disabled={disabled || isProcessing || !isValidBatch}
            className="primary-button batch-button"
          >
            {isProcessing ? (
              <>
                <span className="spinner-small"></span>
                Processing... ({batchWords.length}/{wordCount})
              </>
            ) : (
              `🚀 Analyze ${wordCount} Words`
            )}
          </button>

          {(inputWords || batchWords.length > 0) && (
            <button
              onClick={handleClear}
              disabled={isProcessing}
              className="secondary-button"
            >
              🗑️ Clear
            </button>
          )}
        </div>

        {batchError && (
          <div className="batch-error">
            <strong>⚠️ Batch Error:</strong> {batchError}
          </div>
        )}

        <div className="batch-hints">
          <h5>💡 IELTS Tips:</h5>
          <ul>
            <li><strong>Synonyms Focus:</strong> Perfect for vocabulary expansion and finding alternatives</li>
            <li><strong>Comprehensive:</strong> Ideal for deep learning and exam preparation</li>
            <li><strong>Best Practice:</strong> Group related words (e.g., emotions, academic terms)</li>
            <li><strong>Quota Tip:</strong> Synonyms mode uses 1 lookup per word, Comprehensive uses 2</li>
          </ul>
        </div>
      </div>
    </div>
  )
}