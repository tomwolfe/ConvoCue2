import React from 'react';
import { X } from 'lucide-react';

const NotificationsPanel = ({ notifications, onClearNotification }) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notifications-panel">
      {notifications.map(notification => (
        <div key={notification.id} className="notification-item">
          <div className="notification-content">
            <div className="notification-icon">
              <span className="notification-emoji">{notification.icon}</span>
            </div>
            <div className="notification-text">
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
            </div>
          </div>
          <button 
            className="notification-close"
            onClick={() => onClearNotification(notification.id)}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationsPanel;