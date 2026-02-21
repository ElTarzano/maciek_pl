import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './HangTimer.module.css';

/**
 * HangTimer – interwałowy timer (PL) z presetami, audio i fullscreen.
 * Wersja z zakładkami, nowymi przyciskami i pionowym tłem postępu.
 */

/* ───────────── Konfiguracja i utilsy ───────────── */

const STORAGE_KEYS = {
    PRESETS: 'hangTimer.presets.v3',
    LAST: 'hangTimer.lastPresetId.v3',
    AUDIO: 'hangTimer.audio.v2',
};

const DEFAULT_PRESETS = [
    {
        id: 'std-7-3x6x3',
        name: 'Standard: 7/3 × 6, 3 serie (przerwa 180s)',
        config: { prepSec: 10, workSec: 7, restSec: 3, reps: 6, sets: 3, setRestSec: 180 },
    },
    {
        id: 'quick-10-5x5x2',
        name: 'Szybki: 10/5 × 5, 2 serie (przerwa 120s)',
        config: { prepSec: 5, workSec: 10, restSec: 5, reps: 5, sets: 2, setRestSec: 120 },
    },
];

function pad2(n) { return String(n).padStart(2, '0'); }
function formatHMS(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${pad2(m)}:${pad2(sec)}` : `${m}:${pad2(sec)}`;
}

/** Buduje sekwencję segmentów */
function buildSequence({ prepSec, workSec, restSec, reps, sets, setRestSec }) {
    const seq = [];
    if (prepSec > 0) seq.push({ key: 'prep', type: 'prep', label: 'Przygotowanie', duration: prepSec, color: 'var(--accent-prep)' });
    for (let s = 1; s <= sets; s++) {
        for (let r = 1; r <= reps; r++) {
            seq.push({ key: `s${s}r${r}-work`, type: 'work', label: `Chwyt ${r}/${reps} (Seria ${s}/${sets})`, duration: workSec, color: 'var(--accent-work)' });
            if (r < reps && restSec > 0) {
                seq.push({ key: `s${s}r${r}-rest`, type: 'rest', label: `Odpoczynek ${r}/${reps} (Seria ${s}/${sets})`, duration: restSec, color: 'var(--accent-rest)' });
            }
        }
        if (s < sets && setRestSec > 0) {
            seq.push({ key: `s${s}-setrest`, type: 'setrest', label: `Przerwa między seriami ${s}/${sets}`, duration: setRestSec, color: 'var(--accent-setrest)' });
        }
    }
    return seq;
}

/* SSR-safe localStorage */
const safeStorage = {
    get(key, fallback = null) {
        try { if (typeof window === 'undefined') return fallback; const v = window.localStorage.getItem(key); return v ?? fallback; }
        catch { return fallback; }
    },
    set(key, val) { try { if (typeof window === 'undefined') return; window.localStorage.setItem(key, val); } catch {} },
};

/* ───────────── Audio Engine (WebAudio) ───────────── */

function useAudio() {
    const ctxRef = useRef(null);
    const gainRef = useRef(null);
    const enabledRef = useRef(true);
    const volumeRef = useRef(0.6);
    const themeRef = useRef('classic');

    function ensureContext() {
        if (typeof window === 'undefined') return null;
        if (!ctxRef.current) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;
            const ctx = new AudioCtx();
            const gain = ctx.createGain();
            gain.gain.value = volumeRef.current;
            gain.connect(ctx.destination);
            ctxRef.current = ctx;
            gainRef.current = gain;
        }
        if (ctxRef.current.state === 'suspended') ctxRef.current.resume().catch(() => {});
        return ctxRef.current;
    }

    function setEnabled(v) { enabledRef.current = v; persist(); }
    function setVolume(v) { volumeRef.current = v; if (gainRef.current) gainRef.current.gain.value = v; persist(); }
    function setTheme(t) { themeRef.current = t; persist(); }
    function persist() {
        safeStorage.set(STORAGE_KEYS.AUDIO, JSON.stringify({
            enabled: enabledRef.current, volume: volumeRef.current, theme: themeRef.current,
        }));
    }
    function loadPersisted() {
        const raw = safeStorage.get(STORAGE_KEYS.AUDIO);
        if (raw) {
            try {
                const { enabled, volume, theme } = JSON.parse(raw);
                if (typeof enabled === 'boolean') enabledRef.current = enabled;
                if (typeof volume === 'number') volumeRef.current = Math.min(1, Math.max(0, volume));
                if (typeof theme === 'string') themeRef.current = theme;
            } catch {}
        }
    }

    function tone({ freq = 880, dur = 0.15, type = 'sine', attack = 0.005, release = 0.05, volume = 1.0 }) {
        if (!enabledRef.current) return;
        const ctx = ensureContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const vca = ctx.createGain();
        const g = (gainRef.current?.gain?.value ?? 1) * volume;
        vca.gain.setValueAtTime(0, ctx.currentTime);
        vca.gain.linearRampToValueAtTime(g, ctx.currentTime + attack);
        vca.gain.linearRampToValueAtTime(0, ctx.currentTime + Math.max(attack + 0.01, dur - release));
        vca.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(vca);
        vca.connect(gainRef.current);
        osc.start();
        osc.stop(ctx.currentTime + dur + 0.02);
    }

    function playEvent(event) {
        const theme = themeRef.current;
        if (theme === 'classic') {
            if (event === 'count3' || event === 'count2') tone({ freq: 900, dur: 0.12, type: 'sine', volume: 0.9 });
            else if (event === 'count1') tone({ freq: 1200, dur: 0.14, type: 'sine', volume: 1.0 });
            else if (event === 'start-work') tone({ freq: 1400, dur: 0.18, type: 'sine', volume: 1.0 });
            else if (event === 'start-rest') tone({ freq: 600, dur: 0.16, type: 'sine', volume: 0.9 });
            else if (event === 'start-setrest') tone({ freq: 520, dur: 0.22, type: 'sine', volume: 0.9 });
            else if (event === 'end-all') tone({ freq: 900, dur: 0.5, type: 'sine', volume: 1.0 });
        } else if (theme === 'digital') {
            if (event === 'count3' || event === 'count2') tone({ freq: 800, dur: 0.1, type: 'square', volume: 0.7 });
            else if (event === 'count1') tone({ freq: 1500, dur: 0.12, type: 'square', volume: 0.9 });
            else if (event === 'start-work') { tone({ freq: 1800, dur: 0.12, type: 'square', volume: 1.0 }); tone({ freq: 1200, dur: 0.08, type: 'square', volume: 0.8 }); }
            else if (event === 'start-rest') tone({ freq: 500, dur: 0.14, type: 'square', volume: 0.8 });
            else if (event === 'start-setrest') tone({ freq: 440, dur: 0.16, type: 'square', volume: 0.8 });
            else if (event === 'end-all') tone({ freq: 1000, dur: 0.4, type: 'square', volume: 0.9 });
        } else if (theme === 'gong') {
            if (event.startsWith('count')) tone({ freq: 600, dur: 0.18, type: 'triangle', volume: 0.8 });
            else if (event === 'start-work') { tone({ freq: 700, dur: 0.22, type: 'triangle', volume: 1.0 }); tone({ freq: 350, dur: 0.18, type: 'triangle', volume: 0.8 }); }
            else if (event === 'start-rest') tone({ freq: 300, dur: 0.22, type: 'triangle', volume: 0.9 });
            else if (event === 'start-setrest') tone({ freq: 260, dur: 0.26, type: 'triangle', volume: 0.9 });
            else if (event === 'end-all') { tone({ freq: 420, dur: 0.5, type: 'triangle', volume: 1.0 }); tone({ freq: 210, dur: 0.5, type: 'triangle', volume: 0.8 }); }
        }
    }

    return {
        loadPersisted,
        setEnabled, setVolume, setTheme,
        get enabled() { return enabledRef.current; },
        get volume() { return volumeRef.current; },
        get theme() { return themeRef.current; },
        ensureContext,
        playEvent,
    };
}

/* ───────────── Komponent ───────────── */

export default function HangTimer() {
    // Zakładki
    const [tab, setTab] = useState('run'); // run | config | presets | audio

    // Konfiguracja
    const [config, setConfig] = useState({ prepSec: 10, workSec: 7, restSec: 3, reps: 6, sets: 3, setRestSec: 180 });

    // Presety
    const [presets, setPresets] = useState(DEFAULT_PRESETS);
    const [selectedPresetId, setSelectedPresetId] = useState(DEFAULT_PRESETS[0].id);
    const [newPresetName, setNewPresetName] = useState('');

    // Sekwencja i czas
    const sequence = useMemo(() => buildSequence(config), [config]);
    const totalDuration = useMemo(() => sequence.reduce((a, s) => a + s.duration, 0), [sequence]);
    const [index, setIndex] = useState(0);
    const [running, setRunning] = useState(false);
    const [elapsedInSeg, setElapsedInSeg] = useState(0);
    const [accumulatedBefore, setAccumulatedBefore] = useState(0);

    // Fullscreen
    const containerRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // RAF i refy
    const rafRef = useRef(null);
    const anchorRef = useRef(0);
    const runningRef = useRef(false);
    const indexRef = useRef(0);
    const sequenceRef = useRef(sequence);

    // Audio
    const audio = useAudio();
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [soundTheme, setSoundTheme] = useState('classic');
    const [soundVolume, setSoundVolume] = useState(0.6);
    const lastSecondRef = useRef(null);
    const lastTypeRef = useRef(null);

    // Presety i audio – init
    useEffect(() => {
        const raw = safeStorage.get(STORAGE_KEYS.PRESETS);
        let loaded = null;
        if (raw) { try { loaded = JSON.parse(raw); } catch { loaded = null; } }
        if (Array.isArray(loaded) && loaded.length) {
            setPresets((prev) => {
                const map = new Map();
                for (const p of DEFAULT_PRESETS) map.set(p.id, p);
                for (const p of loaded) map.set(p.id, p);
                return Array.from(map.values());
            });
        }
        const last = safeStorage.get(STORAGE_KEYS.LAST);
        const src = loaded ?? DEFAULT_PRESETS;
        if (last) {
            const found = src.find((p) => p.id === last);
            if (found) { setSelectedPresetId(found.id); setConfig(found.config); }
        }
        audio.loadPersisted();
        setSoundEnabled(audio.enabled); setSoundTheme(audio.theme); setSoundVolume(audio.volume);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Zapisy
    useEffect(() => {
        const defaultIds = new Set(DEFAULT_PRESETS.map((p) => p.id));
        const userPresets = presets.filter((p) => !defaultIds.has(p.id));
        safeStorage.set(STORAGE_KEYS.PRESETS, JSON.stringify(userPresets));
    }, [presets]);
    useEffect(() => { safeStorage.set(STORAGE_KEYS.LAST, selectedPresetId); }, [selectedPresetId]);

    // Refs aktualne
    useEffect(() => { sequenceRef.current = sequence; }, [sequence]);
    useEffect(() => { indexRef.current = index; }, [index]);
    useEffect(() => { runningRef.current = running; }, [running]);

    // Reset przy zmianie sekwencji
    useEffect(() => { hardReset(); /* eslint-disable-next-line */ }, [sequence.length]);

    // Fullscreen events
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const handler = () => {
            const fs = document.fullscreenElement === containerRef.current ||
                document.webkitFullscreenElement === containerRef.current;
            setIsFullscreen(fs);
        };
        document.addEventListener('fullscreenchange', handler);
        document.addEventListener('webkitfullscreenchange', handler);
        return () => {
            document.removeEventListener('fullscreenchange', handler);
            document.removeEventListener('webkitfullscreenchange', handler);
        };
    }, []);

    const current = sequence[index] ?? null;

    /* ─── Sterowanie ─── */
    function start() {
        audio.ensureContext();
        if (!current || runningRef.current) return;
        setRunning(true);
        anchorRef.current = performance.now() - elapsedInSeg * 1000;
    }
    function pause() { setRunning(false); if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    function softResetToSegment(i) {
        setIndex(i);
        setElapsedInSeg(0);
        setAccumulatedBefore(sequence.slice(0, i).reduce((a, s) => a + s.duration, 0));
        lastSecondRef.current = null;
    }
    function hardReset() { pause(); softResetToSegment(0); }
    function nextSegment() {
        const i = indexRef.current;
        if (i + 1 < sequenceRef.current.length) {
            softResetToSegment(i + 1);
            anchorRef.current = performance.now();
        } else {
            pause();
        }
    }
    function prevSegment() {
        if (elapsedInSeg > 1) { setElapsedInSeg(0); anchorRef.current = performance.now(); return; }
        const i = indexRef.current;
        if (i > 0) { softResetToSegment(i - 1); anchorRef.current = performance.now(); }
        else { setElapsedInSeg(0); anchorRef.current = performance.now(); }
    }
    function handlePlayPause() { running ? pause() : start(); }

    function toggleFullscreen() {
        if (!containerRef.current) return;
        const el = containerRef.current;
        if (!isFullscreen) {
            if (el.requestFullscreen) el.requestFullscreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
    }

    // RAF loop – stabilnie w useEffect
    useEffect(() => {
        if (!running) { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; return; }
        let mounted = true;
        const loop = (ts) => {
            if (!mounted || !runningRef.current) return;
            const seq = sequenceRef.current;
            const i = indexRef.current;
            const seg = seq[i];
            if (!seg) { setRunning(false); return; }

            const elapsed = Math.max(0, (ts - anchorRef.current) / 1000);
            const segDur = seg.duration;

            if (elapsed >= segDur) {
                setAccumulatedBefore((v) => v + segDur);
                setElapsedInSeg(0);
                anchorRef.current = ts;
                const nextSeg = seq[i + 1];
                if (nextSeg) playStartSound(nextSeg.type);
                else audio.playEvent('end-all');
                if (i + 1 < seq.length) setIndex(i + 1);
                else { setRunning(false); if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; return; }
            } else {
                setElapsedInSeg(elapsed);
                const remaining = Math.ceil(segDur - elapsed);
                if (remaining !== lastSecondRef.current) {
                    if ([3, 2, 1].includes(remaining)) audio.playEvent(`count${remaining}`);
                    lastSecondRef.current = remaining;
                }
                if (lastTypeRef.current !== seg.type) {
                    lastTypeRef.current = seg.type;
                    playStartSound(seg.type);
                }
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => { mounted = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [running]);

    function playStartSound(type) {
        if (type === 'work') audio.playEvent('start-work');
        else if (type === 'rest') audio.playEvent('start-rest');
        else if (type === 'setrest') audio.playEvent('start-setrest');
    }

    // Audio binding
    function onAudioEnabledChange(v) { setSoundEnabled(v); audio.setEnabled(v); audio.ensureContext(); }
    function onAudioThemeChange(t) { setSoundTheme(t); audio.setTheme(t); audio.ensureContext(); }
    function onAudioVolumeChange(v) { setSoundVolume(v); audio.setVolume(v); audio.ensureContext(); }

    // Presety
    function applyPreset(id) {
        const p = presets.find((x) => x.id === id);
        if (!p) return;
        setSelectedPresetId(p.id);
        setConfig(p.config);
    }
    function savePreset() {
        const name = newPresetName.trim();
        if (!name) return;
        const id = `user-${Date.now()}`;
        const preset = { id, name, config: { ...config } };
        setPresets((arr) => [...arr, preset]);
        setSelectedPresetId(id);
        setNewPresetName('');
    }
    function deletePreset(id) {
        if (DEFAULT_PRESETS.some((p) => p.id === id)) return;
        setPresets((arr) => arr.filter((p) => p.id !== id));
        if (selectedPresetId === id) {
            setSelectedPresetId(DEFAULT_PRESETS[0].id);
            setConfig(DEFAULT_PRESETS[0].config);
        }
    }
    function updateConfig(patch) { setSelectedPresetId('custom'); setConfig((c) => ({ ...c, ...patch })); }

    // Skróty
    useEffect(() => {
        const onKey = (e) => {
            if (e.repeat) return;
            if (e.key === ' ') { e.preventDefault(); handlePlayPause(); }
            else if (e.key === 'ArrowRight') nextSegment();
            else if (e.key === 'ArrowLeft') prevSegment();
            else if (e.key.toLowerCase() === 'f') toggleFullscreen();
            else if (e.key.toLowerCase() === 'r') hardReset();
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', onKey);
            return () => window.removeEventListener('keydown', onKey);
        }
    }, [running]);

    // Postęp
    const segProgress = current ? Math.min(1, elapsedInSeg / current.duration) : 0;
    const overallElapsed = accumulatedBefore + elapsedInSeg;
    const overallProgress = totalDuration > 0 ? Math.min(1, overallElapsed / totalDuration) : 0;

    // SVG ring
    const R = 78;
    const C = 2 * Math.PI * R;
    const dashOffset = C * (1 - segProgress);

    // Kolor segmentu dla tła
    const segColor = current?.color || 'var(--accent-work)';

    return (
        <div className={styles.wrapper} ref={containerRef}>
            <header className={styles.header}>
                <h3 className={styles.title}>Timer interwałowy (Hangboard)</h3>
                <div className={styles.headerButtons}>
                    <button className={`${styles.btn} ${styles.btnGhost}`} onClick={toggleFullscreen} title={isFullscreen ? 'Wyjdź z pełnego ekranu (F)' : 'Pełny ekran (F)'} aria-label="Pełny ekran">
                        {isFullscreen ? '⤢' : '⤢'}
                    </button>
                </div>
            </header>

            {/* Zakładki */}
            <nav className={styles.tabs} role="tablist" aria-label="Nawigacja">
                <TabButton active={tab === 'run'} onClick={() => setTab('run')} icon="▶">Trening</TabButton>
                <TabButton active={tab === 'config'} onClick={() => setTab('config')} icon="⚙">Konfiguracja</TabButton>
                <TabButton active={tab === 'presets'} onClick={() => setTab('presets')} icon="☆">Presety</TabButton>
                <TabButton active={tab === 'audio'} onClick={() => setTab('audio')} icon="🔊">Dźwięk</TabButton>
            </nav>

            {/* Główna karta: Trening */}
            {tab === 'run' && (
                <section className={styles.display} style={{ '--seg-color': segColor, '--overall': overallProgress }}>
                    {/* pionowy przepływ tła */}
                    <div className={styles.bgFlow} aria-hidden="true" />

                    <div className={styles.displayContent}>
                        {/* Pierścień + czas segmentu */}
                        <div className={styles.ringWrap}>
                            <svg className={styles.ring} viewBox="0 0 200 200" role="img" aria-label="Postęp segmentu">
                                <circle className={styles.ringBg} cx="100" cy="100" r={R} />
                                <circle className={styles.ringFg} cx="100" cy="100" r={R} stroke={segColor} strokeDasharray={C} strokeDashoffset={dashOffset}/>
                            </svg>
                            <div className={styles.timeBig}>
                                <div className={styles.segLabel} title={current?.label || '—'}>{current?.label || '—'}</div>
                                <div className={styles.segTime}>{formatHMS(Math.ceil((current?.duration ?? 0) - elapsedInSeg))}</div>
                            </div>
                        </div>

                        {/* Panel informacji + sterowanie */}
                        <div className={styles.infoPanel}>
                            <div className={styles.infoRow}>
                                <div>
                                    <div className={styles.infoKicker}>Postęp całości</div>
                                    <div className={styles.infoValue}>
                                        {formatHMS(Math.ceil(totalDuration - overallElapsed))} / {formatHMS(totalDuration)}
                                    </div>
                                </div>
                                <div className={styles.infoNext}>
                                    <span>Następne:</span>
                                    <strong>{sequence[index + 1]?.label ?? '—'}</strong>
                                </div>
                            </div>

                            <div className={styles.progressRail} aria-label="Postęp całkowity">
                                <div className={styles.progressFill} style={{ width: `${overallProgress * 100}%`, background: segColor }} />
                            </div>

                            <div className={styles.controlsRow}>
                                <button className={`${styles.iconCircle}`} onClick={prevSegment} title="Poprzedni (←)" aria-label="Poprzedni segment">⟨</button>

                                <button
                                    className={`${styles.playBtn} ${running ? styles.playBtnPause : styles.playBtnPlay}`}
                                    onClick={handlePlayPause}
                                    title={running ? 'Pauza (Space)' : 'Start (Space)'}
                                    aria-label={running ? 'Pauza' : 'Start'}
                                >
                                    {running ? '⏸' : '▶'}
                                </button>

                                <button className={`${styles.iconCircle}`} onClick={nextSegment} title="Następny (→)" aria-label="Następny segment">⟩</button>

                                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={hardReset} title="Reset (R)">Reset</button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Karta: Konfiguracja */}
            {tab === 'config' && (
                <section className={styles.card}>
                    <h4>Konfiguracja</h4>
                    <div className={styles.grid}>
                        <Field label="Przygotowanie (s)" value={config.prepSec} min={0} max={600} onChange={(v) => updateConfig({ prepSec: v })} />
                        <Field label="Chwyt (s)" value={config.workSec} min={1} max={180} onChange={(v) => updateConfig({ workSec: v })} />
                        <Field label="Odpoczynek (s)" value={config.restSec} min={0} max={180} onChange={(v) => updateConfig({ restSec: v })} />
                        <Field label="Powtórzenia" value={config.reps} min={1} max={30} onChange={(v) => updateConfig({ reps: v })} />
                        <Field label="Serie" value={config.sets} min={1} max={20} onChange={(v) => updateConfig({ sets: v })} />
                        <Field label="Przerwa między seriami (s)" value={config.setRestSec} min={0} max={1800} onChange={(v) => updateConfig({ setRestSec: v })} />
                    </div>
                </section>
            )}

            {/* Karta: Presety */}
            {tab === 'presets' && (
                <section className={styles.card}>
                    <h4>Presety</h4>
                    <div className={styles.presetRow}>
                        <select className={styles.input} value={selectedPresetId} onChange={(e) => applyPreset(e.target.value)} aria-label="Wybierz preset">
                            <option value="custom" disabled>(Konfiguracja niestandardowa)</option>
                            {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <button className={styles.btn} onClick={() => applyPreset(selectedPresetId)}>Zastosuj</button>
                    </div>

                    <div className={styles.presetSaveRow}>
                        <input className={styles.input} type="text" placeholder="Nazwa własnego presetu…" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} />
                        <button className={styles.btn} onClick={savePreset}>Zapisz jako preset</button>
                    </div>

                    <ul className={styles.presetList}>
                        {presets.map((p) => {
                            const isDefault = DEFAULT_PRESETS.some((d) => d.id === p.id);
                            return (
                                <li key={p.id} className={styles.presetItem}>
                                    <span className={styles.presetName}>{p.name}</span>
                                    <div className={styles.presetActions}>
                                        <button className={styles.btnSmall} onClick={() => applyPreset(p.id)}>Użyj</button>
                                        <button className={styles.btnSmall} disabled={isDefault} title={isDefault ? 'Preset wbudowany' : 'Usuń preset'} onClick={() => deletePreset(p.id)}>Usuń</button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {/* Karta: Dźwięk */}
            {tab === 'audio' && (
                <section className={styles.card}>
                    <h4>Dźwięk</h4>
                    <div className={styles.audioRow}>
                        <label className={styles.switchLabel}>
                            <input type="checkbox" checked={soundEnabled} onChange={(e) => onAudioEnabledChange(e.target.checked)} />
                            <span> Włącz dźwięk</span>
                        </label>
                        <label className={styles.audioItem}>
                            Motyw:
                            <select className={styles.input} value={soundTheme} onChange={(e) => onAudioThemeChange(e.target.value)} disabled={!soundEnabled}>
                                <option value="classic">Klasyczny</option>
                                <option value="digital">Cyfrowy</option>
                                <option value="gong">Gong</option>
                            </select>
                        </label>
                        <label className={styles.audioItem}>
                            Głośność: {Math.round(soundVolume * 100)}%
                            <input type="range" min="0" max="1" step="0.01" value={soundVolume} onChange={(e) => onAudioVolumeChange(Number(e.target.value))} disabled={!soundEnabled} />
                        </label>
                    </div>
                    <p className={styles.note}>Dźwięk działa po pierwszej interakcji użytkownika (wymóg przeglądarek).</p>
                </section>
            )}

            <footer className={styles.footer}>
                <small>
                    Skróty: <kbd>Space</kbd> – Start/Pauza, <kbd>←</kbd>/<kbd>→</kbd> – Poprzedni/Następny,
                    <kbd>R</kbd> – Reset, <kbd>F</kbd> – Pełny ekran
                </small>
            </footer>
        </div>
    );
}

/* ───────────── Małe komponenty ───────────── */

function TabButton({ active, onClick, icon, children }) {
    return (
        <button
            role="tab"
            aria-selected={active}
            className={`${styles.tabBtn} ${active ? styles.tabBtnActive : ''}`}
            onClick={onClick}
        >
            <span className={styles.tabIcon}>{icon}</span>
            <span>{children}</span>
        </button>
    );
}

function Field({ label, value, min, max, onChange }) {
    const [local, setLocal] = useState(String(value));
    useEffect(() => setLocal(String(value)), [value]);
    const commit = () => {
        const parsed = parseInt(local, 10);
        if (!Number.isFinite(parsed)) { setLocal(String(value)); return; }
        const v = Math.min(Math.max(parsed, min), max);
        onChange(v); setLocal(String(v));
    };
    return (
        <label className={styles.field}>
            <span className={styles.fieldLabel}>{label}</span>
            <input
                className={styles.fieldInput}
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setLocal(String(value)); }}
            />
        </label>
    );
}