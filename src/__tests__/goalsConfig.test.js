// Simple test for goals configuration
const { GOAL_TYPES, ACHIEVEMENTS } = require('../core/goalsConfig');

describe('Goals and Achievements Configuration', () => {
  test('GOAL_TYPES has required properties', () => {
    expect(GOAL_TYPES).toHaveProperty('social');
    expect(GOAL_TYPES).toHaveProperty('professional');
    expect(GOAL_TYPES).toHaveProperty('empathy');
    expect(GOAL_TYPES).toHaveProperty('conflict');
    
    expect(GOAL_TYPES.social).toHaveProperty('label');
    expect(GOAL_TYPES.social).toHaveProperty('description');
    expect(GOAL_TYPES.social).toHaveProperty('targets');
  });

  test('ACHIEVEMENTS has required properties', () => {
    expect(ACHIEVEMENTS).toHaveProperty('first_conversation');
    expect(ACHIEVEMENTS).toHaveProperty('conversation_streak');
    expect(ACHIEVEMENTS).toHaveProperty('empathy_master');
    
    const firstAchievement = ACHIEVEMENTS.first_conversation;
    expect(firstAchievement).toHaveProperty('id');
    expect(firstAchievement).toHaveProperty('title');
    expect(firstAchievement).toHaveProperty('description');
    expect(firstAchievement).toHaveProperty('icon');
    expect(firstAchievement).toHaveProperty('rarity');
    expect(firstAchievement).toHaveProperty('condition');
    expect(typeof firstAchievement.condition).toBe('function');
  });

  test('first_conversation achievement condition works', () => {
    const firstConvAchievement = ACHIEVEMENTS.first_conversation;
    const statsWithOneSession = { totalSessions: 1 };
    
    expect(firstConvAchievement.condition(statsWithOneSession)).toBe(true);
    
    const statsWithZeroSessions = { totalSessions: 0 };
    expect(firstConvAchievement.condition(statsWithZeroSessions)).toBe(false);
  });
});