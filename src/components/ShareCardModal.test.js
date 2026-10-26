import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useApp } from '../context/AppContext';
import ShareCardModal from './ShareCardModal';

jest.mock('../context/AppContext', () => ({ useApp: jest.fn() }));

test('shares the confirmed eligible total without adding the latest row twice or using a stale profile counter', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  useApp.mockReturnValue({
    showShareModal: true, handleCloseShare: jest.fn(), shareCardRef: React.createRef(),
    userProfile: { name: 'Alex', totalMeters: 999999 }, currentUser: { uid: 'alex' },
    lastSessionMeters: 2000, lastSessionTotalMeters: 7000, calculateStreak: () => 2,
    linkCopied: false, isCopying: false, handleCopyLink: jest.fn(),
  });
  try {
    act(() => root.render(<ShareCardModal />));
    expect(container.querySelector('.share-session-meters').textContent).toBe('2,000m');
    expect([...container.querySelectorAll('.share-stat-value')].map(node => node.textContent)).toEqual(['2', '7.0k']);
    expect(container.textContent).not.toContain('9.0k');
  } finally { act(() => root.unmount()); }
});
