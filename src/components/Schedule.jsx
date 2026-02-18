import React, { useState, useEffect, useRef } from 'react';

const CATEGORIES = {
  Dzieci:       { colorVar: '--sched-dzieci',       bgVar: '--sched-dzieci-bg',       emoji: '🧒' },
  Juniorzy:     { colorVar: '--sched-juniorzy',     bgVar: '--sched-juniorzy-bg',     emoji: '🧑' },
  Dorośli:      { colorVar: '--sched-dorosli',      bgVar: '--sched-dorosli-bg',      emoji: '🧗' },
  Indywidualne: { colorVar: '--sched-indywidualne', bgVar: '--sched-indywidualne-bg', emoji: '⭐' },
};

const DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
const DAYS_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8–22
const DESKTOP_SLOT_HEIGHT = 60;

const SCHEDULE = {
  Poniedziałek: [
    { start: 9,    end: 10.5, category: 'Dzieci',       name: 'Wspinaczka dla dzieci',  level: 'Początkujący',  desc: 'Zajęcia wprowadzające dla dzieci w wieku 6–10 lat. Nauka podstawowych technik wspinania, bezpiecznego upadania i pracy w zespole. Wymagany strój sportowy.' },
    { start: 11,   end: 12.5, category: 'Juniorzy',     name: 'Trening juniorów',       level: 'Średniozaawansowany', desc: 'Intensywny trening dla juniorów (11–17 lat) z naciskiem na siłę palców, technikę nóg i czytanie dróg. Wymagane wcześniejsze doświadczenie.' },
    { start: 16,   end: 17.5, category: 'Dzieci',       name: 'Zajęcia podstawowe',     level: 'Początkujący',  desc: 'Grupowe zajęcia dla dzieci stawiających pierwsze kroki na ścianie. Elementy zabawy, gry i ćwiczenia koordynacyjne w bezpiecznym środowisku.' },
    { start: 18,   end: 19.5, category: 'Dorośli',      name: 'Technika prowadzenia',   level: 'Zaawansowany', desc: 'Warsztaty dla dorosłych skupione na technice prowadzenia — wkładanie ekspresów, asekuracja lidera, psychologia trudnych sektorów.' },
    { start: 20,   end: 21,   category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Średniozaawansowany', desc: 'Zajęcia 1:1 dostosowane do Twoich celów i poziomu. Analiza techniki, plan treningowy i praca nad słabymi stronami. Rezerwacja wymagana.' },
  ],
  Wtorek: [
    { start: 10,   end: 11.5, category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Zaawansowany', desc: 'Prywatna sesja z trenerem. Idealny dla osób chcących szybko przejść na wyższy poziom lub pracować nad konkretnym problemem technicznym.' },
    { start: 15,   end: 16.5, category: 'Juniorzy',     name: 'Bouldering juniorów',    level: 'Średniozaawansowany', desc: 'Trening boulderingowy dla młodzieży — rozwiązywanie problemów, kreatywność ruchowa i przygotowanie do zawodów boulderingowych.' },
    { start: 17,   end: 18.5, category: 'Dorośli',      name: 'Wspinaczka skałkowa',    level: 'Początkujący',  desc: 'Przygotowanie do wspinaczki na naturalnym terenie: praca z liną, czytanie skały, techniki asekuracji i planowanie wyjazdu na skały.' },
    { start: 19,   end: 20.5, category: 'Dorośli',      name: 'Siła i kondycja',        level: 'Zaawansowany', desc: 'Trening ogólnorozwojowy dla wspinaczy — siła palców, antagoniści, core i wytrzymałość. Uzupełnienie typowych zajęć na ścianie.' },
  ],
  Środa: [
    { start: 9,    end: 10.5, category: 'Dzieci',       name: 'Zabawa na ścianie',      level: 'Początkujący',  desc: 'Luźne zajęcia tematyczne dla dzieci — każde spotkanie to inna przygoda! Bajkowe trasy, konkursy i wspólna zabawa na ścianie.' },
    { start: 11,   end: 12,   category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Średniozaawansowany', desc: 'Godzinna sesja indywidualna skoncentrowana na jednym wybranym aspekcie technicznym. Szybkie i efektywne poprawki.' },
    { start: 16,   end: 17.5, category: 'Dzieci',       name: 'Wspinaczka dla dzieci',  level: 'Początkujący',  desc: 'Regularne zajęcia grupy dziecięcej z podziałem na poziomy. Praca nad techniką nóg, siłą chwytu i odwagą na ścianie.' },
    { start: 18,   end: 19.5, category: 'Juniorzy',     name: 'Zaawansowany trening',   level: 'Zaawansowany', desc: 'Trening dla juniorów z ambicjami startowymi. Wyczynowe podejście do treningu, przygotowanie mentalne i analiza błędów.' },
    { start: 20,   end: 21.5, category: 'Dorośli',      name: 'Bouldering',             level: 'Średniozaawansowany', desc: 'Otwarty trening boulderingowy dla dorosłych. Praca nad dynamiką, równowagą i kreatywnością ruchową na problemach różnych poziomów.' },
  ],
  Czwartek: [
    { start: 10,   end: 11.5, category: 'Dorośli',      name: 'Technika wspinania',     level: 'Zaawansowany', desc: 'Zajęcia skupione wyłącznie na technice — praca nad pozycją ciała, precyzją stóp i efektywnym użyciem nóg zamiast siły ramion.' },
    { start: 15,   end: 16.5, category: 'Juniorzy',     name: 'Trening juniorów',       level: 'Początkujący',  desc: 'Czwartkowa sesja juniorów łącząca pracę na ścianie prowadzonej i boulderingu. Indywidualne podejście do każdego zawodnika.' },
    { start: 17,   end: 18,   category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Zaawansowany', desc: 'Sesja 1:1 z video-analizą wspinania. Nagranie, omówienie i plan korekcji na kolejne tygodnie.' },
    { start: 18.5, end: 20,   category: 'Dorośli',      name: 'Droga klasyczna',        level: 'Średniozaawansowany', desc: 'Warsztaty skupione na wspinaniu klasycznym — zakładanie przelotów, asekuracja wierzchołkowa i techniki zjazdu na linie.' },
  ],
  Piątek: [
    { start: 9,    end: 10.5, category: 'Dzieci',       name: 'Wspinaczka dla dzieci',  level: 'Początkujący',  desc: 'Piątkowe zajęcia dla dzieci — podsumowanie tygodnia na ścianie. Testy postępów i małe wyzwania dla każdego uczestnika.' },
    { start: 16,   end: 17.5, category: 'Dzieci',       name: 'Zajęcia weekendowe',     level: 'Początkujący',  desc: 'Grupowe zajęcia na początku weekendu — idealne dla dzieci szkolnych. Aktywna forma spędzenia wolnego czasu po tygodniu nauki.' },
    { start: 17,   end: 18.5, category: 'Juniorzy',     name: 'Bouldering juniorów',    level: 'Średniozaawansowany', desc: 'Wolna sesja boulderingowa z opcjonalną asystą trenera. Juniorzy samodzielnie eksplorują ścianę i pracują nad wyznaczonymi celami.' },
    { start: 19,   end: 20.5, category: 'Dorośli',      name: 'Wieczór wspinaczkowy',   level: 'Zaawansowany', desc: 'Relaksacyjny wieczór na ścianie dla dorosłych. Mix wspinania towarzyskiego i technicznego w luźnej atmosferze końca tygodnia.' },
    { start: 20.5, end: 22,   category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Średniozaawansowany', desc: 'Wieczorna sesja indywidualna dla osób z napiętym harmonogramem. Elastyczny program dopasowany do potrzeb klienta.' },
  ],
  Sobota: [
    { start: 9,    end: 11,   category: 'Dzieci',       name: 'Wspinaczka weekendowa',  level: 'Początkujący',  desc: 'Dwugodzinne sobotnie zajęcia dla dzieci — dłuższy format pozwala na więcej zabaw tematycznych i gruntowną pracę techniczną.' },
    { start: 10,   end: 12,   category: 'Juniorzy',     name: 'Zawody treningowe',      level: 'Zaawansowany', desc: 'Wewnętrzne zawody treningowe dla juniorów. Symulacja prawdziwych zawodów — czas, flash, on-sight. Doskonale przygotowuje do startów.' },
    { start: 13,   end: 15,   category: 'Dorośli',      name: 'Technika i siła',        level: 'Średniozaawansowany', desc: 'Kompleksowy trening łączący pracę techniczną na ścianie z ćwiczeniami siłowymi. Idealne połączenie dla wszechstronnego rozwoju.' },
    { start: 15,   end: 16,   category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Początkujący',  desc: 'Weekendowa sesja indywidualna — czas na szczegółową pracę nad techniką bez pośpiechu, z pełnym skupieniem trenera.' },
    { start: 16,   end: 18,   category: 'Dorośli',      name: 'Bouldering otwarty',     level: 'Zaawansowany', desc: 'Otwarty popołudniowy bouldering dla dorosłych w każdym poziomie. Trener dostępny do konsultacji, luźna atmosfera weekendowa.' },
  ],
  Niedziela: [
    { start: 10,   end: 12,   category: 'Dzieci',       name: 'Rodzinne wspinanie',     level: 'Początkujący',  desc: 'Wyjątkowe zajęcia dla całych rodzin — rodzice i dzieci wspinają się razem! Trener prowadzi obie grupy równolegle. Brak wymagań wstępnych.' },
    { start: 12,   end: 14,   category: 'Juniorzy',     name: 'Trening niedzielny',     level: 'Średniozaawansowany', desc: 'Niedzielna sesja dla juniorów z naciskiem na regenerację i technikę. Mniej intensywna, bardziej eksploracyjna forma treningu.' },
    { start: 14,   end: 16,   category: 'Dorośli',      name: 'Wspinaczka rekreacyjna', level: 'Zaawansowany', desc: 'Rekreacyjna wspinaczka dla dorosłych — bez presji, bez intensywności. Idealne zakończenie weekendu dla miłośników aktywnego relaksu.' },
    { start: 16,   end: 17,   category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Początkujący',  desc: 'Ostatnia niedzielna sesja tygodnia. Idealna na podsumowanie postępów i zaplanowanie celów na nadchodzący tydzień treningowy.' },
  ],
};

const CSS_VARS = `
  :root {
    --sched-dzieci: #c53030;
    --sched-dzieci-bg: #fff5f5;
    --sched-juniorzy: #2b6cb0;
    --sched-juniorzy-bg: #ebf8ff;
    --sched-dorosli: #276749;
    --sched-dorosli-bg: #f0fff4;
    --sched-indywidualne: #b7791f;
    --sched-indywidualne-bg: #fffff0;
    --sched-header-bg: #4a4a4a;
    --sched-header-border: #666666;
    --sched-border: #e2e8f0;
    --sched-line: #edf2f7;
    --sched-timecol-bg: #f5f5f5;
    --sched-time-label: #a0aec0;
    --sched-legend-bg: #f5f5f5;
    --sched-text: #3a3a3a;
    --sched-subtext: #718096;
    --sched-btn-border: #e2e8f0;
    --sched-event-text: #3a3a3a;
  }
  [data-theme='dark'] {
    --sched-dzieci: #fc8181;
    --sched-dzieci-bg: #2d1515;
    --sched-juniorzy: #63b3ed;
    --sched-juniorzy-bg: #1a2a3d;
    --sched-dorosli: #68d391;
    --sched-dorosli-bg: #1a2d1f;
    --sched-indywidualne: #f6e05e;
    --sched-indywidualne-bg: #2d2710;
    --sched-header-bg: #2a2a2a;
    --sched-header-border: #444444;
    --sched-border: #3a3a3a;
    --sched-line: #333333;
    --sched-timecol-bg: #1a1a1a;
    --sched-time-label: #666666;
    --sched-legend-bg: #1a1a1a;
    --sched-text: #e2e8f0;
    --sched-subtext: #909090;
    --sched-btn-border: #3a3a3a;
    --sched-event-text: #e2e8f0;
  }

  /* Mobile-only animations */
  @keyframes sched-event-pop {
    from { opacity: 0; transform: scaleY(0.85); }
    to   { opacity: 1; transform: scaleY(1); }
  }
  .sched-event-pop { animation: sched-event-pop 0.18s ease both; transform-origin: top center; }

  /* Popup */
  @keyframes sched-popup-in {
    from { opacity: 0; transform: scale(0.92) translateY(4px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .sched-popup {
    animation: sched-popup-in 0.18s cubic-bezier(0.34,1.56,0.64,1) both;
  }
`;

function fmt(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h % 1) * 60);
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function useSlide() {
  const [offset, setOffset] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  // offset: current visual x offset (0 = in place, positive = from right, negative = from left)
  const slide = (direction) => {
    // direction: 'left' means new content comes from right (+), 'right' means from left (-)
    const startX = direction === 'left' ? 100 : -100;
    setTransitioning(false);
    setOffset(startX);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitioning(true);
        setOffset(0);
      });
    });
  };
  return [offset, transitioning, slide];
}

// Light-mode category colors (hardcoded so they stay consistent in dark mode too)
const CATEGORY_LIGHT = {
  Dzieci:       { bg: '#fff5f5', color: '#c53030' },
  Juniorzy:     { bg: '#ebf8ff', color: '#2b6cb0' },
  Dorośli:      { bg: '#f0fff4', color: '#276749' },
  Indywidualne: { bg: '#fffff0', color: '#b7791f' },
};

function EventPopup({ event, onClose }) {
  const cat = CATEGORIES[event.category];
  const lightCat = CATEGORY_LIGHT[event.category];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(3px)',
        }}
      />
      {/* Popup card */}
      <div
        className="sched-popup"
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
          width: 'min(360px, 92vw)',
          backgroundColor: 'var(--ifm-background-color, #ffffff)',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Photo placeholder */}
        <div style={{
          width: '100%',
          height: 160,
          backgroundColor: lightCat.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: `3px solid ${lightCat.color}`,
        }}>
          {/* placeholder illustration */}
          <div style={{
            fontSize: '4.5rem',
            opacity: 0.25,
            userSelect: 'none',
            filter: 'grayscale(0.2)',
          }}>
            🧗
          </div>
          <div style={{
            position: 'absolute', bottom: 8, right: 10,
            fontSize: '0.65rem', color: lightCat.color,
            opacity: 0.6, fontStyle: 'italic',
          }}>
            zdjęcie zajęć
          </div>
          {/* Close button in top-right */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(255,255,255,0.75)',
              border: 'none', borderRadius: 20,
              color: '#333', fontSize: '0.85rem',
              cursor: 'pointer', padding: '3px 8px',
              lineHeight: 1.4, fontWeight: 700,
              backdropFilter: 'blur(4px)',
            }}
          >✕</button>
        </div>

        {/* Colored category label + title — always uses intense light-mode colors */}
        <div style={{
          padding: '12px 16px 10px',
          backgroundColor: lightCat.color,
          borderBottom: `3px solid ${lightCat.color}`,
        }}>
          <div style={{
            fontSize: '0.68rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.85)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            marginBottom: 4,
          }}>
            {cat.emoji} {event.category}
          </div>
          <div style={{
            fontSize: '1.05rem', fontWeight: 700,
            color: '#fff',
            lineHeight: 1.25,
          }}>
            {event.name}
          </div>
        </div>

        {/* Body */}
        <div style={{
          padding: '12px 16px 16px',
          backgroundColor: 'var(--ifm-background-color, #ffffff)',
        }}>
          {/* Meta row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--sched-subtext)' }}>
              🕐 <strong style={{ color: 'var(--sched-text)' }}>{fmt(event.start)} – {fmt(event.end)}</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--sched-subtext)' }}>
              🏔️ <strong style={{ color: 'var(--sched-text)' }}>{event.level}</strong>
            </div>
          </div>
          {/* Description */}
          <p style={{
            margin: 0, fontSize: '0.85rem', lineHeight: 1.6,
            color: 'var(--sched-text)',
            borderTop: '1px solid var(--sched-border)',
            paddingTop: 12,
          }}>
            {event.desc}
          </p>
        </div>
      </div>
    </>
  );
}

