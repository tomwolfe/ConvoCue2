import React, { useState } from 'react';
import { GOAL_TYPES } from '../../core/goalsConfig';
import { Trophy, Target, Calendar, RotateCcw, Plus, CheckCircle, Clock } from 'lucide-react';

const GoalsDashboard = ({ 
  activeGoals, 
  completedGoals, 
  onCreateGoal, 
  onUpdateGoalProgress, 
  onDeleteGoal, 
  onResetGoal 
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('weekly');

  const handleCreateGoal = (e) => {
    e.preventDefault();
    if (selectedType && selectedTarget) {
      onCreateGoal(selectedType, parseInt(selectedTarget), selectedTimeFrame);
      // Reset form
      setSelectedType('');
      setSelectedTarget('');
      setSelectedTimeFrame('weekly');
      setShowCreateForm(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'social': return <Target className="text-purple-500" size={16} />;
      case 'professional': return <Target className="text-blue-500" size={16} />;
      case 'empathy': return <Target className="text-red-500" size={16} />;
      case 'conflict': return <Target className="text-orange-500" size={16} />;
      default: return <Target size={16} />;
    }
  };

  const getTimeFrameIcon = (timeFrame) => {
    switch (timeFrame) {
      case 'daily': return <Clock size={14} />;
      case 'weekly': return <Calendar size={14} />;
      case 'monthly': return <Calendar size={14} />;
      default: return <Calendar size={14} />;
    }
  };

  return (
    <div className="goals-dashboard">
      <div className="dashboard-header">
        <h3>Conversation Goals</h3>
        <button 
          className="btn-primary btn-small"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <Plus size={16} />
          {showCreateForm ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {showCreateForm && (
        <form className="create-goal-form" onSubmit={handleCreateGoal}>
          <div className="form-group">
            <label>Goal Type:</label>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
              required
            >
              <option value="">Select a type</option>
              {Object.entries(GOAL_TYPES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {selectedType && (
            <div className="form-group">
              <label>Target:</label>
              <select 
                value={selectedTarget} 
                onChange={(e) => setSelectedTarget(e.target.value)}
                required
              >
                <option value="">Select target</option>
                {GOAL_TYPES[selectedType]?.targets.map((target, idx) => (
                  <option key={idx} value={target.value}>{target.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Time Frame:</label>
            <select 
              value={selectedTimeFrame} 
              onChange={(e) => setSelectedTimeFrame(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <button type="submit" className="btn-primary">
            Create Goal
          </button>
        </form>
      )}

      {activeGoals.length > 0 ? (
        <div className="goals-list">
          <h4>Active Goals</h4>
          {activeGoals.map(goal => (
            <div key={goal.id} className="goal-card">
              <div className="goal-header">
                <div className="goal-type">
                  {getTypeIcon(goal.type)}
                  <span>{GOAL_TYPES[goal.type]?.label || goal.type}</span>
                </div>
                <div className="goal-timeframe">
                  {getTimeFrameIcon(goal.timeFrame)}
                  <span>{goal.timeFrame}</span>
                </div>
              </div>
              
              <div className="goal-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  {goal.currentValue} / {goal.targetValue}
                </div>
              </div>
              
              <div className="goal-actions">
                <button 
                  className="btn-secondary btn-small"
                  onClick={() => onUpdateGoalProgress(goal.id, 1)}
                  title="Increment progress"
                >
                  +1
                </button>
                <button 
                  className="btn-secondary btn-small"
                  onClick={() => onDeleteGoal(goal.id)}
                  title="Delete goal"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Target size={48} className="empty-icon" />
          <p>You don't have any active goals yet.</p>
          <p>Create your first goal to start tracking your conversation progress!</p>
        </div>
      )}

      {completedGoals.length > 0 && (
        <div className="completed-goals">
          <h4>Completed Goals</h4>
          {completedGoals.map(goal => (
            <div key={goal.id} className="completed-goal-card">
              <div className="goal-summary">
                <CheckCircle className="completed-icon" size={16} />
                <span>{GOAL_TYPES[goal.type]?.label || goal.type}: {goal.currentValue}/{goal.targetValue}</span>
              </div>
              <div className="completed-actions">
                <button 
                  className="btn-secondary btn-small"
                  onClick={() => onResetGoal(goal.id)}
                >
                  <RotateCcw size={14} /> Reset
                </button>
                <button 
                  className="btn-secondary btn-small"
                  onClick={() => onDeleteGoal(goal.id)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalsDashboard;