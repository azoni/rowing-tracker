import React from 'react';
import { useApp } from '../context/AppContext';
import { formatTimeAgo } from '../utils';
import { getActiveHoliday } from '../constants';
import Icon from './Icon';
import AvatarOrPhoto from './Avatar';
import './ProgressAndCrew.css';

function Header() {
  const {
    currentUser, userProfile, isAdmin,
    showNotifications, setShowNotifications,
    notifications, unreadNotificationCount,
    markAllNotificationsRead, markNotificationRead,
    setExpandedComments, setActiveTab,
    setShowAdminPanel, loadPendingReviews,
    setShowSettingsModal, setShowWelcomeModal,
    handleSignIn,
  } = useApp();

  return (
    <header className="header crew-header">
      <div className="header-top">
        <h1>ROW CREW</h1>
        <div className="user-menu">
          {currentUser && userProfile ? (
            <>
              {isAdmin && (
                <button
                  className="admin-btn-header"
                  onClick={() => { setShowAdminPanel(true); loadPendingReviews(); }}
                  title="Admin Panel"
                  aria-label="Open admin panel"
                >
                  <Icon name="ui_shield" size={18} />
                </button>
              )}

              {/* Notification bell */}
              <div className="notification-wrapper">
                <button
                  className={`notification-btn ${showNotifications ? 'active' : ''}`}
                  onClick={() => setShowNotifications(!showNotifications)}
                  title="Notifications"
                  aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ''}`}
                  aria-expanded={showNotifications}
                  aria-controls="crew-notifications"
                >
                  <Icon name="ui_bell" size={18} />
                  {unreadNotificationCount > 0 && (
                    <span className="notification-badge">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div className="notification-backdrop" onClick={() => setShowNotifications(false)} />
                    <div className="notification-dropdown" id="crew-notifications" aria-label="Notifications">
                      <div className="notification-header">
                        <span>Notifications</span>
                        {unreadNotificationCount > 0 && (
                          <button onClick={markAllNotificationsRead}>Mark all read</button>
                        )}
                      </div>
                      <div className="notification-list">
                        {notifications.length === 0 ? (
                          <div className="notification-empty">No notifications yet</div>
                        ) : (
                          notifications.slice(0, 20).map(notif => {
                            const notifDate = notif.createdAt?.toDate ? notif.createdAt.toDate() : new Date(notif.createdAt);
                            return (
                              <button
                                key={notif.id}
                                className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                onClick={() => {
                                  markNotificationRead(notif.id);
                                  setExpandedComments(prev => ({ ...prev, [notif.targetId]: true }));
                                  setActiveTab('feed');
                                  setShowNotifications(false);
                                }}
                              >
                                <div className="notification-content">
                                  <span className="notification-from">{notif.fromUserName}</span>
                                  <span className="notification-action">
                                    {notif.type === 'reply' ? ' replied: ' : ' commented: '}
                                  </span>
                                  <span className="notification-text">"{notif.commentText}"</span>
                                </div>
                                <div className="notification-time">{formatTimeAgo(notifDate)}</div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button className="user-avatar" aria-label="Open profile and settings" onClick={() => setShowSettingsModal(true)}>
                <AvatarOrPhoto user={userProfile} size={36} />
              </button>
            </>
          ) : (
            <>
              <button className="info-btn" onClick={() => setShowWelcomeModal(true)} title="About Row Crew" aria-label="About Row Crew"><Icon name="ui_info" size={18} /></button>
              <button className="signin-header-btn" onClick={handleSignIn}>Sign In</button>
            </>
          )}
        </div>
      </div>
      <p className="subtitle">Row Around The World Together</p>
      {(() => {
        const holiday = getActiveHoliday();
        if (!holiday) return null;
        return <div className="holiday-banner">{holiday.banner}</div>;
      })()}
    </header>
  );
}

export default Header;
