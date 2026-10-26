import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MILESTONES, getUserRank } from '../constants';
import { CREW_STOPS, WORLD_METERS } from '../constants/crewJourney';
import { CREW_LAND_PATHS } from '../constants/crewLand';
import { getCrewJourney, getCrewRoutePath } from '../utils/crewJourney';
import AvatarOrPhoto from './Avatar';
import Icon from './Icon';
import './CrewMap.css';

const km = meters => `${(meters / 1000).toLocaleString(undefined, { maximumFractionDigits: meters < 100000 ? 1 : 0 })} km`;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const positive = value => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0;
const wrapX = value => ((value % 1000) + 1000) % 1000;

function ExpeditionMap({ journey, selectedIndex, focus, onSelect }) {
  const frameRef = useRef(null);
  const pointers = useRef(new Map());
  const [size, setSize] = useState({ width: 360, height: 350 });
  const [camera, setCamera] = useState({ x: 500, y: 250, zoom: 1 });
  const [dragging, setDragging] = useState(false);
  const baseScale = Math.min(size.width / 1000, size.height / 500);
  const scale = baseScale * camera.zoom;
  const width = size.width / scale;
  const height = size.height / scale;
  const left = camera.x - width / 2;
  const top = camera.y - height / 2;
  const pixel = 1 / scale;
  const selected = CREW_STOPS[selectedIndex];

  useEffect(() => {
    const frame = frameRef.current;
    const measure = () => { const rect = frame.getBoundingClientRect(); if (rect.width && rect.height) setSize({ width: rect.width, height: rect.height }); };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (focus.mode === 'world') { setCamera({ x: 500, y: 250, zoom: 1 }); return; }
    if (focus.mode === 'stop') { setCamera({ x: selected.x, y: selected.y, zoom: 5 }); return; }
    const from = journey.previous;
    const to = journey.next || from;
    let dx = to.x - from.x;
    if (dx > 500) dx -= 1000;
    if (dx < -500) dx += 1000;
    const zoom = clamp(Math.min(size.width / baseScale / (Math.abs(dx) + 125), size.height / baseScale / (Math.abs(to.y - from.y) + 110)), 1, 10);
    setCamera({ x: wrapX(from.x + dx / 2), y: (from.y + to.y) / 2, zoom });
  }, [focus, selected.x, selected.y, journey.previous, journey.next, size.width, size.height, baseScale]);

  const zoomBy = factor => setCamera(old => ({ ...old, zoom: clamp(old.zoom * factor, 1, 12) }));
  const selectNearest = (event, fallback) => {
    const rect = frameRef.current.getBoundingClientRect();
    const x = left + (event.clientX - rect.left) / scale;
    const y = top + (event.clientY - rect.top) / scale;
    const candidates = CREW_STOPS.map((stop, index) => ({ index, distance: Math.min(...[-1000, 0, 1000].map(offset => Math.hypot(stop.x + offset - x, stop.y - y))) }))
      .filter(item => item.index !== (selectedIndex === 20 || journey.activeIndex === 20 ? 0 : 20)).sort((a, b) => a.distance - b.distance);
    onSelect(candidates[0]?.distance < 24 * pixel ? candidates[0].index : fallback);
  };
  const onPointerDown = event => {
    if (event.button !== 0 || event.target.closest('button, [data-stop]')) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
  };
  const onPointerMove = event => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const before = [...pointers.current.values()];
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const after = [...pointers.current.values()];
    if (after.length === 1) {
      setCamera(old => ({ ...old, x: clamp(old.x - (event.clientX - previous.x) / (baseScale * old.zoom), -500, 1500), y: clamp(old.y - (event.clientY - previous.y) / (baseScale * old.zoom), 0, 500) }));
    } else {
      const distance = points => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const ratio = distance(before) > 0 ? distance(after) / distance(before) : 1;
      setCamera(old => ({ ...old, zoom: clamp(old.zoom * ratio, 1, 12) }));
    }
  };
  const onPointerEnd = event => { pointers.current.delete(event.pointerId); if (!pointers.current.size) setDragging(false); };
  const completed = getCrewRoutePath([...CREW_STOPS.slice(0, journey.activeIndex + 1), journey.position]);
  const activeRoute = journey.next ? getCrewRoutePath([journey.previous, journey.next]) : '';

  return <div className={`exp-map ${dragging ? 'is-dragging' : ''}`} ref={frameRef}>
    <svg className="exp-atlas" viewBox={`${left} ${top} ${width} ${height}`} role="group" aria-label="Interactive crew journey map. Drag to explore or use the map controls."
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>
      <defs><pattern id="exp-grid" width="83.333" height="83.333" patternUnits="userSpaceOnUse"><path d="M 83.333 0 L 0 0 0 83.333" fill="none" stroke="#294653" strokeWidth=".5" vectorEffect="non-scaling-stroke" /></pattern></defs>
      <rect x={left} y={top} width={width} height={height} fill="#09212c" />
      <rect x={left} y={top} width={width} height={height} fill="url(#exp-grid)" />
      {[-1000, 0, 1000].map(offset => <g key={offset} transform={`translate(${offset} 0)`}>
        <g className="exp-land">{CREW_LAND_PATHS.map((d, index) => <path key={index} d={d} fillRule="evenodd" vectorEffect="non-scaling-stroke" />)}</g>
        <path d={getCrewRoutePath()} className="exp-route-future" vectorEffect="non-scaling-stroke" />
        <path d={activeRoute} className="exp-route-leg" vectorEffect="non-scaling-stroke" />
        <path d={completed} className="exp-route-complete" vectorEffect="non-scaling-stroke" />
        {CREW_STOPS.map((stop, index) => {
          if (index === 20 && selectedIndex !== 20 && journey.activeIndex < 20) return null;
          if (index === 0 && (selectedIndex === 20 || journey.activeIndex === 20)) return null;
          const visible = stop.x + offset > left + 16 * pixel && stop.x + offset < left + width - 16 * pixel && stop.y > top + 20 * pixel && stop.y < top + height - 20 * pixel;
          if (!visible) return null;
          const isSelected = index === selectedIndex;
          const reached = stop.meters <= journey.distanceMeters;
          const labelled = isSelected || (camera.zoom > 2 && (index === journey.activeIndex || index === journey.nextIndex));
          return <g key={stop.id} data-stop={stop.id} role="button" tabIndex={0} aria-label={`${stop.label}, ${reached ? 'reached' : 'upcoming'}`} onClick={event => selectNearest(event, index)}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(index); } }} className={`exp-pin ${isSelected ? 'is-selected' : ''}`}>
            <circle cx={stop.x} cy={stop.y} r={20 * pixel} fill="transparent" />
            {isSelected && <circle cx={stop.x} cy={stop.y} r={12 * pixel} fill="#f0c86b" opacity=".18" />}
            <circle cx={stop.x} cy={stop.y} r={(isSelected ? 5 : 3.5) * pixel} fill={isSelected ? '#f0c86b' : reached ? '#79dfc4' : '#486975'} stroke="#09212c" strokeWidth={2 * pixel} />
            {labelled && <g pointerEvents="none"><rect x={stop.x - (stop.label.length * 3.2 + 9) * pixel} y={stop.y + 12 * pixel} width={(stop.label.length * 6.4 + 18) * pixel} height={23 * pixel} rx={6 * pixel} fill="#09212c" fillOpacity=".94" />
              <text x={stop.x} y={stop.y + 27 * pixel} textAnchor="middle" fill={isSelected ? '#f5d997' : '#c4d8df'} fontSize={11 * pixel} fontWeight="600">{stop.label}</text></g>}
          </g>;
        })}
        <g transform={`translate(${journey.position.x} ${journey.position.y})`} className="exp-boat" pointerEvents="none">
          <circle r={13 * pixel} fill="#79dfc4" opacity=".14" /><circle r={7 * pixel} fill="#79dfc4" stroke="#09212c" strokeWidth={2 * pixel} />
          <path d={`M ${-3 * pixel} ${2 * pixel} L 0 ${-4 * pixel} L ${3 * pixel} ${2 * pixel} Z`} fill="#09212c" />
        </g>
      </g>)}
    </svg>
    <div className="exp-map-top"><span><span className="exp-live-dot" /> The crew is here</span><span>Virtual expedition</span></div>
    <div className="exp-zoom"><button onClick={() => zoomBy(1.5)} disabled={camera.zoom >= 12} aria-label="Zoom in">+</button><button onClick={() => zoomBy(1 / 1.5)} disabled={camera.zoom <= 1} aria-label="Zoom out">−</button></div>
    <div className="exp-map-bottom"><span>Drag to explore · pinch to zoom</span><span>Natural Earth · public domain</span></div>
  </div>;
}

