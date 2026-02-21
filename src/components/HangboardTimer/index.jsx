import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './styles.module.css';

/* ============================================================
   Ikony SVG inline
   ============================================================ */
const Svg = ({ children, size = 20, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         style={{ display: 'inline-block', flexShrink: 0 }} {...p}>
        {children}
    </svg>
);

const Icons = {
    Settings:  ({ s = 20 }) => <Svg size={s}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.26 1 1.51.24.1.49.15.75.15H21a2 2 0 1 1 0 4h-.09c-.26 0-.51.05-.75.15-.61.25-1 .85-1 1.51z" /></Svg>,
    Play:      ({ s = 20 }) => <Svg size={s}><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" /></Svg>,
    Pause:     ({ s = 20 }) => <Svg size={s}><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" /></Svg>,
    Reset:     ({ s = 20 }) => <Svg size={s}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" /></Svg>,
    Plus:      ({ s = 20 }) => <Svg size={s}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Svg>,
    Trash:     ({ s = 20 }) => <Svg size={s}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" /></Svg>,
    VolumeOn:  ({ s = 20 }) => <Svg size={s}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></Svg>,
    VolumeOff: ({ s = 20 }) => <Svg size={s}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></Svg>,
    Maximize:  ({ s = 20 }) => <Svg size={s}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></Svg>,
    Minimize:  ({ s = 20 }) => <Svg size={s}><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></Svg>,
    ChevronL:  ({ s = 20 }) => <Svg size={s}><polyline points="15 18 9 12 15 6" /></Svg>,
    ChevronR:  ({ s = 20 }) => <Svg size={s}><polyline points="9 18 15 12 9 6" /></Svg>,
    Activity:  ({ s = 20 }) => <Svg size={s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></Svg>,
    Timer:     ({ s = 20 }) => <Svg size={s}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Svg>,
    Edit:      ({ s = 20 }) => <Svg size={s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>,
    Save:      ({ s = 20 }) => <Svg size={s}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></Svg>,
    Info:      ({ s = 20 }) => <Svg size={s}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></Svg>,
    Close:     ({ s = 20 }) => <Svg size={s}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Svg>,
    List:      ({ s = 20 }) => <Svg size={s}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></Svg>,
    Keyboard:  ({ s = 20 }) => <Svg size={s}><rect x="2" y="6" width="20" height="12" rx="2" ry="2" /><line x1="6" y1="10" x2="6.01" y2="10" /><line x1="10" y1="10" x2="10.01" y2="10" /><line x1="14" y1="10" x2="14.01" y2="10" /><line x1="18" y1="10" x2="18.01" y2="10" /><line x1="8" y1="14" x2="16" y2="14" /></Svg>,
};

/* ============================================================
   Protokoły treningowe
   ============================================================ */
const BUILTIN_WORKOUTS = [
    {
        id: 'repeater-7-3',
        name: 'Repeater 7/3',
        description: 'Klasyczny protokół Erica Horsta. 6 × (7s praca + 3s odpoczynek), 3 min przerwa między seriami.',
        exercises: [
            { id: 'r73-e1', name: 'Cztery palce (20mm)', work: 7, rest: 3, sets: 6, load: 'BW' },
            { id: 'r73-e2', name: 'Trzy palce (20mm)',  work: 7, rest: 3, sets: 6, load: 'BW' },
            { id: 'r73-e3', name: 'Przerwa aktywna',    work: 5, rest: 180, sets: 1, load: '—'  },
        ]
    },
    {
        id: 'maxhang',
        name: 'MaxHang',
        description: 'Protokół Evy López. Maksymalne obciążenie, 10s zwis, pełne 3 min odpoczynku między powtórzeniami.',
        exercises: [
            { id: 'mh-e1', name: 'Zwis maks. (18mm)',         work: 10, rest: 180, sets: 5, load: '+%BW' },
            { id: 'mh-e2', name: 'Full crimp (otwarty chwyt)', work: 10, rest: 180, sets: 3, load: '+%BW' },
        ]
    },
    {
        id: 'ben-moon',
        name: 'Ben Moon',
        description: '10s praca / 5s odpoczynek, 10 powtórzeń. Intensywny protokół wytrzymałościowy stosowany przez Bena Moona.',
        exercises: [
            { id: 'bm-e1', name: 'Zamknięty chwyt (20mm)', work: 10, rest: 5, sets: 10, load: 'BW' },
            { id: 'bm-e2', name: 'Otwarty chwyt (20mm)',   work: 10, rest: 5, sets: 10, load: 'BW' },
        ]
    },
    {
        id: 'min-edge',
        name: 'Min. Edge',
        description: 'Trening siły na minimalnej krawędzi. Krótkie, maksymalnie intensywne zwisy z długim wypoczynkiem.',
        exercises: [
            { id: 'me-e1', name: 'Zwis (10mm)', work: 5, rest: 120, sets: 6, load: '+5–15kg' },
            { id: 'me-e2', name: 'Zwis (8mm)',  work: 5, rest: 120, sets: 4, load: '+5kg'    },
        ]
    },
    {
        id: 'endurance',
        name: 'Wytrzymałość',
        description: 'Protokół tlenowy. Długie zwisy z krótką przerwą — buduje bazową wytrzymałość palców.',
        exercises: [
            { id: 'en-e1', name: 'Ciągły zwis (25mm)', work: 30, rest: 30, sets: 8, load: 'BW' },
            { id: 'en-e2', name: 'Naprzemienne ręce',  work: 20, rest: 10, sets: 6, load: 'BW' },
        ]
    },
    {
        id: 'mocny-chwyt',
        name: 'Mocny Chwyt',
        description: 'Podstawowy protokół siłowy — dobry punkt startowy dla zaawansowanych wspinaczy.',
        exercises: [
            { id: 'mc-e1', name: 'Zwis 20mm', work: 7,  rest: 3,  sets: 6, load: '0kg'  },
            { id: 'mc-e2', name: 'Zwis 15mm', work: 10, rest: 60, sets: 3, load: '+5kg' },
        ]
    },
];

/* ============================================================
   localStorage
   ============================================================ */
const STORAGE_KEY  = 'hangboard_custom_workouts_v2';
const SETTINGS_KEY = 'hangboard_settings_v1';
const loadCustom   = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } };
const saveCustom   = (w) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(w)); } catch {} };
const loadSettings = () => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { return {}; } };
const saveSettings = (s) => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {} };
const newExId      = () => `ex-${Date.now()}-${Math.random().toString(36).slice(2,5)}`;
const emptyEx      = () => ({ id: newExId(), name: '', work: 7, rest: 3, sets: 6, load: 'BW' });

