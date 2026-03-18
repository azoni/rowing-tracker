import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getUserRank, TIER_COLORS } from '../constants';
import { JOURNEY_CHECKPOINTS, getJourneyPathD, getJourneyPosition } from '../constants/journeyPath';
import { formatMeters } from '../utils';
import AvatarOrPhoto from './Avatar';
import Icon from './Icon';

function CrewMap() {
  const { showCrewMap, setShowCrewMap, users } = useApp();
  const [selectedUser, setSelectedUser] = useState(null);

  if (!showCrewMap) return null;

  const crewMembers = Object.values(users)
    .filter(u => u.totalMeters > 0)
    .map(u => {
      const pos = getJourneyPosition(u.totalMeters);
      const rank = getUserRank(u.totalMeters);
      return { ...u, pos, rank, tierColor: TIER_COLORS[rank?.tier] || '#00d4aa' };
    })
    .sort((a, b) => b.totalMeters - a.totalMeters);

  return (
    <div className="modal-overlay" onClick={() => { setShowCrewMap(false); setSelectedUser(null); }}>
      <div className="modal crew-map-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => { setShowCrewMap(false); setSelectedUser(null); }}>✕</button>
        <h2><Icon name="ui_globe" size={20} /> Crew Map</h2>
        <p className="crew-map-subtitle">{crewMembers.length} rowers around the world</p>

        <div className="crew-map-container">
          <svg className="crew-map-svg" viewBox="0 0 800 360" preserveAspectRatio="xMidYMid meet">
            {/* Water */}
            <rect width="800" height="360" className="jm-water" />

            {/* Continents */}
            <g className="jm-continents">
              <path d="M80,60 L150,55 L190,70 L220,90 L230,130 L210,160 L180,200 L160,210 L140,240 L130,200 L100,170 L80,130 Z" />
              <path d="M180,220 L210,230 L230,260 L220,300 L200,330 L185,340 L175,310 L165,270 L170,240 Z" />
              <path d="M420,60 L470,55 L490,70 L480,90 L460,100 L470,120 L455,140 L430,130 L420,100 Z" />
              <path d="M440,150 L480,145 L520,160 L530,200 L520,240 L500,270 L470,280 L450,260 L440,220 L435,180 Z" />
              <path d="M500,50 L580,45 L650,60 L720,70 L740,100 L730,140 L700,160 L660,180 L620,190 L570,180 L540,150 L520,120 L500,90 Z" />
              <path d="M680,260 L720,250 L750,260 L755,280 L740,300 L710,305 L685,290 Z" />
            </g>

            {/* Route path */}
            <path d={getJourneyPathD()} className="cm-route" />

            {/* Checkpoint labels */}
            {JOURNEY_CHECKPOINTS.filter((_, i) => i > 0 && i < JOURNEY_CHECKPOINTS.length - 1).map(cp => (
              <g key={cp.meters}>
                <circle cx={cp.x} cy={cp.y} r="2" className="cm-checkpoint-dot" />
                <text x={cp.x} y={cp.y - 6} className="cm-checkpoint-label">{cp.label}</text>
              </g>
            ))}

            {/* Crew member dots */}
            {crewMembers.map((member, i) => (
              <g
                key={member.id}
                className={`cm-member ${selectedUser?.id === member.id ? 'selected' : ''}`}
                onClick={(e) => { e.stopPropagation(); setSelectedUser(selectedUser?.id === member.id ? null : member); }}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={member.pos.x} cy={member.pos.y} r="8" className="cm-member-pulse" style={{ fill: member.tierColor }} />
                <circle cx={member.pos.x} cy={member.pos.y} r="5" className="cm-member-dot" style={{ fill: member.tierColor, stroke: '#fff' }} />
                <text x={member.pos.x} y={member.pos.y - 12} className="cm-member-name">
                  {member.name?.split(' ')[0]}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Selected user info */}
        {selectedUser && (
          <div className="cm-user-card" style={{ borderLeftColor: selectedUser.tierColor }}>
            <div className="cm-user-avatar">
              <AvatarOrPhoto user={selectedUser} size={40} />
            </div>
            <div className="cm-user-info">
              <span className="cm-user-name">{selectedUser.name}</span>
              <span className="cm-user-rank">
                <Icon name={selectedUser.rank?.emoji} size={14} /> {selectedUser.rank?.title}
              </span>
              <span className="cm-user-meters">{formatMeters(selectedUser.totalMeters)}</span>
            </div>
          </div>
        )}

        {/* Crew list */}
        <div className="cm-crew-list">
          {crewMembers.map((member, i) => (
            <div
              key={member.id}
              className={`cm-crew-row ${selectedUser?.id === member.id ? 'active' : ''}`}
              onClick={() => setSelectedUser(selectedUser?.id === member.id ? null : member)}
            >
              <span className="cm-crew-rank">#{i + 1}</span>
              <AvatarOrPhoto user={member} size={24} />
              <span className="cm-crew-name">{member.name?.split(' ')[0]}</span>
              <span className="cm-crew-meters" style={{ color: member.tierColor }}>{formatMeters(member.totalMeters)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CrewMap;
