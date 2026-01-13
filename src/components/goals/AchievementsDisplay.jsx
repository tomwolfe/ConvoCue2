import React from 'react';
import { Trophy, Star, Heart, Handshake, BatteryCharging, Crown } from 'lucide-react';
import { RARITY_WEIGHTS } from '../../core/goalsConfig';

const AchievementsDisplay = ({ achievements }) => {
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#9ca3af'; // gray
      case 'uncommon': return '#10b981'; // green
      case 'rare': return '#3b82f6'; // blue
      case 'epic': return '#8b5cf6'; // purple
      case 'legendary': return '#f59e0b'; // amber
      default: return '#9ca3af';
    }
  };

  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-400';
      case 'uncommon': return 'border-green-500';
      case 'rare': return 'border-blue-500';
      case 'epic': return 'border-purple-500';
      case 'legendary': return 'border-amber-500';
      default: return 'border-gray-400';
    }
  };

  const getRarityIcon = (rarity) => {
    switch (rarity) {
      case 'common': return <Star size={16} className="text-gray-400" />;
      case 'uncommon': return <Star size={16} className="text-green-500" />;
      case 'rare': return <Star size={16} className="text-blue-500" />;
      case 'epic': return <Star size={16} className="text-purple-500" />;
      case 'legendary': return <Crown size={16} className="text-amber-500" />;
      default: return <Star size={16} className="text-gray-400" />;
    }
  };

  // Sort achievements by rarity (highest first) and then by date awarded
  const sortedAchievements = [...achievements].sort((a, b) => {
    const rarityDiff = RARITY_WEIGHTS[b.rarity] - RARITY_WEIGHTS[a.rarity];
    if (rarityDiff !== 0) return rarityDiff;
    return new Date(b.awardedAt) - new Date(a.awardedAt);
  });

  return (
    <div className="achievements-display">
      <div className="dashboard-header">
        <h3>Achievements</h3>
        <div className="achievements-count">
          {achievements.length} unlocked
        </div>
      </div>

      {sortedAchievements.length > 0 ? (
        <div className="achievements-grid">
          {sortedAchievements.map((achievement, index) => (
            <div 
              key={`${achievement.id}-${index}`} 
              className={`achievement-card ${getRarityBorder(achievement.rarity)}`}
              style={{ borderColor: getRarityColor(achievement.rarity) }}
            >
              <div className="achievement-icon" style={{ color: getRarityColor(achievement.rarity) }}>
                <span className="achievement-emoji">{achievement.icon}</span>
                {getRarityIcon(achievement.rarity)}
              </div>
              <div className="achievement-content">
                <h4>{achievement.title}</h4>
                <p>{achievement.description}</p>
                <div className="achievement-meta">
                  <span className="rarity-badge" style={{ color: getRarityColor(achievement.rarity) }}>
                    {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                  </span>
                  <span className="awarded-date">
                    {new Date(achievement.awardedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Trophy size={48} className="empty-icon" />
          <p>No achievements yet!</p>
          <p>Keep using ConvoCue to unlock your first achievement.</p>
        </div>
      )}
    </div>
  );
};

export default AchievementsDisplay;