/* ============================================================
   Modal — tworzenie / edycja presetu
   ============================================================ */
function PresetModal({ initial, onSave, onClose }) {
    const [name, setName] = useState(initial?.name || '');
    const [desc, setDesc] = useState(initial?.description || '');
    const [exes, setExes] = useState(initial?.exercises?.length ? initial.exercises.map(e => ({ ...e })) : [emptyEx()]);

    const upd  = (i, f, v) => setExes(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));
    const rm   = (i)       => setExes(p => p.filter((_, idx) => idx !== i));

    const save = () => {
        if (!name.trim()) { alert('Podaj nazwę treningu'); return; }
        if (exes.some(e => !e.name.trim())) { alert('Każde ćwiczenie musi mieć nazwę'); return; }
        onSave({ id: initial?.id || `custom-${Date.now()}`, name: name.trim(), description: desc.trim(), exercises: exes, custom: true });
    };

    return (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal}>
                <h2 className={styles.modalTitle}>{initial ? 'Edytuj preset' : 'Nowy preset'}</h2>

                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nazwa treningu</label>
                    <input className={styles.formInput} value={name}
                           onChange={e => setName(e.target.value)} placeholder="np. Siłowy 12mm" />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Opis (opcjonalny)</label>
                    <input className={styles.formInput} value={desc}
                           onChange={e => setDesc(e.target.value)} placeholder="Krótki opis protokołu" />
                </div>

                <div className={styles.formLabel} style={{ marginBottom: '0.4rem' }}>Ćwiczenia</div>
                <div className={styles.exFormRowHeader}>
                    {['Nazwa', 'Praca(s)', 'Rest(s)', 'Serie', 'Load', ''].map((h, i) => (
                        <span key={i} className={styles.exFormHeaderLabel}>{h}</span>
                    ))}
                </div>

                {exes.map((ex, i) => (
                    <div key={ex.id} className={styles.exFormRow}>
                        <input className={styles.formInput} value={ex.name}
                               onChange={e => upd(i, 'name', e.target.value)} placeholder="Nazwa" />
                        <input className={styles.formInput} type="number" min="1" value={ex.work}
                               onChange={e => upd(i, 'work', +e.target.value)} />
                        <input className={styles.formInput} type="number" min="1" value={ex.rest}
                               onChange={e => upd(i, 'rest', +e.target.value)} />
                        <input className={styles.formInput} type="number" min="1" value={ex.sets}
                               onChange={e => upd(i, 'sets', +e.target.value)} />
                        <input className={styles.formInput} value={ex.load}
                               onChange={e => upd(i, 'load', e.target.value)} placeholder="BW" />
                        <button className={`${styles.btnSmall} ${styles.btnSmallDanger}`}
                                onClick={() => rm(i)} disabled={exes.length === 1}>
                            <Icons.Trash s={12} />
                        </button>
                    </div>
                ))}

                <button className={styles.btnAddEx} onClick={() => setExes(p => [...p, emptyEx()])}>
                    <Icons.Plus s={12} /> Dodaj ćwiczenie
                </button>

                <div className={styles.modalFooter}>
                    <button className={styles.btnGhost} onClick={onClose}>Anuluj</button>
                    <button className={styles.btnPrimary} onClick={save}><Icons.Save s={16} /> Zapisz</button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   Modal — skróty klawiszowe i gesty
   ============================================================ */
