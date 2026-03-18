import React, { useState } from 'react';
import { Avatar } from './Avatar';
import {
  SKIN_COLORS, HAIR_COLORS, AVATAR_PARTS, DEFAULT_AVATAR,
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

// Labels for each part category
const PART_LABELS = {
  head: 'Head',
  hair: 'Hair',
  eyes: 'Eyes',
  mouth: 'Mouth',
  accessory: 'Accessory',
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

        {/* Part selectors */}
        {Object.entries(AVATAR_PARTS).map(([partKey, options]) => (
          <div key={partKey} className="ab-section">
            <label className="ab-label">{PART_LABELS[partKey]}</label>
            <div className="ab-options-row">
              {options.map(opt => (
                <button
                  key={opt}
                  className={`ab-option ${config[partKey] === opt ? 'active' : ''}`}
                  onClick={() => update(partKey, opt)}
                >
                  {opt.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Outfit Color */}
        <div className="ab-section">
          <label className="ab-label">Outfit</label>
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
