import React, { useState } from 'react';
import { Avatar } from './Avatar';
import {
  SKIN_COLORS, HAIR_COLORS, AVATAR_PARTS, DEFAULT_AVATAR,
  HEAD_SHAPES, HAIR_STYLES, EYE_STYLES, MOUTH_STYLES, ACCESSORIES,
  RARITY_COLORS, isCosmeticUnlocked, getCosmeticInfo,
} from '../constants/avatarParts';
import { useApp } from '../context/AppContext';
import Icon from './Icon';

const OUTFIT_COLORS = [
  { id: 'teal', color: '#00d4aa', label: 'Teal' },
  { id: 'blue', color: '#4169e1', label: 'Blue' },
  { id: 'red', color: '#e63946', label: 'Red' },
  { id: 'orange', color: '#ff6b35', label: 'Orange' },
  { id: 'purple', color: '#8b5cf6', label: 'Purple' },
  { id: 'green', color: '#22c55e', label: 'Green' },
];

const PART_LABELS = {
  head: 'Head Shape',
  hair: 'Hair Style',
  eyes: 'Eyes',
  mouth: 'Mouth',
  accessory: 'Accessory',
};

// Render functions for each part type (for thumbnails)
const PART_RENDERERS = {
  head: HEAD_SHAPES,
  hair: HAIR_STYLES,
  eyes: EYE_STYLES,
  mouth: MOUTH_STYLES,
  accessory: ACCESSORIES,
};

function AvatarBuilder() {
  const {
    showAvatarBuilder, setShowAvatarBuilder,
    userProfile, saveAvatar,
  } = useApp();

  const [config, setConfig] = useState(() => ({
    ...DEFAULT_AVATAR,
    ...(userProfile?.avatar || {}),
  }));

  if (!showAvatarBuilder) return null;

  const userAchievements = userProfile?.unlockedAchievements || {};
  const update = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

  return (
    <div className="modal-overlay" onClick={() => setShowAvatarBuilder(false)}>
      <div className="modal avatar-builder-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowAvatarBuilder(false)}>✕</button>

        <h2>Create Your Avatar</h2>

        {/* Live Preview */}
        <div className="ab-preview">
          <Avatar config={config} size={120} showBody />
        </div>

        {/* Skin Color */}
        <div className="ab-section">
          <label className="ab-label">Skin</label>
          <div className="ab-color-row">
            {SKIN_COLORS.map(s => (
              <button
                key={s.id}
                className={`ab-color-swatch ${config.skinColor === s.id ? 'active' : ''}`}
                style={{ background: s.color }}
                onClick={() => update('skinColor', s.id)}
                title={s.label}
              />
            ))}
          </div>
        </div>

        {/* Hair Color */}
        <div className="ab-section">
          <label className="ab-label">Hair Color</label>
          <div className="ab-color-row">
            {HAIR_COLORS.map(h => (
              <button
                key={h.id}
                className={`ab-color-swatch ${config.hairColor === h.id ? 'active' : ''}`}
                style={{ background: h.color }}
                onClick={() => update('hairColor', h.id)}
                title={h.label}
              />
            ))}
          </div>
        </div>

        {/* Part selectors with visual tiles */}
        {Object.entries(AVATAR_PARTS).map(([partKey, options]) => (
          <div key={partKey} className="ab-section">
            <label className="ab-label">{PART_LABELS[partKey]}</label>
            <div className="ab-tile-row">
              {options.map(opt => {
                const info = getCosmeticInfo(partKey, opt);
                const unlocked = isCosmeticUnlocked(partKey, opt, userAchievements);
                const isSelected = config[partKey] === opt;
                const rarityColor = RARITY_COLORS[info.rarity] || RARITY_COLORS.common;

                return (
                  <button
                    key={opt}
                    className={`ab-tile ${isSelected ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
                    style={{ borderColor: isSelected ? rarityColor : undefined }}
                    onClick={() => unlocked && update(partKey, opt)}
                    title={unlocked ? opt.replace(/_/g, ' ') : `Unlock: ${info.achievementName || 'Achievement'}`}
                  >
                    {/* Mini SVG preview */}
                    <svg viewBox="0 0 64 48" className="ab-tile-preview">
                      {PART_RENDERERS[partKey]?.[opt]?.(
                        partKey === 'head' ? (SKIN_COLORS.find(s => s.id === config.skinColor)?.color || '#c68642') :
                        partKey === 'hair' ? (HAIR_COLORS.find(h => h.id === config.hairColor)?.color || '#5c3317') :
                        config.outfitColor || '#00d4aa'
                      )}
                    </svg>

                    {/* Rarity dot */}
                    {info.rarity !== 'common' && (
                      <span className="ab-tile-rarity" style={{ background: rarityColor }} />
                    )}

                    {/* Lock overlay */}
                    {!unlocked && (
                      <div className="ab-tile-lock">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--text-muted)">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                        </svg>
                        <span className="ab-tile-lock-text">{info.achievementName}</span>
                      </div>
                    )}

                    {/* Label */}
                    <span className="ab-tile-label">{opt.replace(/_/g, ' ')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Outfit Color */}
        <div className="ab-section">
          <label className="ab-label">Outfit Color</label>
          <div className="ab-color-row">
            {OUTFIT_COLORS.map(o => (
              <button
                key={o.id}
                className={`ab-color-swatch ${config.outfitColor === o.color ? 'active' : ''}`}
                style={{ background: o.color }}
                onClick={() => update('outfitColor', o.color)}
                title={o.label}
              />
            ))}
          </div>
        </div>

        {/* Save */}
        <button className="ab-save-btn" onClick={() => { saveAvatar(config); setShowAvatarBuilder(false); }}>
          <Icon name="ui_check" size={16} /> Save Avatar
        </button>
      </div>
    </div>
  );
}

export default AvatarBuilder;