function InfoModal({ onClose }) {
    return (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal}>
                <h2 className={styles.modalTitle}>Skróty i gesty</h2>

                <div className={styles.infoGrid}>
                    {/* Hangboard Timer */}
                    <div className={styles.infoSection}>
                        <div className={styles.infoSectionTitle}>Hangboard Timer</div>

                        <div className={styles.infoRow}><kbd className={styles.kbd}>Space</kbd><span>Start / Pauza</span></div>
                        <div className={styles.infoRow}><kbd className={styles.kbd}>R</kbd><span>Reset timera</span></div>
                        <div className={styles.infoRow}><kbd className={styles.kbd}>→</kbd><span>Pomiń do następnej fazy</span></div>
                        <div className={styles.infoRow}><kbd className={styles.kbd}>←</kbd><span>Wróć do poprzedniej fazy</span></div>
                        <div className={styles.infoRow}><kbd className={styles.kbd}>M</kbd><span>Wycisz / włącz dźwięk</span></div>
                        <div className={styles.infoRow}><kbd className={styles.kbd}>F</kbd><span>Pełny Ekran</span></div>
                    </div>

                    {/* Stoper */}
                    <div className={styles.infoSection}>
                        <div className={styles.infoSectionTitle}>Stoper</div>

                        <div className={styles.infoRow}><kbd className={styles.kbd}>Space</kbd><span>Start / Stop</span></div>
                        <div className={styles.infoRow}><kbd className={styles.kbd}>L</kbd><span>Zapisz międzyczas</span></div>
                        <div className={styles.infoRow}><kbd className={styles.kbd}>R</kbd><span>Reset stopera</span></div>
                        <div className={styles.infoRow}><kbd className={styles.kbd}>M</kbd><span>Wycisz / włącz dźwięk</span></div>
                        <div className={styles.infoRow}><kbd className={styles.kbd}>F</kbd><span>Pełny Ekran</span></div>

                        <div className={styles.infoSectionTitle} style={{ marginTop: '0.75rem' }}>Gesty dotykowe</div>
                        <div className={styles.infoRow}><kbd className={styles.kbd}>Tap</kbd><span>Start / Stop (stoper)</span></div>
                        <div className={styles.infoRow}><kbd className={styles.kbd}>Swipe →</kbd><span>Pomiń fazę (timer)</span></div>
                        <div className={styles.infoRow}><kbd className={styles.kbd}>Swipe ←</kbd><span>Wróć fazę (timer)</span></div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.btnPrimary} onClick={onClose}>
                        <Icons.Close s={16} /> Zamknij
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   Modal — ustawienia (PREPARE jako string + dźwięk)
   ============================================================ */
function SettingsModal({ initial, onSave, onClose }) {
    const [prepare, setPrepare] = useState('' + (initial?.prepareDuration ?? 5));
    const [sound, setSound]     = useState(initial?.isSoundEnabled ?? true);

    return (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal}>
                <h2 className={styles.modalTitle}>Ustawienia</h2>

                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Czas PREPARE (sekundy)</label>
                    <input className={styles.formInput} type="number" min="0" value={prepare}
                           onChange={e => setPrepare(e.target.value)} />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Dźwięk</label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} /> Włączony
                    </label>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.btnGhost} onClick={onClose}>Anuluj</button>
                    <button className={styles.btnPrimary} onClick={() => {
                        const v = Number(prepare);
                        const final = Number.isFinite(v) && v >= 0 ? v : 0;
                        onSave({ prepareDuration: final, isSoundEnabled: sound });
                    }}>Zapisz</button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   Modal — akcje presetów (z wyborem protokołu)
   ============================================================ */