function Expedition({ onClose }) {
  const { users = {}, metricUsers, totalMeters, currentUser, setShowLogModal, handleSignIn } = useApp();
  const journey = getCrewJourney(totalMeters);
  const [tab, setTab] = useState('map');
  const [selectedIndex, setSelectedIndex] = useState(journey.nextIndex ?? journey.activeIndex);
  const [focus, setFocus] = useState({ mode: 'leg' });
  const dialogRef = useRef(null);
  const scrollRef = useRef(null);
  const closeRef = useRef(null);
  const stop = CREW_STOPS[selectedIndex];
  const reached = stop.meters <= journey.distanceMeters;
  const memberProfiles = metricUsers === undefined ? users : metricUsers || {};
  const members = Object.entries(memberProfiles).map(([id, user]) => ({ ...user, id, meters: positive(user?.totalMeters) })).filter(user => user.meters > 0).sort((a, b) => b.meters - a.meters || a.id.localeCompare(b.id));
  const crewTotal = members.reduce((sum, member) => sum + member.meters, 0);
  const own = members.find(member => member.id === currentUser?.uid);
  const nextMilestone = MILESTONES.find(milestone => milestone.meters > journey.distanceMeters);
  const selectStop = index => { setSelectedIndex(index); setFocus({ mode: 'stop' }); };
  const returnToCrew = () => { setSelectedIndex(journey.nextIndex ?? journey.activeIndex); setFocus({ mode: 'leg' }); };

  useEffect(() => {
    if (focus.mode === 'leg') setSelectedIndex(journey.nextIndex ?? journey.activeIndex);
  }, [focus.mode, journey.nextIndex, journey.activeIndex]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [tab]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const keydown = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const nodes = [...dialogRef.current.querySelectorAll('button:not([disabled]), summary, [tabindex="0"]')].filter(node => !node.closest('details:not([open])') || node.tagName === 'SUMMARY');
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!dialogRef.current.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previousFocus?.focus(); };
  }, [onClose]);

  const log = () => { onClose(); if (currentUser) setShowLogModal(true); else handleSignIn(); };
  return <div className="exp-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="exp-dialog" role="dialog" aria-modal="true" aria-labelledby="exp-title" ref={dialogRef}>
      <header className="exp-header"><div><span className="exp-eyebrow">The expedition</span><h2 id="exp-title">A world to row.</h2></div><button className="exp-close" ref={closeRef} onClick={onClose} aria-label="Close crew map"><span aria-hidden="true">×</span></button></header>
      <div className="exp-summary"><div><strong>{km(journey.totalMeters)}</strong><span>rowed together</span></div><div><strong>{journey.visitedStops}<small> / {CREW_STOPS.length - 1}</small></strong><span>stops reached</span></div><div><strong>{journey.progressPct.toFixed(1)}<small>%</small></strong><span>around the world</span></div></div>
      <nav className="exp-tabs" aria-label="Crew journey view">{[{ id: 'map', label: 'Explore', icon: 'ui_globe' }, { id: 'passport', label: 'Passport', icon: 'ui_pin' }, { id: 'crew', label: 'The crew', icon: 'ui_users' }].map(item => <button key={item.id} aria-pressed={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><Icon name={item.icon} size={17} />{item.label}</button>)}</nav>
      <div className="exp-scroll" ref={scrollRef}>
        {tab === 'map' && <>
          <div className="exp-map-toolbar"><div><span className="exp-eyebrow">{journey.next ? 'On this leg' : 'Expedition complete'}</span><strong>{journey.previous.label}{journey.next ? ` → ${journey.next.label}` : ' · Welcome home'}</strong></div><div className="exp-map-modes"><button onClick={returnToCrew} aria-pressed={focus.mode === 'leg'}>Our boat</button><button onClick={() => setFocus({ mode: 'world' })} aria-pressed={focus.mode === 'world'}>World</button></div></div>
          <ExpeditionMap journey={journey} selectedIndex={selectedIndex} focus={focus} onSelect={selectStop} />
          <div className="exp-destination" aria-live="polite"><div className="exp-destination-heading"><div><span className="exp-eyebrow">{reached ? 'In your passport' : selectedIndex === journey.nextIndex ? 'Next landfall' : 'On the horizon'}</span><h3>{stop.label}</h3><p>{stop.country}</p></div><span className={`exp-stamp ${reached ? 'reached' : ''}`}><Icon name={reached ? 'ui_check' : 'ui_pin'} size={24} /><small>{reached ? 'REACHED' : `STOP ${String(selectedIndex).padStart(2, '0')}`}</small></span></div><p className="exp-destination-copy">{stop.description}</p>
            <div className="exp-destination-progress"><strong>{reached ? 'You made it here together.' : `${km(stop.meters - journey.distanceMeters)} to reach ${stop.label}`}</strong><span>{km(stop.meters)} on the route</span></div>
            {selectedIndex === journey.nextIndex && <progress aria-label="Current leg progress" max="1" value={journey.legProgress} />}
            <div className="exp-stop-navigation"><button disabled={selectedIndex === 0} onClick={() => selectStop(selectedIndex - 1)}>Previous stop</button><button disabled={selectedIndex === CREW_STOPS.length - 1} onClick={() => selectStop(selectedIndex + 1)}>Next stop</button></div>
          </div>
          <div className="exp-next-win"><Icon name="ui_sparkle" size={20} /><div><strong>{nextMilestone ? `Next crew milestone: ${nextMilestone.label}` : 'A whole world, rowed together.'}</strong><p>{nextMilestone ? `${km(nextMilestone.meters - journey.distanceMeters)} until the crew’s next milestone.` : `${km(WORLD_METERS)} in the books. Every extra meter is part of the story.`}</p></div></div>
        </>}
        {tab === 'passport' && <div className="exp-passport"><div className="exp-section-intro"><span className="exp-eyebrow">The places we’ll go</span><h3>One crew. Twenty stops.</h3><p>From Seattle, across the Pacific and all the way home. Tap a destination to explore the map.</p></div><div className="exp-stop-list">{CREW_STOPS.map((destination, index) => <button key={destination.id} className={`exp-passport-stop ${destination.meters <= journey.distanceMeters ? 'reached' : ''} ${journey.nextIndex === index ? 'is-next' : ''}`} onClick={() => { selectStop(index); setTab('map'); }}><span className="exp-passport-number">{destination.meters <= journey.distanceMeters ? <Icon name="ui_check" size={18} /> : String(index).padStart(2, '0')}</span><span><strong>{destination.label}</strong><small>{destination.country} · {km(destination.meters)}</small></span><span className="exp-passport-status">{index === 0 ? 'Departure' : destination.meters <= journey.distanceMeters ? 'Reached' : journey.nextIndex === index ? 'Up next' : '→'}</span></button>)}</div>
          <details className="exp-milestones"><summary>All the smaller milestones along the way</summary>{MILESTONES.map(milestone => <div key={milestone.meters}><Icon name={milestone.meters <= journey.distanceMeters ? 'ui_check' : milestone.emoji} size={18} /><span><strong>{milestone.label}</strong><small>{milestone.comparison}</small></span><span>{milestone.meters <= journey.distanceMeters ? 'Reached' : `${km(milestone.meters - journey.distanceMeters)} away`}</span></div>)}</details>
        </div>}
        {tab === 'crew' && <div className="exp-crew"><div className="exp-section-intro"><span className="exp-eyebrow">Every seat matters</span><h3>{members.length ? `${members.length} ${members.length === 1 ? 'rower' : 'rowers'}. One boat.` : 'There’s a seat for you.'}</h3><p>The whole crew’s lifetime distance powers this expedition.</p></div>
          {own && <div className="exp-own-share"><Icon name="ui_rowing" size={26} /><div><span>Your part of the journey</span><strong>{km(own.meters)}</strong><small>{crewTotal ? (own.meters / crewTotal * 100).toFixed(1) : 0}% of the crew’s distance</small></div></div>}
          {members.length ? members.map(member => <div className={`exp-member ${member.id === currentUser?.uid ? 'is-you' : ''}`} key={member.id}><AvatarOrPhoto user={member} size={38} /><div className="exp-member-info"><strong>{member.name || 'Crew member'}{member.id === currentUser?.uid ? ' (you)' : ''}</strong><small>{getUserRank(member.meters).title}</small><span className="exp-member-track"><span style={{ width: `${crewTotal ? member.meters / crewTotal * 100 : 0}%` }} /></span></div><div className="exp-member-distance"><strong>{km(member.meters)}</strong><small>{crewTotal ? (member.meters / crewTotal * 100).toFixed(1) : 0}%</small></div></div>) : <p className="exp-empty">The first saved row starts our trip from Seattle.</p>}
        </div>}
        <details className="exp-about"><summary>About this expedition</summary><p>This is a shared virtual journey powered by the whole crew’s logged distance. Destination thresholds are game milestones, not geographic travel distances or live rower locations. Manual and photo rows both move the boat.</p><p>Map geography: Natural Earth, public domain.</p></details>
      </div>
      <footer className="exp-footer"><div><strong>{journey.next ? 'Your next row moves us all.' : 'Keep the story going.'}</strong><span>{journey.next ? `${km(journey.remainingOnLeg)} to ${journey.next.label}` : 'The world is in your passport.'}</span></div><button onClick={log}><Icon name="ui_plus" size={18} />{currentUser ? 'Add a row' : 'Join the crew'}</button></footer>
    </section>
  </div>;
}

export default function CrewMap() {
  const { showCrewMap, setShowCrewMap } = useApp();
  const onClose = React.useCallback(() => setShowCrewMap(false), [setShowCrewMap]);
  return showCrewMap ? <Expedition onClose={onClose} /> : null;
}
