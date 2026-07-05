import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Portfolio traffic beacon — one visit per session to the shared leaderboard sink.
if (typeof window !== 'undefined' && !sessionStorage.getItem('_av_lb')) {
  sessionStorage.setItem('_av_lb', '1');
  fetch('https://azoni.ai/.netlify/functions/log-visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'rowcrew' }),
  }).catch(() => {});
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