function PresetActionsModal({ current, allWorkouts, currentId, onPick, onCreate, onEdit, onDelete, onClose }) {
    const canEdit = !!current?.custom;
    return (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal}>
                <h2 className={styles.modalTitle}>Presety</h2>

                <div className={styles.formLabel} style={{ marginBottom: '0.4rem' }}>Wybierz protokół</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.9rem' }}>
                    {allWorkouts.map(w => (
                        <button key={w.id}
                                className={`${styles.workoutBtn} ${currentId === w.id ? styles.workoutBtnActive : ''}`}
                                onClick={() => onPick(w.id)}
                                style={{ textAlign: 'left' }}>
                            {w.custom ? '★ ' : ''}{w.name}
                        </button>
                    ))}
                </div>

                <div className={styles.formGroup} style={{ gap: '0.5rem' }}>
                    <button className={styles.btnPrimary} onClick={onCreate}>Nowy preset</button>
                    <button className={styles.btnGhost}  onClick={onEdit}   disabled={!canEdit}>Edytuj bieżący</button>
                    <button className={styles.btnGhost}  onClick={onDelete} disabled={!canEdit}>Usuń bieżący</button>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.btnPrimary} onClick={onClose}><Icons.Close s={16} /> Zamknij</button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   Komponent główny
   ============================================================ */
