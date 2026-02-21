import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════ AUDIO ═══════════════════════════════════ */
function initAudio(ref) {
    if (typeof window === 'undefined') return null;
    if (!ref.current) {
        try { ref.current = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (ref.current.state === 'suspended') ref.current.resume();
    return ref.current;
}

function tone(ctx, freq, dur, vol = 0.4, type = 'sine') {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start();
    o.stop(ctx.currentTime + dur + 0.05);
}

function playSound(ctx, type) {
    if (!ctx) return;
    if (type === 'countdown') { tone(ctx, 440, 0.1, 0.25); }
    if (type === 'work') {
        tone(ctx, 880, 0.1, 0.5);
        setTimeout(() => tone(ctx, 1100, 0.15, 0.55), 170);
    }
    if (type === 'rest') {
        tone(ctx, 523, 0.1, 0.4);
        setTimeout(() => tone(ctx, 392, 0.2, 0.35), 160);
    }
    if (type === 'done') {
        tone(ctx, 523, 0.12, 0.5);
        setTimeout(() => tone(ctx, 659, 0.12, 0.5), 180);
        setTimeout(() => tone(ctx, 784, 0.4, 0.55), 360);
    }
    if (type === 'prepare_end') {
        tone(ctx, 660, 0.2, 0.5, 'square');
    }
}

/* ═══════════════════ HELPERS ══════════════════════════════════ */
const pad2 = (n) => String(Math.floor(n)).padStart(2, '0');

function fmtMs(ms) {
    const totalSec = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    const m = Math.floor(totalSec / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${pad2(h)}:${pad2(m % 60)}:${pad2(totalSec % 60)}.${pad2(cs)}`;
    return `${pad2(m)}:${pad2(totalSec % 60)}.${pad2(cs)}`;
}

function fmtSec(s) {
    return `${pad2(s / 60)}:${pad2(s % 60)}`;
}

let _uid = Date.now();
const uid = () => ++_uid;

/* ═══════════════════ CONSTANTS ════════════════════════════════ */
const PHASE_STYLE = {
    prepare: { bg: '#92400e', glow: '#f59e0b', label: '— PRZYGOTOWANIE —', emoji: '🏁' },
    work:    { bg: '#7f1d1d', glow: '#f87171', label: '— PRACA —',         emoji: '💪' },
    rest:    { bg: '#1e3a5f', glow: '#60a5fa', label: '— ODPOCZYNEK —',    emoji: '🧘' },
    idle:    { bg: 'transparent', glow: '#a78bfa', label: '',              emoji: '' },
};

const DEFAULT_EXERCISES = () => [
    { id: uid(), name: 'Zwis aktywny',    workTime: 10, restTime: 5,  sets: 6, weight: 0 },
    { id: uid(), name: 'Przerwa długa',   workTime: 120, restTime: 0, sets: 1, weight: 0 },
];

const INIT_IT_STATE = () => ({
    running: false,
    finished: false,
    phase: 'idle',
    exIdx: 0,
    set: 1,
    timeLeft: 0,
    totalTime: 0,
});

/* ═══════════════════ MAIN COMPONENT ═══════════════════════════ */
export default function TimerModule() {
    /* --- UI state --- */
    const [mode, setMode] = useState('stopwatch');
    const [soundOn, setSoundOn] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showEditor, setShowEditor] = useState(false);

    /* --- Stopwatch --- */
    const [swRunning, setSwRunning] = useState(false);
    const [swMs, setSwMs] = useState(0);
    const [swLaps, setSwLaps] = useState([]);
    const swRef = useRef({ acc: 0, start: 0, raf: null });

    /* --- Interval Timer --- */
    const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
    const exercisesRef = useRef(exercises);
    useEffect(() => { exercisesRef.current = exercises; }, [exercises]);

    const [it, setIt] = useState(INIT_IT_STATE);
    const itRef = useRef(it);
    const itTickRef = useRef(null);

    /* --- Presets (localStorage) --- */
    const [presets, setPresets] = useState(() => {
        try { return JSON.parse(localStorage.getItem('tm_presets') || '[]'); } catch { return []; }
    });
    const [presetName, setPresetName] = useState('');
    useEffect(() => {
        try { localStorage.setItem('tm_presets', JSON.stringify(presets)); } catch {}
    }, [presets]);

    /* --- Audio --- */
    const audioCtxRef = useRef(null);
    const soundOnRef = useRef(soundOn);
    useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);
    const emit = useCallback((type) => {
        if (!soundOnRef.current) return;
        playSound(initAudio(audioCtxRef), type);
    }, []);

    /* --- Container ref --- */
    const containerRef = useRef(null);

    /* ── STOPWATCH ──────────────────────────────────────────────── */
    const swTick = useCallback(() => {
        setSwMs(swRef.current.acc + (Date.now() - swRef.current.start));
        swRef.current.raf = requestAnimationFrame(swTick);
    }, []);

    const swStartPause = useCallback(() => {
        initAudio(audioCtxRef);
        setSwRunning((prev) => {
            if (!prev) {
                swRef.current.start = Date.now();
                swRef.current.raf = requestAnimationFrame(swTick);
            } else {
                cancelAnimationFrame(swRef.current.raf);
                swRef.current.acc += Date.now() - swRef.current.start;
            }
            return !prev;
        });
    }, [swTick]);

    const swReset = useCallback(() => {
        cancelAnimationFrame(swRef.current.raf);
        swRef.current = { acc: 0, start: 0, raf: null };
        setSwRunning(false);
        setSwMs(0);
        setSwLaps([]);
    }, []);

    const swLapFn = useCallback(() => {
        setSwLaps((l) => [{ id: uid(), time: swMs, idx: l.length + 1 }, ...l]);
    }, [swMs]);

    useEffect(() => () => cancelAnimationFrame(swRef.current.raf), []);

    /* ── INTERVAL TIMER ─────────────────────────────────────────── */
    const nextPhase = useCallback((state) => {
        const exList = exercisesRef.current;
        const { phase, exIdx, set } = state;
        if (!exList.length) return null;
        const ex = exList[exIdx];

        if (phase === 'prepare') {
            const fe = exList[0];
            return { phase: 'work', exIdx: 0, set: 1, timeLeft: fe.workTime, totalTime: fe.workTime };
        }
        if (phase === 'work' && ex.restTime > 0) {
            return { phase: 'rest', exIdx, set, timeLeft: ex.restTime, totalTime: ex.restTime };
        }
        // After rest or work-without-rest → advance set / exercise
        if (set < ex.sets) {
            const ns = set + 1;
            return { phase: 'work', exIdx, set: ns, timeLeft: ex.workTime, totalTime: ex.workTime };
        }
        const nextIdx = exIdx + 1;
        if (nextIdx < exList.length) {
            const ne = exList[nextIdx];
            return { phase: 'work', exIdx: nextIdx, set: 1, timeLeft: ne.workTime, totalTime: ne.workTime };
        }
        return null; // finished
    }, []);

    const runTick = useCallback(() => {
        clearInterval(itTickRef.current);
        itTickRef.current = setInterval(() => {
            const s = itRef.current;
            if (!s.running || s.finished) return;

            const tl = s.timeLeft - 1;

            if (tl > 0 && tl <= 3 && s.phase !== 'prepare') emit('countdown');

            if (tl <= 0) {
                const next = nextPhase(s);
                if (!next) {
                    emit('done');
                    const ns = { ...s, running: false, finished: true, timeLeft: 0 };
                    itRef.current = ns;
                    setIt(ns);
                    clearInterval(itTickRef.current);
                } else {
                    if (s.phase === 'prepare') emit('prepare_end');
                    else emit(next.phase === 'work' ? 'work' : 'rest');
                    const ns = { ...s, ...next, running: true, finished: false };
                    itRef.current = ns;
                    setIt(ns);
                }
            } else {
                const ns = { ...s, timeLeft: tl };
                itRef.current = ns;
                setIt(ns);
            }
        }, 1000);
    }, [emit, nextPhase]);

    const itStart = useCallback(() => {
        initAudio(audioCtxRef);
        const initial = { running: true, finished: false, phase: 'prepare', exIdx: 0, set: 1, timeLeft: 3, totalTime: 3 };
        itRef.current = initial;
        setIt(initial);
        runTick();
    }, [runTick]);

    const itPause = useCallback(() => {
        clearInterval(itTickRef.current);
        const ns = { ...itRef.current, running: false };
        itRef.current = ns;
        setIt(ns);
    }, []);

    const itResume = useCallback(() => {
        initAudio(audioCtxRef);
        const ns = { ...itRef.current, running: true };
        itRef.current = ns;
        setIt(ns);
        runTick();
    }, [runTick]);

    const itReset = useCallback(() => {
        clearInterval(itTickRef.current);
        const ns = INIT_IT_STATE();
        itRef.current = ns;
        setIt(ns);
    }, []);

    useEffect(() => () => clearInterval(itTickRef.current), []);

    /* ── FULLSCREEN ─────────────────────────────────────────────── */
    const toggleFullscreen = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen?.().catch(() => {});
        } else {
            document.exitFullscreen?.().catch(() => {});
        }
    }, []);

    useEffect(() => {
        const h = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', h);
        return () => document.removeEventListener('fullscreenchange', h);
    }, []);

    /* ── KEYBOARD ───────────────────────────────────────────────── */
    useEffect(() => {
        const h = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            const itS = itRef.current;
            if (e.code === 'Space') {
                e.preventDefault();
                if (mode === 'stopwatch') swStartPause();
                else if (itS.phase === 'idle' || itS.finished) itStart();
                else if (itS.running) itPause();
                else itResume();
            }
            if (e.code === 'KeyR') {
                if (mode === 'stopwatch') swReset();
                else itReset();
            }
            if (e.code === 'KeyL' && mode === 'stopwatch') swLapFn();
            if (e.code === 'KeyF') toggleFullscreen();
            if (e.code === 'KeyE' && mode === 'interval') setShowEditor((v) => !v);
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [mode, swStartPause, swReset, swLapFn, itStart, itPause, itResume, itReset, toggleFullscreen]);

    /* ── SWIPE ──────────────────────────────────────────────────── */
    const touchRef = useRef(null);
    const onTouchStart = useCallback((e) => {
        touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, []);
    const onTouchEnd = useCallback((e) => {
        if (!touchRef.current) return;
        const dx = e.changedTouches[0].clientX - touchRef.current.x;
        const dy = e.changedTouches[0].clientY - touchRef.current.y;
        touchRef.current = null;
        if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
        const itS = itRef.current;
        if (Math.abs(dy) > Math.abs(dx)) {
            if (dy < -60) { // swipe up = start/pause
                if (mode === 'stopwatch') swStartPause();
                else if (itS.phase === 'idle' || itS.finished) itStart();
                else if (itS.running) itPause();
                else itResume();
            }
            if (dy > 60) { // swipe down = reset
                if (mode === 'stopwatch') swReset();
                else itReset();
            }
        }
    }, [mode, swStartPause, swReset, itStart, itPause, itResume, itReset]);

    /* ── PRESETS ────────────────────────────────────────────────── */
    const savePreset = useCallback(() => {
        if (!presetName.trim()) return;
        setPresets((p) => [{ id: uid(), name: presetName.trim(), exercises: JSON.parse(JSON.stringify(exercises)) }, ...p]);
        setPresetName('');
    }, [presetName, exercises]);

    const loadPreset = useCallback((preset) => {
        setExercises(preset.exercises.map((e) => ({ ...e, id: uid() })));
        itReset();
        setShowEditor(false);
    }, [itReset]);

    /* ── EXERCISE EDITOR ────────────────────────────────────────── */
    const addExercise = () => {
        setExercises((ex) => [...ex, { id: uid(), name: `Ćwiczenie ${ex.length + 1}`, workTime: 10, restTime: 5, sets: 3, weight: 0 }]);
    };
    const removeExercise = (id) => setExercises((ex) => ex.filter((e) => e.id !== id));
    const updateEx = (id, field, value) => setExercises((ex) => ex.map((e) => e.id === id ? { ...e, [field]: value } : e));
    const moveEx = (id, dir) => setExercises((ex) => {
        const i = ex.findIndex((e) => e.id === id);
        if ((dir === -1 && i === 0) || (dir === 1 && i === ex.length - 1)) return ex;
        const a = [...ex];
        [a[i], a[i + dir]] = [a[i + dir], a[i]];
        return a;
    });

    /* ── DERIVED ────────────────────────────────────────────────── */
    const itIdle = it.phase === 'idle';
    const itDone = it.finished;
    const itActive = !itIdle && !itDone;
    const ps = PHASE_STYLE[it.phase] || PHASE_STYLE.idle;
    const fillPct = it.totalTime > 0 ? Math.min(100, ((it.totalTime - it.timeLeft) / it.totalTime) * 100) : 0;
    const currentEx = it.exIdx < exercises.length ? exercises[it.exIdx] : null;

    /* ── TOTAL WORKOUT TIME CALC ────────────────────────────────── */
    const totalWorkoutSec = exercises.reduce((sum, ex) => {
        return sum + ex.sets * (ex.workTime + ex.restTime);
    }, 0);

    /* ══════════════════════════════════════════════════════════════
     *  RENDER
     * ══════════════════════════════════════════════════════════════ */
    return (
        <>
            <style>{`
        .tm-wrap {
          --tm-primary: var(--ifm-color-primary, #6366f1);
          --tm-bg: var(--ifm-background-color, #0d0f1a);
          --tm-surface: rgba(255,255,255,0.04);
          --tm-border: rgba(255,255,255,0.08);
          --tm-text: var(--ifm-font-color-base, #e2e8f0);
          font-family: 'JetBrains Mono','Fira Code','Courier New',monospace;
          background: var(--tm-bg);
          color: var(--tm-text);
          min-height: 500px;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          user-select: none;
          -webkit-user-select: none;
        }
        .tm-wrap:fullscreen { border-radius: 0; min-height: 100vh; display: flex; flex-direction: column; }
        .tm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px; gap: 12px;
          border-bottom: 1px solid var(--tm-border);
          background: rgba(0,0,0,0.2);
          flex-wrap: wrap;
        }
        .tm-tabs {
          display: flex; gap: 4px;
          background: rgba(255,255,255,0.06); border-radius: 12px; padding: 4px;
        }
        .tm-tab {
          padding: 9px 22px; border-radius: 9px; border: none; cursor: pointer;
          font-family: inherit; font-size: 14px; font-weight: 700;
          letter-spacing: 0.5px; text-transform: uppercase; transition: all 0.2s;
        }
        .tm-tab.active {
          background: var(--tm-primary); color: #fff;
          box-shadow: 0 0 20px rgba(99,102,241,0.3);
        }
        .tm-tab:not(.active) { background: transparent; color: rgba(255,255,255,0.5); }
        .tm-tab:not(.active):hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
        .tm-icon-btn {
          width: 40px; height: 40px; border-radius: 10px; border: none; cursor: pointer;
          font-size: 18px; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .tm-icon-btn.on  { background: rgba(99,102,241,0.25); color: #a5b4fc; }
        .tm-icon-btn.off { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); }
        .tm-icon-btn:hover { filter: brightness(1.3); }
        .tm-main {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 48px 24px; position: relative; overflow: hidden;
          min-height: 400px;
        }
        .tm-fill {
          position: absolute; top: 0; left: 0; height: 100%;
          transition: width 0.95s linear, background 0.6s ease;
          z-index: 0; pointer-events: none;
        }
        .tm-fill::after {
          content: ''; position: absolute; right: 0; top: 0; bottom: 0;
          width: 3px; background: currentColor; filter: blur(4px) brightness(1.5);
        }
        .tm-z { position: relative; z-index: 1; }
        .tm-phase-label {
          font-size: 11px; font-weight: 700; letter-spacing: 4px;
          text-transform: uppercase; opacity: 0.65; margin-bottom: 10px;
        }
        .tm-time {
          font-size: clamp(60px, 14vw, 112px); font-weight: 800;
          letter-spacing: -3px; line-height: 1; font-variant-numeric: tabular-nums;
          text-shadow: 0 0 60px rgba(255,255,255,0.08);
          transition: color 0.4s;
        }
        .tm-ex-name {
          font-size: 22px; font-weight: 700; margin-top: 18px;
          text-align: center; opacity: 0.9; max-width: 340px;
        }
        .tm-set-info {
          font-size: 13px; opacity: 0.55; margin-top: 8px;
          letter-spacing: 1.5px; text-transform: uppercase;
        }
        .tm-dots { display: flex; gap: 8px; margin-top: 18px; }
        .tm-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,0.2); transition: all 0.3s;
        }
        .tm-dot.active { background: currentColor; transform: scale(1.4); }
        .tm-controls {
          display: flex; gap: 14px; margin-top: 40px;
          flex-wrap: wrap; justify-content: center;
        }
        .tm-btn {
          padding: 16px 36px; border-radius: 14px; border: none; cursor: pointer;
          font-family: inherit; font-size: 15px; font-weight: 800;
          letter-spacing: 1.5px; text-transform: uppercase;
          transition: all 0.15s; min-width: 110px;
        }
        .tm-btn:hover  { filter: brightness(1.15); transform: translateY(-1px); }
        .tm-btn:active { filter: brightness(0.9);  transform: translateY(0); }
        .tm-btn.start  { background: #166534; color: #86efac; box-shadow: 0 0 30px rgba(22,101,52,0.5); }
        .tm-btn.pause  { background: #7c2d12; color: #fdba74; }
        .tm-btn.reset  { background: #7f1d1d; color: #fca5a5; }
        .tm-btn.ghost  { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.1); }
        .tm-btn.lap    { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.1); }
        .tm-laps {
          position: relative; z-index: 1; width: 100%; max-width: 420px;
          margin-top: 24px; max-height: 200px; overflow-y: auto;
        }
        .tm-laps::-webkit-scrollbar { width: 4px; }
        .tm-laps::-webkit-scrollbar-track { background: transparent; }
        .tm-laps::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        .tm-lap-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 16px; border-radius: 8px; margin-bottom: 4px;
          font-size: 13px;
        }
        .tm-lap-item.latest { background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.2); }
        .tm-lap-item:not(.latest) { background: rgba(255,255,255,0.04); }
        .tm-hints {
          margin-top: 24px; opacity: 0.25; font-size: 11px; letter-spacing: 1px;
          text-align: center; text-transform: uppercase;
        }
        .tm-idle-icon { font-size: 52px; opacity: 0.2; margin-bottom: 12px; }
        .tm-idle-info { opacity: 0.5; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; }
        .tm-done { font-size: 72px; margin-bottom: 8px; }
        .tm-ex-list {
          position: relative; z-index: 1; width: 100%; max-width: 440px; margin-top: 24px;
        }
        .tm-ex-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 16px; margin-bottom: 6px;
          background: var(--tm-surface); border-radius: 10px; font-size: 13px;
          border: 1px solid var(--tm-border);
        }
        .tm-ex-row-name { font-weight: 700; }
        .tm-ex-row-meta { opacity: 0.5; font-size: 12px; }

        /* ── Editor Panel ───────────────────── */
        .tm-editor {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(100vw, 440px); background: #111827;
          border-left: 1px solid rgba(255,255,255,0.1);
          overflow-y: auto; z-index: 1000; padding: 20px;
          display: flex; flex-direction: column; gap: 14px;
        }
        .tm-editor::-webkit-scrollbar { width: 4px; }
        .tm-editor::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        .tm-editor-header {
          display: flex; justify-content: space-between; align-items: center;
          padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .tm-editor-title { margin: 0; font-size: 17px; font-family: inherit; font-weight: 700; }
        .tm-ex-card {
          background: rgba(255,255,255,0.04); border-radius: 14px; padding: 16px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .tm-ex-card-header {
          display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
        }
        .tm-ex-card-input {
          background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.25);
          color: inherit; font-family: inherit; font-size: 15px; font-weight: 700;
          flex: 1; outline: none; padding: 2px 0;
        }
        .tm-ex-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        }
        .tm-ex-field { display: flex; flex-direction: column; gap: 4px; }
        .tm-ex-field label {
          font-size: 10px; letter-spacing: 1px; text-transform: uppercase;
          opacity: 0.5; font-weight: 600;
        }
        .tm-ex-field input[type='number'] {
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px; padding: 9px 12px; color: inherit; font-family: inherit;
          font-size: 16px; font-weight: 700; width: 100%; box-sizing: border-box; outline: none;
          transition: border-color 0.2s;
        }
        .tm-ex-field input[type='number']:focus { border-color: var(--tm-primary); }
        .tm-add-btn {
          padding: 13px 20px; border-radius: 10px; border: 1px dashed rgba(255,255,255,0.2);
          background: transparent; color: rgba(255,255,255,0.6); font-family: inherit;
          font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; width: 100%;
        }
        .tm-add-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.9); }
        .tm-section-title {
          font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
          opacity: 0.5; font-weight: 700; margin: 0;
        }
        .tm-preset-save { display: flex; gap: 8px; }
        .tm-preset-input {
          flex: 1; background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;
          padding: 10px 14px; color: inherit; font-family: inherit; font-size: 14px; outline: none;
          transition: border-color 0.2s;
        }
        .tm-preset-input:focus { border-color: var(--tm-primary); }
        .tm-preset-save-btn {
          padding: 10px 16px; border-radius: 8px; border: none;
          background: var(--tm-primary); color: #fff; font-family: inherit;
          font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap;
          transition: filter 0.15s;
        }
        .tm-preset-save-btn:hover { filter: brightness(1.15); }
        .tm-preset-item {
          display: flex; gap: 8px; align-items: center; margin-bottom: 6px;
        }
        .tm-preset-load {
          flex: 1; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
          padding: 10px 14px; color: inherit; font-family: inherit; font-size: 13px;
          cursor: pointer; text-align: left; transition: all 0.2s;
        }
        .tm-preset-load:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        .tm-sort-btn {
          width: 26px; height: 26px; border-radius: 6px; border: none;
          background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.6);
          cursor: pointer; font-size: 11px; display: flex; align-items: center;
          justify-content: center; transition: background 0.15s; flex-shrink: 0;
        }
        .tm-sort-btn:hover { background: rgba(255,255,255,0.15); }
        .tm-del-btn {
          width: 26px; height: 26px; border-radius: 6px; border: none;
          background: rgba(239,68,68,0.1); color: #f87171;
          cursor: pointer; font-size: 14px; display: flex; align-items: center;
          justify-content: center; transition: background 0.15s; flex-shrink: 0;
        }
        .tm-del-btn:hover { background: rgba(239,68,68,0.25); }
        .tm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999;
        }

        @media (max-width: 600px) {
          .tm-main { padding: 32px 16px; }
          .tm-controls { gap: 10px; }
          .tm-btn { padding: 15px 22px; font-size: 14px; min-width: 90px; }
        }
      `}</style>

            <div
                ref={containerRef}
                className="tm-wrap"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {/* ── Header ────────────────────────────────────── */}
                <div className="tm-header">
                    <div className="tm-tabs">
                        <button
                            className={`tm-tab ${mode === 'stopwatch' ? 'active' : ''}`}
                            onClick={() => setMode('stopwatch')}
                        >⏱ Stoper</button>
                        <button
                            className={`tm-tab ${mode === 'interval' ? 'active' : ''}`}
                            onClick={() => setMode('interval')}
                        >⚡ Timer</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {mode === 'interval' && (
                            <button
                                className={`tm-icon-btn ${showEditor ? 'on' : 'off'}`}
                                onClick={() => setShowEditor((v) => !v)}
                                title="Edytor ćwiczeń (E)"
                            >✏️</button>
                        )}
                        <button
                            className={`tm-icon-btn ${soundOn ? 'on' : 'off'}`}
                            onClick={() => { setSoundOn((v) => !v); initAudio(audioCtxRef); }}
                            title="Dźwięk"
                        >{soundOn ? '🔊' : '🔇'}</button>
                        <button
                            className={`tm-icon-btn ${isFullscreen ? 'on' : 'off'}`}
                            onClick={toggleFullscreen}
                            title="Pełny ekran (F)"
                        >{isFullscreen ? '⊡' : '⛶'}</button>
                    </div>
                </div>

                {/* ── Main Area ─────────────────────────────────── */}
                <div className="tm-main">

                    {/* Background fill */}
                    {mode === 'interval' && itActive && (
                        <div
                            className="tm-fill"
                            style={{
                                width: `${fillPct}%`,
                                background: `linear-gradient(90deg, ${ps.bg}55, ${ps.bg}99)`,
                                color: ps.glow,
                            }}
                        />
                    )}

                    {/* ───── STOPWATCH ───── */}
                    {mode === 'stopwatch' && (
                        <>
                            <div className="tm-phase-label tm-z">STOPER</div>
                            <div
                                className="tm-time tm-z"
                                style={{ color: swRunning ? '#86efac' : 'inherit' }}
                            >
                                {fmtMs(swMs)}
                            </div>
                            <div className="tm-controls tm-z">
                                <button
                                    className={`tm-btn ${swRunning ? 'pause' : 'start'}`}
                                    onClick={swStartPause}
                                >
                                    {swRunning ? '⏸ Pauza' : swMs > 0 ? '▶ Wznów' : '▶ Start'}
                                </button>
                                <button
                                    className="tm-btn lap"
                                    onClick={swLapFn}
                                    disabled={!swRunning && swMs === 0}
                                >
                                    🏁 Okrążenie
                                </button>
                                <button className="tm-btn reset" onClick={swReset}>
                                    ↺ Reset
                                </button>
                            </div>

                            {swLaps.length > 0 && (
                                <div className="tm-laps">
                                    {swLaps.map((lap, i) => (
                                        <div key={lap.id} className={`tm-lap-item ${i === 0 ? 'latest' : ''}`}>
                                            <span>Okrążenie {lap.idx}</span>
                                            <span style={{ fontWeight: 800 }}>{fmtMs(lap.time)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="tm-hints tm-z">
                                SPACJA: start/pauza · R: reset · L: okrążenie · F: fullscreen
                            </div>
                        </>
                    )}

                    {/* ───── INTERVAL TIMER ───── */}
                    {mode === 'interval' && (
                        <>
                            {/* Idle state */}
                            {itIdle && (
                                <>
                                    <div className="tm-idle-icon tm-z">⚡</div>
                                    <div className="tm-phase-label tm-z">TIMER INTERWAŁOWY</div>
                                    <div className="tm-idle-info tm-z" style={{ marginBottom: 8 }}>
                                        {exercises.length} ćw. · {exercises.reduce((s, e) => s + e.sets, 0)} serii · {fmtSec(totalWorkoutSec)}
                                    </div>
                                </>
                            )}

                            {/* Done state */}
                            {itDone && (
                                <>
                                    <div className="tm-done tm-z">🎉</div>
                                    <div className="tm-phase-label tm-z" style={{ color: '#86efac', opacity: 1, fontSize: 14 }}>
                                        TRENING ZAKOŃCZONY!
                                    </div>
                                </>
                            )}

                            {/* Active state */}
                            {itActive && (
                                <>
                                    <div
                                        className="tm-phase-label tm-z"
                                        style={{ color: ps.glow, opacity: 1 }}
                                    >
                                        {ps.emoji} {ps.label}
                                    </div>
                                    <div
                                        className="tm-time tm-z"
                                        style={{ color: ps.glow }}
                                    >
                                        {fmtSec(it.timeLeft)}
                                    </div>
                                    {currentEx && it.phase !== 'prepare' && (
                                        <>
                                            <div className="tm-ex-name tm-z">{currentEx.name}</div>
                                            <div className="tm-set-info tm-z">
                                                Seria {it.set} / {currentEx.sets}
                                                {currentEx.weight > 0 && ` · ${currentEx.weight} kg`}
                                            </div>
                                        </>
                                    )}
                                    {/* Exercise dots */}
                                    <div className="tm-dots tm-z" style={{ color: ps.glow }}>
                                        {exercises.map((ex, i) => (
                                            <div
                                                key={ex.id}
                                                className={`tm-dot ${i === it.exIdx && it.phase !== 'prepare' ? 'active' : ''}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Controls */}
                            <div className="tm-controls tm-z">
                                {(itIdle || itDone) && (
                                    <button className="tm-btn start" onClick={itStart}>▶ Start</button>
                                )}
                                {itActive && it.running && (
                                    <button className="tm-btn pause" onClick={itPause}>⏸ Pauza</button>
                                )}
                                {itActive && !it.running && (
                                    <button className="tm-btn start" onClick={itResume}>▶ Wznów</button>
                                )}
                                {!itIdle && (
                                    <button className="tm-btn reset" onClick={itReset}>↺ Reset</button>
                                )}
                                <button className="tm-btn ghost" onClick={() => setShowEditor((v) => !v)}>
                                    ✏️ Edytor
                                </button>
                            </div>

                            {/* Exercise preview (idle) */}
                            {itIdle && exercises.length > 0 && (
                                <div className="tm-ex-list tm-z">
                                    {exercises.map((ex) => (
                                        <div key={ex.id} className="tm-ex-row">
                                            <span className="tm-ex-row-name">{ex.name}</span>
                                            <span className="tm-ex-row-meta">
                        {ex.workTime}s
                                                {ex.restTime > 0 && ` + ${ex.restTime}s`}
                                                {' · '}{ex.sets}×
                                                {ex.weight > 0 && ` · ${ex.weight}kg`}
                      </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="tm-hints tm-z">
                                SPACJA: start/pauza · R: reset · E: edytor · F: fullscreen
                            </div>
                        </>
                    )}
                </div>

                {/* ── Editor Overlay ────────────────────────────── */}
                {showEditor && (
                    <>
                        <div className="tm-overlay" onClick={() => setShowEditor(false)} />
                        <div className="tm-editor">
                            <div className="tm-editor-header">
                                <h3 className="tm-editor-title">✏️ Edytor ćwiczeń</h3>
                                <button
                                    className="tm-icon-btn off"
                                    onClick={() => setShowEditor(false)}
                                    style={{ fontSize: 22, flexShrink: 0 }}
                                >✕</button>
                            </div>

                            {/* Exercise cards */}
                            {exercises.map((ex, i) => (
                                <div key={ex.id} className="tm-ex-card">
                                    <div className="tm-ex-card-header">
                                        <input
                                            className="tm-ex-card-input"
                                            value={ex.name}
                                            onChange={(e) => updateEx(ex.id, 'name', e.target.value)}
                                            placeholder="Nazwa ćwiczenia"
                                        />
                                        <button className="tm-sort-btn" onClick={() => moveEx(ex.id, -1)} title="W górę">▲</button>
                                        <button className="tm-sort-btn" onClick={() => moveEx(ex.id, 1)} title="W dół">▼</button>
                                        <button className="tm-del-btn" onClick={() => removeExercise(ex.id)} title="Usuń">✕</button>
                                    </div>
                                    <div className="tm-ex-grid">
                                        {[
                                            { label: 'Czas pracy (s)',      field: 'workTime', min: 1 },
                                            { label: 'Czas odpoczynku (s)', field: 'restTime', min: 0 },
                                            { label: 'Serie',               field: 'sets',     min: 1 },
                                            { label: 'Obciążenie (kg)',     field: 'weight',   min: 0 },
                                        ].map(({ label, field, min }) => (
                                            <div key={field} className="tm-ex-field">
                                                <label>{label}</label>
                                                <input
                                                    type="number"
                                                    min={min}
                                                    value={ex[field]}
                                                    onChange={(e) => updateEx(ex.id, field, Math.max(min, Number(e.target.value)))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <button className="tm-add-btn" onClick={addExercise}>+ Dodaj ćwiczenie</button>

                            {/* Presets */}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
                                <p className="tm-section-title" style={{ marginBottom: 12 }}>💾 Zapisz preset</p>
                                <div className="tm-preset-save">
                                    <input
                                        className="tm-preset-input"
                                        value={presetName}
                                        onChange={(e) => setPresetName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && savePreset()}
                                        placeholder="Nazwa presetu..."
                                    />
                                    <button className="tm-preset-save-btn" onClick={savePreset}>Zapisz</button>
                                </div>
                            </div>

                            {presets.length > 0 && (
                                <div>
                                    <p className="tm-section-title" style={{ marginBottom: 10 }}>📋 Moje presety</p>
                                    {presets.map((p) => (
                                        <div key={p.id} className="tm-preset-item">
                                            <button className="tm-preset-load" onClick={() => loadPreset(p)}>
                                                <span style={{ fontWeight: 700 }}>{p.name}</span>
                                                <span style={{ opacity: 0.5, marginLeft: 8, fontSize: 12 }}>
                          {p.exercises.length} ćw.
                        </span>
                                            </button>
                                            <button
                                                className="tm-del-btn"
                                                onClick={() => setPresets((ps) => ps.filter((x) => x.id !== p.id))}
                                                title="Usuń preset"
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Shortcut summary */}
                            <div style={{ padding: '10px 0', opacity: 0.3, fontSize: 11, letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center' }}>
                                Skróty: Spacja · R · E · F<br />
                                Swipe: góra=start/pauza · dół=reset
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}