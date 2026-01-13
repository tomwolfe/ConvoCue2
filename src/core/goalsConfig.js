// Configuration for conversation goals and achievements
export const GOAL_TYPES = {
  social: {
    label: 'Social Confidence',
    description: 'Build social confidence through meaningful interactions',
    targets: [
      { label: '1 conversation', value: 1 },
      { label: '3 conversations', value: 3 },
      { label: '5 conversations', value: 5 },
      { label: '10 conversations', value: 10 }
    ]
  },
  professional: {
    label: 'Professional Networking',
    description: 'Expand your professional network and connections',
    targets: [
      { label: '1 networking event', value: 1 },
      { label: '3 networking events', value: 3 },
      { label: '5 networking events', value: 5 },
      { label: '10 networking events', value: 10 }
    ]
  },
  empathy: {
    label: 'Empathy Building',
    description: 'Practice active listening and emotional intelligence',
    targets: [
      { label: '5 empathetic responses', value: 5 },
      { label: '10 empathetic responses', value: 10 },
      { label: '20 empathetic responses', value: 20 },
      { label: '50 empathetic responses', value: 50 }
    ]
  },
  conflict: {
    label: 'Conflict Resolution',
    description: 'Improve skills in navigating difficult conversations',
    targets: [
      { label: '3 resolved conflicts', value: 3 },
      { label: '5 resolved conflicts', value: 5 },
      { label: '10 resolved conflicts', value: 10 }
    ]
  }
};

export const ACHIEVEMENTS = {
  // Milestone achievements
  first_conversation: {
    id: 'first_conversation',
    title: 'First Steps',
    description: 'Completed your first conversation with ConvoCue',
    icon: '🎯',
    rarity: 'common',
    condition: (stats) => stats.totalSessions >= 1
  },
  conversation_streak: {
    id: 'conversation_streak',
    title: 'Conversation Streak',
    description: 'Had conversations on 3 consecutive days',
    icon: '🔥',
    rarity: 'rare',
    condition: (stats, history) => {
      // Check if user had conversations on 3+ consecutive days
      if (!history || history.length < 3) return false;
      
      const dates = history.map(session => new Date(session.timestamp).toDateString());
      const uniqueDates = [...new Set(dates)].sort();
      
      // Check for 3 consecutive days
      let streak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i-1]);
        const currDate = new Date(uniqueDates[i]);
        
        // Calculate difference in days
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          streak++;
          if (streak >= 3) return true;
        } else {
          streak = 1;
        }
      }
      return false;
    }
  },
  empathy_master: {
    id: 'empathy_master',
    title: 'Empathy Master',
    description: 'Received 20 empathy-related suggestions',
    icon: '❤️',
    rarity: 'uncommon',
    condition: (stats) => stats.empathySuggestions >= 20
  },
  conflict_resolver: {
    id: 'conflict_resolver',
    title: 'Conflict Resolver',
    description: 'Successfully navigated 10 conflict situations',
    icon: '🤝',
    rarity: 'uncommon',
    condition: (stats) => stats.conflictResolutions >= 10
  },
  battery_efficiency: {
    id: 'battery_efficiency',
    title: 'Battery Efficiency Expert',
    description: 'Maintained average battery above 70% in 10 conversations',
    icon: '🔋',
    rarity: 'rare',
    condition: (stats) => stats.highBatteryConversations >= 10
  },
  social_butterfly: {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Participated in 50+ conversations',
    icon: '🦋',
    rarity: 'epic',
    condition: (stats) => stats.totalSessions >= 50
  },
  conversation_novice: {
    id: 'conversation_novice',
    title: 'Conversation Novice',
    description: 'Participated in 5 conversations',
    icon: '🐣',
    rarity: 'common',
    condition: (stats) => stats.totalSessions >= 5
  },
  conversation_enthusiast: {
    id: 'conversation_enthusiast',
    title: 'Conversation Enthusiast',
    description: 'Participated in 20 conversations',
    icon: '😊',
    rarity: 'uncommon',
    condition: (stats) => stats.totalSessions >= 20
  },
  conversation_expert: {
    id: 'conversation_expert',
    title: 'Conversation Expert',
    description: 'Participated in 100 conversations',
    icon: '👑',
    rarity: 'legendary',
    condition: (stats) => stats.totalSessions >= 100
  }
};

// Rarity weights for display purposes
export const RARITY_WEIGHTS = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5
};