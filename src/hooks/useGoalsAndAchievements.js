import { useState, useEffect } from 'react';
import { ACHIEVEMENTS } from '../core/goalsConfig';

export const useGoalsAndAchievements = (sessionHistory) => {
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('convocue_goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [achievements, setAchievements] = useState(() => {
    const saved = localStorage.getItem('convocue_achievements');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState([]);

  // Save goals to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('convocue_goals', JSON.stringify(goals));
  }, [goals]);

  // Save achievements to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('convocue_achievements', JSON.stringify(achievements));
  }, [achievements]);

  // Check for new achievements whenever session history changes
  useEffect(() => {
    if (sessionHistory && sessionHistory.sessions) {
      checkForAchievements(sessionHistory.sessions);
    }
  }, [sessionHistory]);

  const createGoal = (type, targetValue, timeFrame) => {
    const newGoal = {
      id: Date.now().toString(),
      type,
      targetValue,
      currentValue: 0,
      timeFrame, // 'daily', 'weekly', 'monthly'
      createdAt: new Date().toISOString(),
      completed: false,
      progress: 0
    };
    
    setGoals(prev => [...prev, newGoal]);
    return newGoal;
  };

  const updateGoalProgress = (goalId, increment = 1) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId && !goal.completed) {
        const newValue = Math.min(goal.currentValue + increment, goal.targetValue);
        const completed = newValue >= goal.targetValue;
        const progress = (newValue / goal.targetValue) * 100;
        
        return {
          ...goal,
          currentValue: newValue,
          completed,
          progress
        };
      }
      return goal;
    }));
  };

  const deleteGoal = (goalId) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

  const resetGoal = (goalId) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          currentValue: 0,
          completed: false,
          progress: 0
        };
      }
      return goal;
    }));
  };

  const checkForAchievements = (sessions) => {
    // Calculate stats from session history
    const stats = calculateStatsFromSessions(sessions);
    
    // Check each achievement
    Object.values(ACHIEVEMENTS).forEach(achievement => {
      if (!achievements.some(a => a.id === achievement.id)) {
        // Check if achievement condition is met
        if (typeof achievement.condition === 'function') {
          if (achievement.condition(stats, sessions)) {
            // Award achievement
            awardAchievement(achievement);
          }
        }
      }
    });
  };

  const calculateStatsFromSessions = (sessions) => {
    if (!sessions || sessions.length === 0) {
      return {
        totalSessions: 0,
        empathySuggestions: 0,
        conflictResolutions: 0,
        highBatteryConversations: 0
      };
    }

    let empathySuggestions = 0;
    let conflictResolutions = 0;
    let highBatteryConversations = 0;

    sessions.forEach(session => {
      // Count empathy and conflict related interactions
      if (session.transcript) {
        session.transcript.forEach(entry => {
          if (entry.intent === 'empathy') {
            empathySuggestions++;
          }
          if (entry.intent === 'conflict') {
            conflictResolutions++;
          }
        });
      }

      // Count high battery conversations
      if (session.battery > 70) {
        highBatteryConversations++;
      }
    });

    return {
      totalSessions: sessions.length,
      empathySuggestions,
      conflictResolutions,
      highBatteryConversations
    };
  };

  const awardAchievement = (achievement) => {
    const newAchievement = {
      ...achievement,
      awardedAt: new Date().toISOString()
    };

    setAchievements(prev => [...prev, newAchievement]);
    
    // Add notification
    setNotifications(prev => [...prev, {
      id: Date.now().toString(),
      type: 'achievement',
      title: `Achievement Unlocked: ${achievement.title}`,
      message: achievement.description,
      icon: achievement.icon,
      timestamp: new Date().toISOString()
    }]);
  };

  const getActiveGoals = () => {
    return goals.filter(goal => !goal.completed);
  };

  const getCompletedGoals = () => {
    return goals.filter(goal => goal.completed);
  };

  const getRecentNotifications = (limit = 5) => {
    return notifications.slice(0, limit);
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return {
    goals,
    achievements,
    notifications,
    createGoal,
    updateGoalProgress,
    deleteGoal,
    resetGoal,
    checkForAchievements,
    getActiveGoals,
    getCompletedGoals,
    getRecentNotifications,
    clearNotification,
    awardAchievement
  };
};