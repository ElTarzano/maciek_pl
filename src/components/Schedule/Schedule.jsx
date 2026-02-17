import React, { useMemo, useState } from 'react';
import styles from './Schedule.module.css';

// Stałe
const DAYS = [
  { key: 'mon', label: 'Poniedziałek' },
  { key: 'tue', label: 'Wtorek' },
  { key: 'wed', label: 'Środa' },
  { key: 'thu', label: 'Czwartek' },
  { key: 'fri', label: 'Piątek' },
  { key: 'sat', label: 'Sobota' },
  { key: 'sun', label: 'Niedziela' },
];

const LOCATION_COLORS = {
  Korona: '#2e7d32',
  Mood: '#1565c0',
  Avatar: '#7b1fa2',
  Cube: '#ef6c00',
  Inne: '#607d8b',
};

const GRID_START = '08:00';
const GRID_END = '22:00';
const SLOT_MINUTES = 30;

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minutesToTime(m) {
  const h = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${h}:${mm}`;
}
const gridStartMin = timeToMinutes(GRID_START);
const gridEndMin = timeToMinutes(GRID_END);
const totalSlots = (gridEndMin - gridStartMin) / SLOT_MINUTES;

function timeToSlot(t) {
  return Math.max(
      0,
      Math.min(totalSlots, Math.round((timeToMinutes(t) - gridStartMin) / SLOT_MINUTES))
  );
}

// ---- DANE (źródło: maciekorlowski.pl/grafik/) ----
const EVENTS = [
  { id: 'mon-ind-1', day: 'mon', title: 'Klienci indywidualni', group: 'Indywidualne', location: 'Korona', start: '16:00', end: '18:00' },
  { id: 'mon-jun-adv-1', day: 'mon', title: 'Juniorzy ADV', group: 'Juniorzy', location: 'Korona', start: '18:00', end: '20:00' },
  { id: 'tue-adults-m1', day: 'tue', title: 'Dorośli M1', group: 'Dorośli', location: 'Mood', start: '15:30', end: '17:30' },
  { id: 'tue-kids-1a', day: 'tue', title: 'Dzieci 1A', group: 'Dzieci', location: 'Mood', start: '18:00', end: '19:00' },
  { id: 'tue-kids-1c', day: 'tue', title: 'Dzieci 1C', group: 'Dzieci', location: 'Mood', start: '19:00', end: '20:00' },
  { id: 'tue-adults-m2', day: 'tue', title: 'Dorośli M2', group: 'Dorośli', location: 'Mood', start: '19:00', end: '20:00' },
  { id: 'wed-adults-k1', day: 'wed', title: 'Dorośli K1', group: 'Dorośli', location: 'Korona', start: '08:00', end: '10:00' },
  { id: 'wed-ind-1', day: 'wed', title: 'Klienci indywidualni', group: 'Indywidualne', location: 'Korona', start: '16:00', end: '18:00' },
  { id: 'wed-adults-k2', day: 'wed', title: 'Dorośli K2', group: 'Dorośli', location: 'Korona', start: '18:00', end: '20:00' },
  { id: 'wed-jun-adv-1', day: 'wed', title: 'Juniorzy ADV', group: 'Juniorzy', location: 'Korona', start: '18:30', end: '20:00' },
  { id: 'thu-ind-1', day: 'thu', title: 'Klienci indywidualni', group: 'Indywidualne', location: 'Avatar', start: '16:00', end: '18:00' },
  { id: 'thu-jun-adv-1', day: 'thu', title: 'Juniorzy ADV', group: 'Juniorzy', location: 'Avatar', start: '18:30', end: '20:00' },
  { id: 'thu-adults-a2', day: 'thu', title: 'Dorośli A2', group: 'Dorośli', location: 'Avatar', start: '19:00', end: '20:00' },
  { id: 'fri-ind-korona', day: 'fri', title: 'Klienci indywidualni', group: 'Indywidualne', location: 'Korona', start: '16:00', end: '18:00' },
  { id: 'fri-ind-cube', day: 'fri', title: 'Klienci indywidualni', group: 'Indywidualne', location: 'Cube', start: '16:00', end: '18:00' },
  { id: 'sat-jun-adv', day: 'sat', title: 'Juniorzy ADV', group: 'Juniorzy', location: 'Inne', note: 'Okazjonalne zawody lub zgrupowania' },
  { id: 'sun-jun-adv', day: 'sun', title: 'Juniorzy ADV', group: 'Juniorzy', location: 'Inne', note: 'Okazjonalne zawody lub zgrupowania' },
];
// -----------------------------------------------

const FILTERS = [
  { key: 'Wszystko', label: 'Wszystko' },
  { key: 'Dorośli', label: 'Dorośli' },
  { key: 'Dzieci', label: 'Dzieci' },
  { key: 'Juniorzy', label: 'Juniorzy' },
  { key: 'Indywidualne', label: 'Indywidualne' },
];

function layoutDay(events) {
  const withTimes = events
      .map((e) => {
        const startSlot = e.start ? timeToSlot(e.start) : undefined;
        const endSlot = e.end ? timeToSlot(e.end) : undefined;
        const top = startSlot !== undefined ? (startSlot / totalSlots) * 100 : 0;
        const height =
            startSlot !== undefined && endSlot !== undefined
                ? ((endSlot - startSlot) / totalSlots) * 100
                : 10;
        return { ...e, top, height };
      })
      .sort((a, b) => {
        const aa = a.start ? timeToMinutes(a.start) : Infinity;
        const bb = b.start ? timeToMinutes(b.start) : Infinity;
        return aa - bb;
      });

  const active = [];
  return withTimes.map((e) => {
    const startMin = e.start ? timeToMinutes(e.start) : -Infinity;
    const endMin = e.end ? timeToMinutes(e.end) : startMin;

    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].end <= startMin) active.splice(i, 1);
    }

    const used = new Set(active.map((a) => a.lane));
    let lane = 0;
    while (used.has(lane)) lane++;

    active.push({ end: endMin, lane });
    const lanes = Math.max(...active.map((a) => a.lane), 0) + 1;

    return { ...e, lane, lanes };
  });
}

export default function Schedule() {
  const [filter, setFilter] = useState('Wszystko');

  const filtered = useMemo(() => {
    return filter === 'Wszystko' ? EVENTS : EVENTS.filter((e) => e.group === filter);
  }, [filter]);

  const byDay = useMemo(() => {
    const map = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
    for (const d of DAYS) {
      const events = filtered.filter((e) => e.day === d.key);
      map[d.key] = layoutDay(events);
    }
    return map;
  }, [filtered]);

  // Etykiety godzin: co 60 min (pełne godziny)
  const hourLabels = useMemo(() => {
    const arr = [];
    for (let t = gridStartMin; t <= gridEndMin; t += 60) {
      arr.push(minutesToTime(t));
    }
    return arr;
  }, []);

  return (
      <div className={styles.wrapper}>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            {FILTERS.map((f) => (
                <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`${styles.filterBtn} ${filter === f.key ? styles.active : ''}`}
                    type="button"
                >
                  {f.label}
                </button>
            ))}
          </div>
          <div className={styles.legend}>
            {Object.entries(LOCATION_COLORS).map(([loc, color]) => (
                <span key={loc} className={styles.legendItem}>
              <span className={styles.colorDot} style={{ backgroundColor: color }} />
                  {loc}
            </span>
            ))}
          </div>
        </div>

        {/* Widok desktop */}
        <div className={styles.grid} style={{ ['--schedule-height']: '42rem' }}>
          {/* Kolumna czasu */}
          <div className={styles.timeCol}>
            <div className={styles.dayHeaderSpacer} />
            <div className={styles.timeBody}>
              {hourLabels.map((h) => (
                  <div key={h} className={styles.timeRow}>{h}</div>
              ))}
            </div>
          </div>

          {/* Kolumny dni */}
          {DAYS.map(({ key, label }) => (
              <div key={key} className={styles.dayCol}>
                <div className={styles.dayHeader}>{label}</div>
                <div className={styles.dayBody}>
                  {/* linie godzinowe */}
                  {hourLabels.map((h, idx) => (
                      <div
                          key={h}
                          className={styles.hourLine}
                          style={{ top: `${(idx / (hourLabels.length - 1)) * 100}%` }}
                      />
                  ))}
                  {/* wydarzenia */}
                  {byDay[key].map((e) => {
                    const color = LOCATION_COLORS[e.location] || LOCATION_COLORS.Inne;
                    const hasTime = e.start && e.end;
                    const style = hasTime
                        ? {
                          top: `${e.top}%`,
                          height: `${e.height}%`,
                          left: e.lanes && e.lanes > 1 ? `${(e.lane / e.lanes) * 100}%` : 0,
                          width: e.lanes && e.lanes > 1 ? `${100 / e.lanes}%` : '100%',
                          backgroundColor: color,
                        }
                        : { position: 'relative', backgroundColor: color };
                    return (
                        <div key={e.id} className={styles.event} style={style} title={`${e.title} • ${e.location}`}>
                          <div className={styles.eventTitle}>{e.title}</div>
                          <div className={styles.eventMeta}>
                            {e.start && e.end ? (
                                <><strong>{e.start}</strong>–<strong>{e.end}</strong> • {e.location}</>
                            ) : (
                                <>{e.note || e.location}</>
                            )}
                          </div>
                        </div>
                    );
                  })}
                </div>
              </div>
          ))}
        </div>

        {/* Widok mobilny */}
        <div className={styles.mobileList}>
          {DAYS.map(({ key, label }) => (
              <div key={key} className={styles.dayCard}>
                <div className={styles.dayCardHeader}>{label}</div>
                <ul className={styles.dayCardList}>
                  {byDay[key].length === 0 && <li className={styles.empty}>Brak zajęć</li>}
                  {byDay[key].map((e) => (
                      <li key={e.id} className={styles.dayCardItem}>
                  <span
                      className={styles.colorDot}
                      style={{ backgroundColor: LOCATION_COLORS[e.location] || LOCATION_COLORS.Inne }}
                  />
                        <div className={styles.itemText}>
                          <div className={styles.itemTitle}>{e.title}</div>
                          <div className={styles.itemMeta}>
                            {e.start && e.end ? `${e.start}–${e.end} • ${e.location}` : (e.note || e.location)}
                          </div>
                        </div>
                      </li>
                  ))}
                </ul>
              </div>
          ))}
        </div>

        <p className={styles.disclaimer}>
          Uwaga: harmonogram może ulec zmianie. Aktualizuj tablicę <code>EVENTS</code> w razie rozbieżności ze stroną źródłową.
        </p>
      </div>
  );
}