export default function HangboardTimer() {
    const [activeTab, setActiveTab] = useState('hangboard');

    const persisted = useMemo(() => loadSettings(), []);
    const [prepareDuration, setPrepareDuration] = useState(() => persisted.prepareDuration ?? 5);

    const [customWorkouts, setCustomWorkouts] = useState(() => loadCustom());
    const allWorkouts = useMemo(() => [...BUILTIN_WORKOUTS, ...customWorkouts], [customWorkouts]);

    const [currentWorkoutId, setCurrentWorkoutId] = useState(BUILTIN_WORKOUTS[0].id);
    const [currentIdx,       setCurrentIdx]        = useState(0);
    const [currentSet,       setCurrentSet]        = useState(1);
    const [phase,            setPhase]             = useState('IDLE');
    const [timeLeft,         setTimeLeft]          = useState(0);
    const [totalPhaseTime,   setTotalPhaseTime]    = useState(0);
    const [isActive,         setIsActive]          = useState(false);

    const [swTime,   setSwTime]   = useState(0);
    const [swActive, setSwActive] = useState(false);
    const [swLaps,   setSwLaps]   = useState([]);

    const [isSoundEnabled, setIsSoundEnabled] = useState(persisted.isSoundEnabled ?? true);
    const [isFullscreen,   setIsFullscreen]   = useState(false);
    const [modalMode,      setModalMode]      = useState(null); // null | 'create' | 'info' | 'settings' | 'presets' | workout
    const [showDesc,       setShowDesc]       = useState(false);

    const containerRef = useRef(null);
    const audioCtx     = useRef(null);
    const requestRef   = useRef(null);
    const startTimeRef = useRef(null);
    const swRequestRef = useRef(null);
    const swStartRef   = useRef(null);
    const swElapsed    = useRef(0);

    // Touch tracking
    const touchStartX  = useRef(0);
    const touchStartY  = useRef(0);

    const currentWorkout = allWorkouts.find(w => w.id === currentWorkoutId) || allWorkouts[0];
    const currentEx      = currentWorkout?.exercises?.[currentIdx];

    /* ---- Dźwięk ---- */
    const playSound = useCallback((freq, dur) => {
        if (!isSoundEnabled) return;
        try {
            if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = audioCtx.current;
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
            osc.start(); osc.stop(ctx.currentTime + dur);
        } catch {}
    }, [isSoundEnabled]);

    /* ---- Reset ---- */
    const handleReset = useCallback(() => {
        cancelAnimationFrame(requestRef.current);
        setIsActive(false); setPhase('IDLE'); setCurrentIdx(0);
        setCurrentSet(1); setTimeLeft(0); setTotalPhaseTime(0);
        startTimeRef.current = null;
    }, []);

    /* ---- Refs dla advancePhase ---- */
    const stateRef = useRef({});
    stateRef.current = { phase, currentIdx, currentSet, currentWorkout, currentEx, isActive, activeTab };

    const advancePhase = useCallback(() => {
        const { phase, currentIdx, currentSet, currentWorkout, currentEx, isActive, activeTab } = stateRef.current;
        if (!currentEx || phase === 'IDLE') return false;

        let willContinue = true;
        if (phase === 'WORK' || phase === 'PREPARE') {
            setPhase('REST'); setTimeLeft(currentEx.rest); setTotalPhaseTime(currentEx.rest);
        } else if (currentSet < currentEx.sets) {
            setCurrentSet(s => s + 1); setPhase('WORK'); setTimeLeft(currentEx.work); setTotalPhaseTime(currentEx.work);
        } else if (currentIdx < currentWorkout.exercises.length - 1) {
            const nx = currentWorkout.exercises[currentIdx + 1];
            setCurrentIdx(i => i + 1); setCurrentSet(1); setPhase('WORK'); setTimeLeft(nx.work); setTotalPhaseTime(nx.work);
        } else {
            playSound(660, 0.6); setIsActive(false); setPhase('IDLE'); willContinue = false;
        }
        startTimeRef.current = null;

        if (willContinue && isActive && activeTab === 'hangboard') {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = requestAnimationFrame(animate);
        }
        return willContinue;
    }, [playSound, activeTab]);

    /* ---- Cofnij fazę / ćwiczenie ---- */
    const retreatPhase = useCallback(() => {
        const { phase, currentIdx, currentSet, currentWorkout, currentEx } = stateRef.current;
        if (!currentEx || phase === 'IDLE') return;

        cancelAnimationFrame(requestRef.current);
        startTimeRef.current = null;

        if (phase === 'REST') {
            setPhase('WORK');
            setTimeLeft(currentEx.work);
            setTotalPhaseTime(currentEx.work);
            return;
        }

        if (currentSet > 1) {
            setCurrentSet(s => s - 1);
            setPhase('WORK');
            setTimeLeft(currentEx.work);
            setTotalPhaseTime(currentEx.work);
        } else if (currentIdx > 0) {
            const prevEx = currentWorkout.exercises[currentIdx - 1];
            setCurrentIdx(i => i - 1);
            setCurrentSet(prevEx.sets);
            setPhase('WORK');
            setTimeLeft(prevEx.work);
            setTotalPhaseTime(prevEx.work);
        } else {
            setIsActive(false);
            setPhase('IDLE');
            setTimeLeft(0);
            setTotalPhaseTime(0);
        }
    }, []);

    /* ---- Pętla timera ---- */
    const totalRef = useRef(0);
    totalRef.current = totalPhaseTime;

    const animate = useCallback((time) => {
        if (!startTimeRef.current) startTimeRef.current = time;
        const remaining = Math.max(0, totalRef.current - (time - startTimeRef.current) / 1000);
        setTimeLeft(remaining);
        if (remaining <= 0) { playSound(880, 0.35); advancePhase(); }
        else requestRef.current = requestAnimationFrame(animate);
    }, [advancePhase, playSound]);

    useEffect(() => {
        if (isActive && activeTab === 'hangboard') requestRef.current = requestAnimationFrame(animate);
        else cancelAnimationFrame(requestRef.current);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isActive, animate, activeTab]);

    /* ---- Pętla stopera ---- */
    const animateSw = useCallback((time) => {
        if (!swStartRef.current) swStartRef.current = time;
        setSwTime(swElapsed.current + (time - swStartRef.current));
        swRequestRef.current = requestAnimationFrame(animateSw);
    }, []);

    useEffect(() => {
        if (swActive && activeTab === 'stopwatch') {
            swStartRef.current = null;
            swRequestRef.current = requestAnimationFrame(animateSw);
        } else {
            cancelAnimationFrame(swRequestRef.current);
        }
        return () => cancelAnimationFrame(swRequestRef.current);
    }, [swActive, animateSw, activeTab]);

    /* ---- Pełny ekran ---- */
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
        else document.exitFullscreen?.();
        setIsFullscreen(f => !f);
    }, []);

    /* ---- Skróty klawiszowe ---- */
    useEffect(() => {
        const onKey = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (modalMode !== null) { if (e.key === 'Escape') setModalMode(null); return; }

            if (activeTab === 'hangboard') {
                switch (e.key) {
                    case ' ': case 'Space':
                        e.preventDefault();
                        if (phase === 'IDLE') { setPhase('PREPARE'); setTimeLeft(prepareDuration); setTotalPhaseTime(prepareDuration); startTimeRef.current = null; }
                        setIsActive(a => !a);
                        break;
                    case 'r': case 'R':
                        handleReset();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        if (phase !== 'IDLE') { cancelAnimationFrame(requestRef.current); startTimeRef.current = null; advancePhase(); }
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        if (phase !== 'IDLE') { retreatPhase(); }
                        break;
                    case 'm': case 'M':
                        setIsSoundEnabled(s => { const v = !s; saveSettings({ ...persisted, isSoundEnabled: v, prepareDuration }); return v; });
                        break;
                    case 'f': case 'F':
                        toggleFullscreen();
                        break;
                    default:
                        break;
                }
            } else {
                switch (e.key) {
                    case ' ': case 'Space':
                        e.preventDefault();
                        if (!swActive) { swStartRef.current = null; swElapsed.current = swTime; }
                        else { swElapsed.current = swTime; cancelAnimationFrame(swRequestRef.current); }
                        setSwActive(a => !a);
                        break;
                    case 'l': case 'L':
                        if (swActive) setSwLaps(l => [swTime, ...l]);
                        break;
                    case 'r': case 'R':
                        setSwActive(false); setSwTime(0); setSwLaps([]);
                        swElapsed.current = 0; swStartRef.current = null;
                        cancelAnimationFrame(swRequestRef.current);
                        break;
                    case 'm': case 'M':
                        setIsSoundEnabled(s => { const v = !s; saveSettings({ ...persisted, isSoundEnabled: v, prepareDuration }); return v; });
                        break;
                    case 'f': case 'F':
                        toggleFullscreen();
                        break;
                }
            }
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [activeTab, phase, isActive, swActive, swTime, modalMode, allWorkouts, advancePhase, handleReset, toggleFullscreen, retreatPhase, prepareDuration, persisted]);

    /* ---- Gesty dotykowe (tylko lewo/prawo) ---- */
    const handleTouchStart = useCallback((e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    }, []);

    const handleTouchEnd = useCallback((e) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        const adx = Math.abs(dx), ady = Math.abs(dy);

        if (modalMode !== null) return;
        if (Math.max(adx, ady) < 50) return;

        if (activeTab === 'hangboard') {
            if (adx > ady && dx > 0 && phase !== 'IDLE') {
                cancelAnimationFrame(requestRef.current); startTimeRef.current = null; advancePhase();
            } else if (adx > ady && dx < 0 && phase !== 'IDLE') {
                retreatPhase();
            }
        }
    }, [activeTab, phase, modalMode, advancePhase, retreatPhase]);

    /* ---- Presety ---- */
    const savePreset = useCallback((w) => {
        setCustomWorkouts(prev => {
            const next = prev.find(x => x.id === w.id) ? prev.map(x => x.id === w.id ? w : x) : [...prev, w];
            saveCustom(next); return next;
        });
        setCurrentWorkoutId(w.id); setModalMode(null); handleReset();
    }, [handleReset]);

    const deletePreset = useCallback((id) => {
        if (!window.confirm('Usunąć ten preset?')) return;
        setCustomWorkouts(prev => { const next = prev.filter(w => w.id !== id); saveCustom(next); return next; });
        if (currentWorkoutId === id) { setCurrentWorkoutId(BUILTIN_WORKOUTS[0].id); handleReset(); }
    }, [currentWorkoutId, handleReset]);

    /* ---- Formatowanie czasu stopera ---- */
    const fmt = (ms) => {
        const m  = Math.floor(ms / 60000).toString().padStart(2, '0');
        const s  = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
        const cs = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
        return `${m}:${s}.${cs}`;
    };

    const lapData = useMemo(() => {
        if (!swLaps.length) return [];
        const bestIdx = swLaps.reduce((bi, v, i) => v < swLaps[bi] ? i : bi, 0);
        return swLaps.map((lap, i) => ({
            lap, isBest: i === bestIdx,
            delta: lap - (swLaps[i + 1] ?? 0),
        }));
    }, [swLaps]);

    const progress = totalPhaseTime > 0 ? timeLeft / totalPhaseTime : 0;

    const phaseText = () => ({ IDLE: 'Gotowy?', WORK: 'PRACA', REST: 'ODPOCZYNEK', PREPARE: 'PRZYGOTUJ SIĘ' })[phase] || '';

    const phaseLabelCls = () => ({
        WORK:    `${styles.phaseLabel} ${styles.phaseLabelWork}`,
        REST:    `${styles.phaseLabel} ${styles.phaseLabelRest}`,
        PREPARE: `${styles.phaseLabel} ${styles.phaseLabelPrepare}`,
    })[phase] || styles.phaseLabel;

    const bgCls = () => ({
        WORK:    `${styles.backgroundFill} ${styles.bgWork}`,
        REST:    `${styles.backgroundFill} ${styles.bgRest}`,
        PREPARE: `${styles.backgroundFill} ${styles.bgPrepare}`,
    })[phase] || styles.backgroundFill;

    const progressFillCls = () => ({
        WORK:    `${styles.progressFill} ${styles.progressFillWork}`,
        REST:    `${styles.progressFill} ${styles.progressFillRest}`,
        PREPARE: `${styles.progressFill} ${styles.progressFillPrepare}`,
    })[phase] || styles.progressFill;

    const skipNext = () => {
        if (phase === 'IDLE') return;
        cancelAnimationFrame(requestRef.current); startTimeRef.current = null; advancePhase();
    };

    const bgScale = phase === 'PREPARE' ? Math.min(progress, 0.65) : progress;

    return (
        <div ref={containerRef} className={`${styles.container} ${isFullscreen ? styles.isFs : ''}`} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {activeTab === 'hangboard' && phase !== 'IDLE' && (
                <div className={bgCls()} style={{ transform: `scaleY(${bgScale})` }} />
            )}

            {modalMode === 'info' && <InfoModal onClose={() => setModalMode(null)} />}
            {modalMode === 'settings' && (
                <SettingsModal
                    initial={{ prepareDuration, isSoundEnabled }}
                    onSave={(s) => { setPrepareDuration(s.prepareDuration); setIsSoundEnabled(s.isSoundEnabled); saveSettings({ ...persisted, prepareDuration: s.prepareDuration, isSoundEnabled: s.isSoundEnabled }); setModalMode(null); }}
                    onClose={() => setModalMode(null)}
                />
            )}
            {modalMode === 'presets' && (
                <PresetActionsModal
                    current={currentWorkout}
                    allWorkouts={allWorkouts}
                    currentId={currentWorkoutId}
                    onPick={(id) => { setCurrentWorkoutId(id); handleReset(); }}
                    onCreate={() => setModalMode('create')}
                    onEdit={() => setModalMode(currentWorkout)}
                    onDelete={() => { deletePreset(currentWorkout.id); setModalMode(null); }}
                    onClose={() => setModalMode(null)}
                />
            )}
            {(modalMode === 'create' || (modalMode && !['info','settings','presets'].includes(modalMode))) && (
                <PresetModal
                    initial={modalMode === 'create' ? null : modalMode}
                    onSave={savePreset}
                    onClose={() => setModalMode(null)}
                />
            )}

            <div className={styles.tabBar}>
                <button className={`${styles.tabBtn} ${activeTab === 'hangboard' ? styles.tabBtnActive : ''}`} onClick={() => { setActiveTab('hangboard'); handleReset(); }}>
                    <Icons.Activity s={16} /> Hangboard Timer
                </button>
                <button className={`${styles.tabBtn} ${activeTab === 'stopwatch' ? styles.tabBtnActiveBlue : ''}`} onClick={() => { setActiveTab('stopwatch'); setSwActive(false); }}>
                    <Icons.Timer s={16} /> Stoper
                </button>
            </div>

            <div className={styles.mainCard}>
                <div className={styles.toolbar}>
                    <button className={styles.toolbarBtn} title="Skróty klawiszowe i gesty (I)" onClick={() => setModalMode('info')}>
                        <Icons.Info s={15} /> Pomoc
                    </button>
                    <button className={styles.toolbarBtn} title="Presety" onClick={() => setModalMode('presets')}>
                        <Icons.List s={15} /> Presety
                    </button>
                    <button className={styles.toolbarBtn} title="Ustawienia" onClick={() => setModalMode('settings')}>
                        <Icons.Settings s={15} /> Ustawienia
                    </button>
                    <button className={styles.toolbarBtn} title="Pełny ekran (F)" onClick={toggleFullscreen}>
                        {isFullscreen ? <Icons.Minimize s={15} /> : <Icons.Maximize s={15} />}
                        {isFullscreen ? 'Wyjdź' : 'Pełny Ekran'}
                    </button>
                </div>

                <div className={styles.content}>
                    {activeTab === 'hangboard' && (
                        <>
                            {currentWorkout?.description && (
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                    <button className={styles.btnSmall} onClick={() => setShowDesc(d => !d)}>
                                        <Icons.Info s={12} /> {showDesc ? 'Ukryj opis' : 'O protokole'}
                                    </button>
                                </div>
                            )}
                            {showDesc && currentWorkout?.description && (
                                <div style={{ padding: '0.6rem 0.9rem', marginBottom: '0.5rem', border: '1px solid var(--ht-border)', borderRadius: '2px', fontSize: '0.85rem', color: 'var(--ht-text-muted)', fontStyle: 'italic', background: 'var(--ht-surface)' }}>
                                    {currentWorkout.description}
                                </div>
                            )}

                            <div className={styles.timerArea}>
                                <span className={phaseLabelCls()}>{phaseText()}</span>

                                <div className={styles.timerRow}>
                                    <button className={styles.navBtn} onClick={retreatPhase} disabled={phase === 'IDLE'} title="Poprzednia faza (←)">
                                        <Icons.ChevronL s={30} />
                                    </button>
                                    <div className={styles.timerDigits}>
                                        {phase === 'IDLE' ? '0.0' : timeLeft.toFixed(1)}
                                    </div>
                                    <button className={styles.navBtn} onClick={skipNext} disabled={phase === 'IDLE'} title="Pomiń do następnej fazy (→)">
                                        <Icons.ChevronR s={30} />
                                    </button>
                                </div>

                                {phase !== 'IDLE' && (
                                    <div className={styles.progressBar}>
                                        <div className={progressFillCls()} style={{ width: `${progress * 100}%` }} />
                                    </div>
                                )}

                                {currentEx && (
                                    <div className={styles.exerciseInfo}>
                                        <div className={styles.exerciseName}>{currentEx.name}</div>
                                        <div className={styles.exerciseMeta}>
                                            Seria {currentSet} z {currentEx.sets}&nbsp;·&nbsp;Obciążenie: {currentEx.load}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.controlGrid}>
                                <button className={`${styles.btnStart} ${isActive ? styles.btnPause : ''}`}
                                        onClick={() => {
                                            if (phase === 'IDLE') { setPhase('PREPARE'); setTimeLeft(prepareDuration); setTotalPhaseTime(prepareDuration); startTimeRef.current = null; }
                                            setIsActive(a => !a);
                                        }}>
                                    {isActive ? <><Icons.Pause s={26} /> PAUZA</> : <><Icons.Play s={26} /> START</>}
                                </button>
                                <button className={styles.btnReset} onClick={handleReset}>
                                    <Icons.Reset s={26} /> RESET
                                </button>
                            </div>

                            <div className={styles.editCard}>
                                <div className={styles.editCardHeader}>
                                    <h3 className={styles.editCardTitle}><Icons.List s={13} /> Ćwiczenia</h3>
                                </div>
                                <div className={styles.exerciseList}>
                                    {currentWorkout?.exercises.map((ex, idx) => (
                                        <div key={ex.id} className={`${styles.exerciseRow} ${idx === currentIdx && phase !== 'IDLE' ? styles.exerciseRowActive : ''}`}>
                                            <div className={styles.exName}>{ex.name}</div>
                                            <div className={styles.exStats}>
                                                {[['Praca', `${ex.work}s`], ['Rest', `${ex.rest}s`], ['Serie', ex.sets], ['Load', ex.load]].map(([l, v]) => (
                                                    <div key={l} className={styles.exStat}>
                                                        <span className={styles.exStatLabel}>{l}</span>
                                                        <span className={styles.exStatValue}>{v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <button className={styles.btnTrash} disabled={!currentWorkout.custom}
                                                    style={{ opacity: currentWorkout.custom ? 1 : 0.1 }}
                                                    title={currentWorkout.custom ? 'Usuń ćwiczenie' : 'Edytuj przez Edytuj preset'}>
                                                <Icons.Trash s={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'stopwatch' && (
                        <>
                            <div className={styles.stopwatchArea}>
                                <div className={styles.stopwatchDigits}>{fmt(swTime)}</div>
                            </div>

                            <div className={styles.swControls}>
                                <button className={`${styles.btnSwStart} ${swActive ? styles.btnSwStop : ''}`}
                                        onClick={() => {
                                            if (!swActive) { swStartRef.current = null; swElapsed.current = swTime; }
                                            else { swElapsed.current = swTime; cancelAnimationFrame(swRequestRef.current); }
                                            setSwActive(a => !a);
                                        }}>
                                    {swActive ? 'STOP' : 'START'}
                                </button>
                                <div className={styles.swSecondaryBtns}>
                                    <button className={styles.btnSecondary}
                                            onClick={() => setSwLaps(l => [swTime, ...l])} disabled={!swActive}>
                                        MIĘDZY­CZAS
                                    </button>
                                    <button className={styles.btnSecondary}
                                            onClick={() => {
                                                setSwActive(false); setSwTime(0); setSwLaps([]);
                                                swElapsed.current = 0; swStartRef.current = null;
                                                cancelAnimationFrame(swRequestRef.current);
                                            }}>
                                        RESET
                                    </button>
                                </div>
                            </div>

                            <div className={styles.lapsCard}>
                                <h2 className={styles.lapsTitle}>Lista międzyczasów{lapData.length > 0 && ` · ${lapData.length} okrążeń`}</h2>
                                {lapData.length === 0
                                    ? <p className={styles.lapsEmpty}>Brak zapisanych czasów · naciśnij <kbd className={styles.kbd}>L</kbd> lub MIĘDZY­CZAS</p>
                                    : lapData.map(({ lap, delta, isBest }, i) => (
                                        <div key={i} className={`${styles.lapRow} ${isBest ? styles.lapRowBest : ''}`}>
                                            <span className={styles.lapIndex}>#{lapData.length - i}</span>
                                            <span className={styles.lapTime}>{fmt(lap)}</span>
                                            <span className={styles.lapDelta}>{i < lapData.length - 1 ? `Δ +${fmt(Math.abs(delta))}` : '—'}</span>
                                            {isBest ? <span className={styles.lapBadge}>★ Najlepszy</span> : <span />}
                                        </div>
                                    ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
