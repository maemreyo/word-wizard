// Learning Stats Component - Track vocabulary learning progress and analytics
// Clean React component following separation of concerns

import React from 'react'
import type { UserPlanType } from '../../lib/types'

interface LearningStatsData {
  totalWords: number
  masteredWords: number
  wordsThisWeek: number
  wordsThisMonth: number
  averageDaily: number
  longestStreak: number
  currentStreak: number
  difficultyBreakdown: {
    easy: number
    medium: number
    hard: number
  }
  topicsBreakdown: {
    [topic: string]: number
  }
  dailyProgress: {
    date: string
    count: number
  }[]
  weeklyGoal: number
  monthlyGoal: number
}

interface QuotaStatus {
  remaining: number
  limit: number
  plan: UserPlanType
}

interface LearningStatsProps {
  stats: LearningStatsData
  quotaStatus: QuotaStatus
}

export function LearningStats({ stats, quotaStatus }: LearningStatsProps) {
  const {
    totalWords,
    masteredWords,
    wordsThisWeek,
    wordsThisMonth,
    averageDaily,
    longestStreak,
    currentStreak,
    difficultyBreakdown,
    topicsBreakdown,
    dailyProgress,
    weeklyGoal,
    monthlyGoal
  } = stats

  const masteryPercentage = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0
  const weeklyProgress = weeklyGoal > 0 ? Math.min(100, Math.round((wordsThisWeek / weeklyGoal) * 100)) : 0
  const monthlyProgress = monthlyGoal > 0 ? Math.min(100, Math.round((wordsThisMonth / monthlyGoal) * 100)) : 0

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  const renderProgressBar = (percentage: number, color: string = '#10b981') => (
    <div className="progress-bar">
      <div 
        className="progress-fill" 
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
    </div>
  )

  const renderDifficultyChart = () => {
    const total = difficultyBreakdown.easy + difficultyBreakdown.medium + difficultyBreakdown.hard
    if (total === 0) return null

    return (
      <div className="difficulty-chart">
        <div className="chart-bars">
          <div 
            className="difficulty-bar easy" 
            style={{ height: `${(difficultyBreakdown.easy / total) * 100}%` }}
            title={`Easy: ${difficultyBreakdown.easy} words`}
          >
            <span className="bar-label">{difficultyBreakdown.easy}</span>
          </div>
          <div 
            className="difficulty-bar medium" 
            style={{ height: `${(difficultyBreakdown.medium / total) * 100}%` }}
            title={`Medium: ${difficultyBreakdown.medium} words`}
          >
            <span className="bar-label">{difficultyBreakdown.medium}</span>
          </div>
          <div 
            className="difficulty-bar hard" 
            style={{ height: `${(difficultyBreakdown.hard / total) * 100}%` }}
            title={`Hard: ${difficultyBreakdown.hard} words`}
          >
            <span className="bar-label">{difficultyBreakdown.hard}</span>
          </div>
        </div>
        <div className="chart-labels">
          <span>🟢 Easy</span>
          <span>🟡 Medium</span>
          <span>🔴 Hard</span>
        </div>
      </div>
    )
  }

  const renderWeeklyActivity = () => {
    const last7Days = dailyProgress.slice(-7)
    const maxCount = Math.max(...last7Days.map(d => d.count), 1)

    return (
      <div className="activity-chart">
        <div className="activity-bars">
          {last7Days.map((day, index) => (
            <div key={index} className="activity-day">
              <div 
                className="activity-bar"
                style={{ 
                  height: `${(day.count / maxCount) * 100}%`,
                  backgroundColor: day.count > 0 ? '#10b981' : '#e5e7eb'
                }}
                title={`${day.date}: ${day.count} words`}
              />
              <span className="day-label">
                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="learning-stats">
      {/* Overview Cards */}
      <div className="stats-overview">
        <div className="stat-card primary">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-number">{formatNumber(totalWords)}</div>
            <div className="stat-label">Total Words</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{masteryPercentage}%</div>
            <div className="stat-label">Mastery Rate</div>
            {renderProgressBar(masteryPercentage, '#10b981')}
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-number">{currentStreak}</div>
            <div className="stat-label">Current Streak</div>
            <div className="stat-subtitle">Best: {longestStreak} days</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{averageDaily.toFixed(1)}</div>
            <div className="stat-label">Daily Average</div>
          </div>
        </div>
      </div>

      {/* Goals Progress */}
      <div className="goals-section">
        <h3 className="section-title">🎯 Goals Progress</h3>
        
        <div className="goal-item">
          <div className="goal-header">
            <span className="goal-label">Weekly Goal</span>
            <span className="goal-progress">{wordsThisWeek} / {weeklyGoal}</span>
          </div>
          {renderProgressBar(weeklyProgress, '#2563eb')}
        </div>

        <div className="goal-item">
          <div className="goal-header">
            <span className="goal-label">Monthly Goal</span>
            <span className="goal-progress">{wordsThisMonth} / {monthlyGoal}</span>
          </div>
          {renderProgressBar(monthlyProgress, '#7c3aed')}
        </div>
      </div>

      {/* Activity Chart */}
      <div className="activity-section">
        <h3 className="section-title">📈 Weekly Activity</h3>
        {renderWeeklyActivity()}
      </div>

      {/* Difficulty Breakdown */}
      <div className="difficulty-section">
        <h3 className="section-title">📊 Difficulty Breakdown</h3>
        {renderDifficultyChart()}
      </div>

      {/* Top Topics */}
      <div className="topics-section">
        <h3 className="section-title">🏷️ Top Topics</h3>
        <div className="topics-list">
          {Object.entries(topicsBreakdown)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([topic, count]) => (
              <div key={topic} className="topic-item">
                <span className="topic-name">{topic}</span>
                <span className="topic-count">{count} words</span>
                <div className="topic-bar">
                  <div 
                    className="topic-fill"
                    style={{ 
                      width: `${(count / Math.max(...Object.values(topicsBreakdown))) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Quota Status */}
      <div className="quota-section">
        <h3 className="section-title">💎 Usage Status</h3>
        <div className="quota-info">
          <div className="quota-plan">
            <span className={`plan-badge plan-${quotaStatus.plan}`}>
              {quotaStatus.plan.toUpperCase()} PLAN
            </span>
          </div>
          
          {quotaStatus.limit > 0 ? (
            <div className="quota-usage">
              <div className="quota-numbers">
                <span className="remaining">{quotaStatus.remaining}</span>
                <span className="separator">/</span>
                <span className="limit">{quotaStatus.limit}</span>
                <span className="label">lookups remaining</span>
              </div>
              {renderProgressBar(
                ((quotaStatus.limit - quotaStatus.remaining) / quotaStatus.limit) * 100,
                quotaStatus.remaining <= quotaStatus.limit * 0.2 ? '#ef4444' : '#10b981'
              )}
            </div>
          ) : (
            <div className="unlimited-status">
              <span className="unlimited-text">♾️ Unlimited lookups</span>
            </div>
          )}
        </div>
      </div>

      {/* Achievement Hints */}
      <div className="achievements-section">
        <h3 className="section-title">🏆 Next Achievements</h3>
        <div className="achievement-hints">
          {currentStreak < 7 && (
            <div className="achievement-hint">
              <span className="achievement-icon">🔥</span>
              <span className="achievement-text">
                {7 - currentStreak} more days for "Week Warrior"
              </span>
            </div>
          )}
          {masteredWords < 100 && (
            <div className="achievement-hint">
              <span className="achievement-icon">💯</span>
              <span className="achievement-text">
                {100 - masteredWords} more words for "Century Scholar"
              </span>
            </div>
          )}
          {totalWords < 500 && (
            <div className="achievement-hint">
              <span className="achievement-icon">📚</span>
              <span className="achievement-text">
                {500 - totalWords} more words for "Vocabulary Master"
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}