// Desktop: static slot height
function DesktopDayColumn({ day, filter }) {
  const [popup, setPopup] = useState(null);
  const isVisible = (e) => filter === 'Wszystkie' || e.category === filter;
  const events = (SCHEDULE[day] || []).filter(isVisible);
  return (
    <>
      {popup && <EventPopup event={popup} onClose={() => setPopup(null)} />}
      <div style={{ position: 'relative', height: HOURS.length * DESKTOP_SLOT_HEIGHT, borderLeft: '1px solid var(--sched-border)' }}>
        {HOURS.map((_, i) => i > 0 && (
          <div key={i} style={{ position: 'absolute', top: i * DESKTOP_SLOT_HEIGHT, left: 0, right: 0, borderTop: '1px solid var(--sched-line)', pointerEvents: 'none' }} />
        ))}
        {events.map((ev, idx) => {
          const cat = CATEGORIES[ev.category];
          const top = (ev.start - 8) * DESKTOP_SLOT_HEIGHT;
          const height = (ev.end - ev.start) * DESKTOP_SLOT_HEIGHT - 4;
          return (
            <div
              key={idx}
              onClick={() => setPopup(ev)}
              style={{
                position: 'absolute', top, height, left: 3, right: 3,
                backgroundColor: `var(${cat.bgVar})`,
                borderLeft: `3px solid var(${cat.colorVar})`,
                borderRadius: 6, padding: '3px 5px', overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)', cursor: 'pointer', zIndex: 1,
                transition: 'box-shadow 0.15s, filter 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)'; e.currentTarget.style.filter = 'brightness(0.97)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'; e.currentTarget.style.filter = 'none'; }}
            >
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: `var(${cat.colorVar})`, lineHeight: 1.2 }}>
                {fmt(ev.start)}–{fmt(ev.end)}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--sched-event-text)', lineHeight: 1.3, overflow: 'hidden' }}>
                {ev.name}
              </div>
              {height >= 48 && (
                <div style={{ fontSize: '0.62rem', color: 'var(--sched-subtext)', marginTop: 1 }}>🏔️ {ev.level}</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function DesktopTimeColumn() {
  return (
    <div style={{ position: 'relative', height: HOURS.length * DESKTOP_SLOT_HEIGHT, borderRight: '1px solid var(--sched-border)', backgroundColor: 'var(--sched-timecol-bg)' }}>
      {HOURS.map((h, i) => (
        <div key={h}>
          {i > 0 && <div style={{ position: 'absolute', top: i * DESKTOP_SLOT_HEIGHT, left: 0, right: 0, borderTop: '1px solid var(--sched-line)' }} />}
          <div style={{ position: 'absolute', top: i * DESKTOP_SLOT_HEIGHT + 3, left: 0, right: 0, textAlign: 'center', fontSize: '0.68rem', color: 'var(--sched-time-label)' }}>
            {h}:00
          </div>
        </div>
      ))}
    </div>
  );
}

// Mobile: dynamic slot height fills screen
function MobileDayColumn({ day, filter, slotH }) {
  const [popup, setPopup] = useState(null);
  const isVisible = (e) => filter === 'Wszystkie' || e.category === filter;
  const events = (SCHEDULE[day] || []).filter(isVisible);
  return (
    <>
      {popup && <EventPopup event={popup} onClose={() => setPopup(null)} />}
      <div style={{ position: 'relative', height: HOURS.length * slotH, borderLeft: '1px solid var(--sched-border)' }}>
        {HOURS.map((_, i) => i > 0 && (
          <div key={i} style={{ position: 'absolute', top: i * slotH, left: 0, right: 0, borderTop: '1px solid var(--sched-line)', pointerEvents: 'none' }} />
        ))}
        {events.map((ev, idx) => {
          const cat = CATEGORIES[ev.category];
          const top = (ev.start - 8) * slotH;
          const height = (ev.end - ev.start) * slotH - 3;
          return (
            <div
              key={idx}
              className="sched-event-pop"
              onClick={() => setPopup(ev)}
            style={{
              position: 'absolute', top, height, left: 3, right: 3,
              backgroundColor: `var(${cat.bgVar})`,
              borderLeft: `3px solid var(${cat.colorVar})`,
              borderRadius: 5, padding: '2px 5px', overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)', cursor: 'pointer', zIndex: 1,
              animationDelay: `${idx * 25}ms`,
            }}
            >
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: `var(${cat.colorVar})`, lineHeight: 1.2 }}>
                {fmt(ev.start)}–{fmt(ev.end)}
              </div>
              {height >= 28 && (
                <div style={{ fontSize: '0.63rem', fontWeight: 600, color: 'var(--sched-event-text)', lineHeight: 1.2, overflow: 'hidden' }}>
                  {ev.name}
                </div>
              )}
              {height >= 52 && (
                <div style={{ fontSize: '0.58rem', color: 'var(--sched-subtext)', marginTop: 1 }}>🏔️ {ev.level}</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function MobileTimeColumn({ slotH }) {
  return (
    <div style={{ position: 'relative', height: HOURS.length * slotH, borderRight: '1px solid var(--sched-border)', backgroundColor: 'var(--sched-timecol-bg)' }}>
      {HOURS.map((h, i) => (
        <div key={h}>
          {i > 0 && <div style={{ position: 'absolute', top: i * slotH, left: 0, right: 0, borderTop: '1px solid var(--sched-line)' }} />}
          <div style={{ position: 'absolute', top: i * slotH + 2, left: 0, right: 0, textAlign: 'center', fontSize: '0.6rem', color: 'var(--sched-time-label)' }}>
            {h}:00
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileView({ filter }) {
  const [dayIndex, setDayIndex] = useState(0);
  const [offset, transitioning, slide] = useSlide();
  const [slotH, setSlotH] = useState(40);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const navRef = useRef(null);
  const dotsRef = useRef(null);

  // Calculate slot height: fills viewport minus everything ABOVE the grid (no legend)
  useEffect(() => {
    const calc = () => {
      const navH = navRef.current ? navRef.current.offsetHeight : 56;
      const dotsH = dotsRef.current ? dotsRef.current.offsetHeight : 22;
      const headerH = 32; // grid header row
      const titleH = 52; // title + subtitle
      const filtersH = 42; // category filter buttons
      const margins = 32; // misc gaps/padding
      const reserved = titleH + filtersH + navH + dotsH + headerH + margins;
      const available = window.innerHeight - reserved;
      const h = Math.max(22, Math.floor(available / HOURS.length));
      setSlotH(h);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const goTo = (newIndex, direction) => {
    slide(direction);
    setDayIndex(newIndex);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 50 && dy < 60) {
      if (dx < 0 && dayIndex < DAYS.length - 1) goTo(dayIndex + 1, 'left');
      else if (dx > 0 && dayIndex > 0) goTo(dayIndex - 1, 'right');
    }
    touchStartX.current = null;
  };

  const day = DAYS[dayIndex];
  const slideStyle = {
    transform: `translateX(${offset}%)`,
    transition: transitioning ? 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease' : 'none',
    opacity: transitioning ? 1 : (offset === 0 ? 1 : 0),
  };

  return (
    <div>
      {/* Day navigation */}
      <div ref={navRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <button
          onClick={() => dayIndex > 0 && goTo(dayIndex - 1, 'right')}
          disabled={dayIndex === 0}
          style={{
            padding: '5px 13px', borderRadius: 8,
            border: '1px solid var(--sched-btn-border)', backgroundColor: 'transparent',
            color: dayIndex === 0 ? 'var(--sched-btn-border)' : 'var(--sched-text)',
            cursor: dayIndex === 0 ? 'default' : 'pointer', fontSize: '1.1rem',
          }}
        >‹</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--sched-text)' }}>{day}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--sched-subtext)' }}>{dayIndex + 1} / {DAYS.length} · przesuń aby zmienić</div>
        </div>
        <button
          onClick={() => dayIndex < DAYS.length - 1 && goTo(dayIndex + 1, 'left')}
          disabled={dayIndex === DAYS.length - 1}
          style={{
            padding: '5px 13px', borderRadius: 8,
            border: '1px solid var(--sched-btn-border)', backgroundColor: 'transparent',
            color: dayIndex === DAYS.length - 1 ? 'var(--sched-btn-border)' : 'var(--sched-text)',
            cursor: dayIndex === DAYS.length - 1 ? 'default' : 'pointer', fontSize: '1.1rem',
          }}
        >›</button>
      </div>

      {/* Dots */}
      <div ref={dotsRef} style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 6 }}>
        {DAYS.map((_, i) => (
          <div key={i} onClick={() => i !== dayIndex && goTo(i, i > dayIndex ? 'left' : 'right')}
            style={{
              width: i === dayIndex ? 18 : 7, height: 7, borderRadius: 4,
              backgroundColor: i === dayIndex ? 'var(--sched-header-bg)' : 'var(--sched-btn-border)',
              cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        ))}
      </div>

      {/* Swipeable grid */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ overflow: 'hidden', touchAction: 'pan-y', borderRadius: 10, border: '1px solid var(--sched-border)' }}
      >
        <div style={{ ...slideStyle }}>
          <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr' }}>
            <div style={{ backgroundColor: 'var(--sched-header-bg)', color: '#fff', padding: '6px 2px', textAlign: 'center', fontSize: '0.65rem', fontWeight: 600 }}>
              Godz.
            </div>
            <div style={{ backgroundColor: 'var(--sched-header-bg)', color: '#fff', padding: '6px 4px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, borderLeft: '1px solid var(--sched-header-border)' }}>
              {day}
            </div>
            <MobileTimeColumn slotH={slotH} />
            <MobileDayColumn key={`${day}-${filter}`} day={day} filter={filter} slotH={slotH} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopView({ filter, selectedDay, setSelectedDay }) {
  const prevSelectedDay = useRef(selectedDay);

  const handleSetDay = (val) => {
    prevSelectedDay.current = val;
    setSelectedDay(val);
  };

  const displayDays = selectedDay !== null ? [DAYS[selectedDay]] : DAYS;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        <button
          onClick={() => handleSetDay(null)}
          style={{
            padding: '5px 12px', borderRadius: 8,
            border: '1px solid var(--sched-btn-border)',
            backgroundColor: selectedDay === null ? 'var(--sched-header-bg)' : 'transparent',
            color: selectedDay === null ? '#fff' : 'var(--sched-subtext)',
            fontSize: '0.78rem', fontWeight: selectedDay === null ? 700 : 400,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >Cały tydzień</button>
        {DAYS.map((d, i) => (
          <button key={d} onClick={() => handleSetDay(selectedDay === i ? null : i)}
            style={{
              padding: '5px 12px', borderRadius: 8,
              border: '1px solid var(--sched-btn-border)',
              backgroundColor: selectedDay === i ? 'var(--sched-header-bg)' : 'transparent',
              color: selectedDay === i ? '#fff' : 'var(--sched-subtext)',
              fontSize: '0.78rem', fontWeight: selectedDay === i ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >{DAYS_SHORT[i]}</button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `52px repeat(${displayDays.length}, 1fr)`,
          border: '1px solid var(--sched-border)',
          borderRadius: 12, overflow: 'hidden',
          minWidth: displayDays.length > 4 ? 620 : 'auto',
        }}>
          <div style={{ backgroundColor: 'var(--sched-header-bg)', color: '#fff', padding: '8px 4px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 600 }}>
            Godz.
          </div>
          {displayDays.map((day) => (
            <div key={day} style={{ backgroundColor: 'var(--sched-header-bg)', color: '#fff', padding: '8px 4px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 600, borderLeft: '1px solid var(--sched-header-border)' }}>
              {day}
            </div>
          ))}
          <DesktopTimeColumn />
          {displayDays.map((day) => (
            <DesktopDayColumn key={`${day}-${filter}`} day={day} filter={filter} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Schedule() {
  const [filter, setFilter] = useState('Wszystkie');
  const [selectedDay, setSelectedDay] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const id = 'schedule-css-vars';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = CSS_VARS;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div style={{ fontFamily: 'inherit', maxWidth: '100%' }}>
      <div style={{ marginBottom: isMobile ? 10 : 16 }}>
        <h2 style={{ margin: '0 0 2px', fontSize: isMobile ? '1.15rem' : '1.4rem', fontWeight: 700, color: 'var(--sched-text)' }}>
          🧗 Grafik zajęć wspinaczkowych
        </h2>
        <p style={{ margin: 0, color: 'var(--sched-subtext)', fontSize: '0.85rem' }}>
          Godziny: 8:00 – 22:00
        </p>
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {['Wszystkie', ...Object.keys(CATEGORIES)].map((key) => {
          const cat = CATEGORIES[key];
          const active = filter === key;
          return (
            <button key={key} onClick={() => setFilter(key)}
              style={{
                padding: isMobile ? '4px 10px' : '5px 14px',
                borderRadius: 20,
                border: `2px solid ${active ? `var(${cat ? cat.colorVar : '--sched-header-bg'})` : 'var(--sched-btn-border)'}`,
                backgroundColor: active ? `var(${cat ? cat.bgVar : '--sched-header-bg'})` : 'transparent',
                color: active ? `var(${cat ? cat.colorVar : '--ifm-color-white, #fff'})` : 'var(--sched-subtext)',
                fontWeight: active ? 700 : 400,
                fontSize: isMobile ? '0.75rem' : '0.82rem',
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >{cat ? `${cat.emoji} ` : ''}{key}</button>
          );
        })}
      </div>

      {isMobile
        ? <MobileView filter={filter} />
        : <DesktopView filter={filter} selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
      }

      {/* Legend */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        flexWrap: isMobile ? 'nowrap' : 'wrap',
        gap: isMobile ? 6 : 16,
        marginTop: 10,
        padding: isMobile ? '8px 12px' : '10px 14px',
        backgroundColor: 'var(--sched-legend-bg)',
        borderRadius: 8, border: '1px solid var(--sched-border)',
      }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--sched-subtext)', fontWeight: 600 }}>Kategorie:</span>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.8rem', color: `var(${cat.colorVar})`, fontWeight: 500 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: `var(${cat.colorVar})`, flexShrink: 0 }} />
            {cat.emoji} {key}
          </div>
        ))}
      </div>
    </div>
  );
}
