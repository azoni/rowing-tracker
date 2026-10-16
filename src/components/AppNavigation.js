import React from 'react';
import { useApp } from '../context/AppContext';
import Icon from './Icon';
import './AppNavigation.css';

export default function AppNavigation() {
  const { currentUser, userProfile, activeTab, setActiveTab, setShowLogModal } = useApp();
  const signedIn = Boolean(currentUser && userProfile);
  const navigate = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const tab = (id, label, icon) => (
    <button key={id} type="button" className={`crew-nav-item ${activeTab === id ? 'is-active' : ''}`}
      aria-current={activeTab === id ? 'page' : undefined} onClick={() => navigate(id)}>
      <Icon name={icon} size={21} /><span>{label}</span>
    </button>
  );
  return (
    <nav className="crew-nav" aria-label="Main navigation">
      {signedIn && tab('home', 'Home', 'ui_rowing')}
      {tab('feed', 'Crew', 'ui_feed')}
      {signedIn && <button type="button" className="crew-nav-log" onClick={() => setShowLogModal(true)}>
        <span><Icon name="ui_plus" size={23} /></span>Log row
      </button>}
      {tab('leaderboard', 'Board', 'ui_trophy')}
      {tab('more', 'Progress', 'ui_chart')}
    </nav>
  );
}
