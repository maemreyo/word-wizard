// Learning Stats Component - Track vocabulary learning progress and analytics
// Clean React component following separation of concerns

import type { UserPlanType } from '../../lib/types'

// shadcn/ui components
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

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

  const renderProgressBar = (percentage: number, variant: 'default' | 'success' | 'warning' | 'destructive' = 'default') => (
    <Progress 
      value={percentage} 
      className={`h-2 ${
        variant === 'success' ? '[&>div]:bg-green-500' :
        variant === 'warning' ? '[&>div]:bg-yellow-500' :
        variant === 'destructive' ? '[&>div]:bg-red-500' :
        '[&>div]:bg-primary'
      }`}
    />
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
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">📚</div>
            <div className="text-2xl font-bold text-primary">{formatNumber(totalWords)}</div>
            <div className="text-sm text-muted-foreground">Total Words</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center space-y-2">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-600">{masteryPercentage}%</div>
            <div className="text-sm text-muted-foreground">Mastery Rate</div>
            {renderProgressBar(masteryPercentage, 'success')}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
            <div className="text-sm text-muted-foreground">Current Streak</div>
            <div className="text-xs text-muted-foreground">Best: {longestStreak} days</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-2xl font-bold text-blue-600">{averageDaily.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Daily Average</div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Goals Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Weekly Goal</span>
              <span className="text-sm text-muted-foreground">{wordsThisWeek} / {weeklyGoal}</span>
            </div>
            {renderProgressBar(weeklyProgress, 'default')}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Monthly Goal</span>
              <span className="text-sm text-muted-foreground">{wordsThisMonth} / {monthlyGoal}</span>
            </div>
            {renderProgressBar(monthlyProgress, 'default')}
          </div>
        </CardContent>
      </Card>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Weekly Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-20 gap-1">
            {dailyProgress.slice(-7).map((day, index) => {
              const maxCount = Math.max(...dailyProgress.slice(-7).map(d => d.count), 1)
              const height = (day.count / maxCount) * 100
              return (
                <div key={index} className="flex flex-col items-center gap-1 flex-1">
                  <div 
                    className={`w-full rounded-t ${day.count > 0 ? 'bg-green-500' : 'bg-muted'} transition-all`}
                    style={{ height: `${height}%` }}
                    title={`${day.date}: ${day.count} words`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Difficulty Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const total = difficultyBreakdown.easy + difficultyBreakdown.medium + difficultyBreakdown.hard
            if (total === 0) return <div className="text-muted-foreground text-sm">No data available</div>
            
            return (
              <div className="space-y-4">
                <div className="flex items-end justify-center h-24 gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div 
                      className="w-8 bg-green-500 rounded-t"
                      style={{ height: `${(difficultyBreakdown.easy / total) * 100}%` }}
                      title={`Easy: ${difficultyBreakdown.easy} words`}
                    />
                    <span className="text-xs font-medium">{difficultyBreakdown.easy}</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div 
                      className="w-8 bg-yellow-500 rounded-t"
                      style={{ height: `${(difficultyBreakdown.medium / total) * 100}%` }}
                      title={`Medium: ${difficultyBreakdown.medium} words`}
                    />
                    <span className="text-xs font-medium">{difficultyBreakdown.medium}</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div 
                      className="w-8 bg-red-500 rounded-t"
                      style={{ height: `${(difficultyBreakdown.hard / total) * 100}%` }}
                      title={`Hard: ${difficultyBreakdown.hard} words`}
                    />
                    <span className="text-xs font-medium">{difficultyBreakdown.hard}</span>
                  </div>
                </div>
                <div className="flex justify-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    Easy
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    Medium
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    Hard
                  </span>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Top Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏷️ Top Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(topicsBreakdown)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([topic, count]) => (
              <div key={topic} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">{topic}</span>
                  <span className="text-sm text-muted-foreground">{count} words</span>
                </div>
                <Progress 
                  value={(count / Math.max(...Object.values(topicsBreakdown))) * 100}
                  className="h-2"
                />
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Quota Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💎 Usage Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs uppercase">
              {quotaStatus.plan} PLAN
            </Badge>
          </div>
          
          {quotaStatus.limit > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Lookups remaining</span>
                <span className="text-sm font-medium">
                  {quotaStatus.remaining} / {quotaStatus.limit}
                </span>
              </div>
              {renderProgressBar(
                ((quotaStatus.limit - quotaStatus.remaining) / quotaStatus.limit) * 100,
                quotaStatus.remaining <= quotaStatus.limit * 0.2 ? 'destructive' : 'success'
              )}
            </div>
          ) : (
            <div className="text-center py-2">
              <span className="text-green-600 font-medium">♾️ Unlimited lookups</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievement Hints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Next Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentStreak < 7 && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-xl">🔥</span>
              <span className="text-sm">
                {7 - currentStreak} more days for "Week Warrior"
              </span>
            </div>
          )}
          {masteredWords < 100 && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-xl">💯</span>
              <span className="text-sm">
                {100 - masteredWords} more words for "Century Scholar"
              </span>
            </div>
          )}
          {totalWords < 500 && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-xl">📚</span>
              <span className="text-sm">
                {500 - totalWords} more words for "Vocabulary Master"
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}