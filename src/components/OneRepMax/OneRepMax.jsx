import React, { useMemo, useState, useEffect, useRef } from 'react';
import styles from './OneRepMax.module.css';

/* ════════════════════════════════════════════════════════════
   Stałe i funkcje pomocnicze – poza komponentami
   ════════════════════════════════════════════════════════════ */

const FORMULA_WIKI =
    'https://en.wikipedia.org/wiki/One-repetition_maximum#Estimation_formulas';

const FORMULA_LABEL = {
    epley:    'Epley',
    brzycki:  'Brzycki',
    oconner:  "O'Conner",
    lander:   'Lander',
    lombardi: 'Lombardi',
    wathan:   'Wathan',
};

const PCT_MIN  = 40;
const PCT_MAX  = 100;
const PCT_ROWS = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40];

const PLATE_SIZES = [25, 20, 15, 10, 5, 2.5, 1.25];

const PLATE_COLORS = {
    '25':   '#D62728',
    '20':   '#1F77B4',
    '15':   '#FFBF00',
    '10':   '#2CA02C',
    '5':    '#FFFFFF',
    '2.5':  '#A9A9A9',
    '1.25': '#6E6E6E',
};

const MAX_PLATES_PER_SIDE = 10;

/* Bazowe wymiary talerzy (skala 1×) */
const PLATE_BASE_HEIGHT = {
    '25': 140, '20': 122, '15': 106, '10': 88,
    '5':  70,  '2.5': 54, '1.25': 40,
};
const PLATE_BASE_WIDTH = {
    '25': 26, '20': 22, '15': 19, '10': 16,
    '5':  13, '2.5': 10, '1.25': 8,
};
const PLATE_GAP  = 3;
const SLEEVE_W   = 16;
const BAR_MIN_W  = 40;
const MAX_SCALE  = 2.2;
const MIN_SCALE  = 0.3;

const round2       = (x) => Math.round(x * 100) / 100;
const roundToPlate = (x) => Math.round(x / 2.5) * 2.5;

const epley    = (w, r) => r === 1 ? w : w * (1 + r / 30);
const brzycki  = (w, r) => r === 1 ? w : (37 - r) <= 0 ? NaN : (w * 36) / (37 - r);
const oconner  = (w, r) => r === 1 ? w : w * (1 + 0.025 * r);
const lander   = (w, r) => r === 1 ? w : (101.3 - 2.67123 * r) === 0 ? NaN : (100 * w) / (101.3 - 2.67123 * r);
const lombardi = (w, r) => r === 1 ? w : w * Math.pow(r, 0.10);
const wathan   = (w, r) => {
    if (r === 1) return w;
    const d = 48.8 + 53.8 * Math.exp(-0.075 * r);
    return d === 0 ? NaN : (100 * w) / d;
};

const estimateRepsAtWeight = (oneRM, w) => {
    if (!(oneRM > 0) || !(w > 0)) return NaN;
    return Math.max(1, Math.round(30 * (oneRM / w - 1)));
};

/* Object.assign trick: zwraca typ `{}` akceptowany przez React jako CSSProperties */
const fillStyle = (val, min, max) =>
    Object.assign({}, { '--fill': `${((val - min) / (max - min)) * 100}%` });

const activeRowPct = (pct) =>
    PCT_ROWS.find((p) => p <= pct) ?? PCT_ROWS[PCT_ROWS.length - 1];

function calcPlates(targetKg, barbellKg) {
    const perSide = round2((targetKg - barbellKg) / 2);
    if (perSide <= 0) return { plates: [], remainder: 0, overflow: false };
    let remaining = perSide;
    const plates = [];
    for (const size of PLATE_SIZES) {
        while (remaining > 0.001) {
            if (size > remaining + 0.001) break;
            plates.push(size);
            remaining = round2(remaining - size);
            if (plates.length >= MAX_PLATES_PER_SIDE) break;
        }
        if (plates.length >= MAX_PLATES_PER_SIDE) break;
    }
    const overflow = plates.length >= MAX_PLATES_PER_SIDE && remaining > 0.001;
    return { plates, remainder: round2(remaining), overflow };
}


/* ════════════════════════════════════════════════════════════
   NumericInput
   ════════════════════════════════════════════════════════════ */
function NumericInput({ value, min, max, step, ariaLabel, onCommit, className }) {
    const [local, setLocal] = useState(String(value));

    useEffect(() => { setLocal(String(value)); }, [value]);

    const commit = () => {
        const parsed  = parseFloat(local);
        const clamped = Number.isFinite(parsed)
            ? Math.min(Math.max(parsed, min), max)
            : value;
        onCommit(clamped);
        setLocal(String(clamped));
    };

    return (
        <input
            type="number" inputMode="decimal"
            min={min} max={max} step={step}
            className={className} aria-label={ariaLabel}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter')  commit();
                if (e.key === 'Escape') setLocal(String(value));
            }}
        />
    );
}


/* ════════════════════════════════════════════════════════════
   PlateViz – wizualizacja talerzy z adaptacyjną skalą
   ════════════════════════════════════════════════════════════ */
function PlateViz({ targetKg, barbellKg, onBarbellChange }) {
    const wrapRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        if (!wrapRef.current) return;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) setContainerWidth(entry.contentRect.width);
        });
        ro.observe(wrapRef.current);
        setContainerWidth(wrapRef.current.getBoundingClientRect().width);
        return () => ro.disconnect();
    }, []);

    const canLoad = targetKg > barbellKg;

    const { plates, remainder, overflow } = useMemo(
        () => canLoad
            ? calcPlates(targetKg, barbellKg)
            : { plates: [], remainder: 0, overflow: false },
        [targetKg, barbellKg, canLoad],
    );

    const scale = useMemo(() => {
        if (plates.length === 0 || containerWidth === 0) return MAX_SCALE;
        const naturalW =
            plates.reduce((acc, kg) => acc + PLATE_BASE_WIDTH[String(kg)], 0) +
            Math.max(0, plates.length - 1) * PLATE_GAP;
        const available = containerWidth - BAR_MIN_W - SLEEVE_W;
        return Math.min(MAX_SCALE, Math.max(MIN_SCALE, available / naturalW));
    }, [plates, containerWidth]);

    const ph  = (kg) => Math.round(PLATE_BASE_HEIGHT[String(kg)] * scale);
    const pw  = (kg) => Math.round(PLATE_BASE_WIDTH[String(kg)]  * scale);
    const maxH = plates.length > 0 ? Math.max(...plates.map(ph)) : 60;

    return (
        <div className={styles.vizWrap} ref={wrapRef}>
            <h4 className={styles.vizTitle}>Talerze na gryf (jedna strona)</h4>

            <div className={styles.vizBarbellSelect}>
                <span>Gryf:</span>
                <select
                    value={barbellKg}
                    onChange={(e) => onBarbellChange(Number(e.target.value))}
                    aria-label="Ciężar gryfu"
                >
                    {[10, 15, 20, 25].map((w) => (
                        <option key={w} value={w}>{w} kg</option>
                    ))}
                </select>
            </div>

            <div className={styles.vizBarbell} style={{ height: maxH + 20 }}>
                <div className={styles.vizBar} />
                <div className={styles.vizPlates} style={{ gap: PLATE_GAP }}>
                    {plates.length === 0 && !canLoad && (
                        <span className={styles.vizEmpty}>brak talerzy</span>
                    )}
                    {plates.map((kg, i) => (
                        <div
                            key={`${kg}-${i}`}
                            className={styles.vizPlate}
                            style={{
                                width:      pw(kg),
                                height:     ph(kg),
                                minWidth:   pw(kg),
                                background: PLATE_COLORS[String(kg)],
                                color:      String(kg) === '5' ? '#000' : '#fff',
                                fontSize:   Math.max(8, Math.round(11 * scale)),
                            }}
                            title={`${kg} kg`}
                        >
                            {kg}
                        </div>
                    ))}
                </div>
                <div
                    className={styles.vizSleeve}
                    style={{ height: Math.round(22 * Math.min(scale, 1.5)) }}
                />
            </div>

            {plates.length > 0 && (
                <div className={styles.vizList}>
                    {PLATE_SIZES.filter((s) => plates.includes(s)).map((s) => {
                        const count = plates.filter((p) => p === s).length;
                        return (
                            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                                <span
                                    className={styles.vizListSwatch}
                                    style={{ background: PLATE_COLORS[String(s)] }}
                                />
                                <span>{s} kg × {count}</span>
                            </div>
                        );
                    })}
                    <div className={styles.vizTotal}>
                        Łącznie: {round2(plates.reduce((a, b) => a + b, 0))} kg / stronę
                    </div>
                </div>
            )}

            {overflow && (
                <p className={styles.vizOverflow}>
                    Pokazano {MAX_PLATES_PER_SIDE} talerzy — ciężar wymaga więcej.
                    Włącz zaokrąglanie lub użyj większych talerzy.
                </p>
            )}
            {!overflow && remainder > 0 && (
                <p className={styles.vizRemainder}>
                    Nie można złożyć dokładnie: brakuje {remainder} kg
                </p>
            )}
            {!canLoad && (
                <p className={styles.vizEmpty}>
                    Wybrany ciężar ≤ gryf ({barbellKg} kg)
                </p>
            )}
        </div>
    );
}


/* ════════════════════════════════════════════════════════════
   Główny komponent
   ════════════════════════════════════════════════════════════ */
// eslint-disable-next-line import/no-unused-modules
export default function OneRepMax() {
    const [weight,      setWeight]      = useState(100);
    const [reps,        setReps]        = useState(5);
    const [pct,         setPct]         = useState(80);
    const [roundPlates, setRoundPlates] = useState(false);
    const [barbellKg,   setBarbellKg]   = useState(20);

    /* ── Masa własnego ciała ── */
    const [bwMode,      setBwMode]      = useState(false);
    const [bodyWeight,  setBodyWeight]  = useState(80);

    /* ── Widoczność formuł ── */
    const [showFormulas, setShowFormulas] = useState(false);

    /*
      effectiveWeight = ciężar zewnętrzny + (masa ciała gdy bwMode włączony)
      To jest wartość przekazywana do formuł 1RM.
    */
    const effectiveWeight = bwMode ? round2(weight + bodyWeight) : weight;

    /* ── Obliczenia 1RM ── */
    const results = useMemo(() => {
        if (!(effectiveWeight > 0) || !(reps >= 1 && reps <= 20)) return null;

        const perKg = {
            epley:    epley(effectiveWeight, reps),
            brzycki:  brzycki(effectiveWeight, reps),
            oconner:  oconner(effectiveWeight, reps),
            lander:   lander(effectiveWeight, reps),
            lombardi: lombardi(effectiveWeight, reps),
            wathan:   wathan(effectiveWeight, reps),
        };

        const vals  = Object.values(perKg).filter(Number.isFinite);
        const avgKg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
        const fmt   = (kg) => round2(roundPlates ? roundToPlate(kg) : kg);

        return {
            perFormula: Object.fromEntries(
                Object.entries(perKg).map(([k, v]) => [k, Number.isFinite(v) ? fmt(v) : NaN]),
            ),
            average:     Number.isFinite(avgKg) ? fmt(avgKg) : NaN,
            averageNoBw: (bwMode && Number.isFinite(avgKg))
                ? fmt(avgKg - bodyWeight)
                : NaN,
            /* Wartości per-formuła bez masy ciała */
            perFormulaNoBw: bwMode
                ? Object.fromEntries(
                    Object.entries(perKg).map(([k, v]) =>
                        [k, Number.isFinite(v) ? fmt(v - bodyWeight) : NaN]
                    )
                )
                : null,
        };
    }, [effectiveWeight, reps, roundPlates, bwMode, bodyWeight]);

    /* ── Tabela %1RM ── */
    const percentRows = useMemo(() => {
        if (!results || !Number.isFinite(results.average)) return [];
        return PCT_ROWS.map((p) => {
            const raw = results.average * (p / 100);
            const w   = round2(roundPlates ? roundToPlate(raw) : raw);
            return { p, w, reps: estimateRepsAtWeight(results.average, w) };
        });
    }, [results, roundPlates]);

    /* ── Ciężar dla wybranego %1RM ── */
    const sliderWeight = useMemo(() => {
        if (!results || !Number.isFinite(results.average)) return NaN;
        const raw = results.average * (pct / 100);
        return round2(roundPlates ? roundToPlate(raw) : raw);
    }, [results, pct, roundPlates]);

    const highlightPct    = activeRowPct(pct);
    const isWeightInvalid = !(weight > 0);
    const isRepsInvalid   = !(reps >= 1 && reps <= 20);

    /* Przełącznik zaokrąglania – wewnątrz dl.highlight */
    const RoundSwitch = ({ ariaLabel }) => (
        <dd className={styles.highlightSwitchRow}>
            <label className={styles.switch}>
                <input
                    type="checkbox"
                    checked={roundPlates}
                    onChange={(e) => setRoundPlates(e.target.checked)}
                    aria-label={ariaLabel}
                />
                <span className={styles.switchSlider}></span>
            </label>
            <span className={styles.switchLabel}>Zaokrąglij do talerzy (2,5 kg)</span>
        </dd>
    );

    /* Przełącznik formuł – poza dl.highlight, pod oboma blokami */
    const ShowFormulasSwitch = () => (
        <div className={styles.showFormulasRow}>
            <label className={styles.switch}>
                <input
                    type="checkbox"
                    checked={showFormulas}
                    onChange={(e) => setShowFormulas(e.target.checked)}
                    aria-label="Pokaż wyniki poszczególnych formuł"
                />
                <span className={styles.switchSlider}></span>
            </label>
            <span className={styles.switchLabel}>Pokaż formuły</span>
        </div>
    );

    return (
        <div className={styles.wrapper}>
            <h3 style={{ marginTop: 0 }}>Kalkulator 1RM (One‑Rep Max)</h3>

            {/* ── Ciężar ── */}
            <div style={{ marginBottom: 6 }}>
                <label htmlFor="orm-weight" className={styles.label}>
                    Ciężar: <span>{weight} kg</span>
                    {bwMode && (
                        <span className={styles.labelBwNote}>
                            {' '}(łącznie z masą ciała: {effectiveWeight} kg)
                        </span>
                    )}
                </label>
                <div className={styles.row}>
                    <input
                        id="orm-weight" className={styles.range}
                        type="range" min={0} max={300} step={0.5}
                        value={weight}
                        style={fillStyle(weight, 0, 300)}
                        aria-valuemin={0} aria-valuemax={300}
                        aria-valuenow={weight} aria-valuetext={`${weight} kg`}
                        onChange={(e) => setWeight(Number(e.target.value))}
                    />
                    <div className={styles.inputSuffix}>
                        <NumericInput
                            value={weight} min={0} max={300} step={0.5}
                            ariaLabel="Ciężar (kg)" className={styles.number}
                            onCommit={setWeight}
                        />
                        <span className={styles.suffix}>kg</span>
                    </div>
                </div>
                {isWeightInvalid && (
                    <div style={{ color: 'var(--ifm-color-danger)' }}>Podaj dodatni ciężar.</div>
                )}

                {/* Przełącznik masy własnego ciała */}
                <div className={styles.bwToggleRow}>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={bwMode}
                            onChange={(e) => setBwMode(e.target.checked)}
                            aria-label="Ćwiczenie z masą własnego ciała"
                        />
                        <span className={styles.switchSlider}></span>
                    </label>
                    <span className={styles.switchLabel}>Ćwiczenie z masą własnego ciała</span>
                </div>

                {/* Suwak masy ciała – widoczny tylko gdy bwMode */}
                {bwMode && (
                    <div className={styles.bwSection}>
                        <label htmlFor="orm-bw" className={styles.bwLabel}>
                            Masa ciała: <span>{bodyWeight} kg</span>
                        </label>
                        <div className={styles.row}>
                            <input
                                id="orm-bw"
                                className={`${styles.range} ${styles.rangeBw}`}
                                type="range" min={30} max={200} step={0.5}
                                value={bodyWeight}
                                style={Object.assign({}, { '--fill': `${((bodyWeight - 30) / (200 - 30)) * 100}%` })}
                                aria-valuemin={30} aria-valuemax={200}
                                aria-valuenow={bodyWeight}
                                aria-valuetext={`${bodyWeight} kg`}
                                onChange={(e) => setBodyWeight(Number(e.target.value))}
                            />
                            <div className={styles.inputSuffix}>
                                <NumericInput
                                    value={bodyWeight} min={30} max={200} step={0.5}
                                    ariaLabel="Masa ciała (kg)" className={styles.number}
                                    onCommit={setBodyWeight}
                                />
                                <span className={styles.suffix}>kg</span>
                            </div>
                        </div>
                        <p className={styles.bwHint}>
                            Masa ciała jest dodawana do ciężaru zewnętrznego (np. podciąganie, dipy z obciążeniem).
                        </p>
                    </div>
                )}
            </div>

            {/* ── Powtórzenia ── */}
            <div style={{ marginBottom: 14, marginTop: 14 }}>
                <label htmlFor="orm-reps" className={styles.label}>
                    Powtórzenia: <span>{reps}</span>
                </label>
                <div className={styles.row}>
                    <input
                        id="orm-reps" className={styles.range}
                        type="range" min={1} max={20} step={1}
                        value={reps}
                        style={fillStyle(reps, 1, 20)}
                        aria-valuemin={1} aria-valuemax={20}
                        aria-valuenow={reps} aria-valuetext={`${reps} powtórzeń`}
                        onChange={(e) => setReps(Number(e.target.value))}
                    />
                    <NumericInput
                        value={reps} min={1} max={20} step={1}
                        ariaLabel="Powtórzenia" className={styles.number}
                        onCommit={(v) => setReps(Math.round(v))}
                    />
                </div>
                {isRepsInvalid && (
                    <div style={{ color: 'var(--ifm-color-danger)' }}>Zakres 1–20 powtórzeń.</div>
                )}
            </div>

            <hr style={{ margin: '16px 0' }} />

            {!results && <p>Ustaw ciężar i powtórzenia, aby zobaczyć szacunek 1RM.</p>}

            {results && (
                <>
                    {/* ── Średnia + opcjonalnie "bez masy ciała" jako równorzędne bloki ── */}
                    <div className={styles.highlightRow}>
                        <dl className={styles.highlight} style={{ flex: 1 }}>
                            <dt className={styles.highlightLabel}>Twój 1RM (One‑Rep Max)</dt>
                            <dd className={styles.highlightValue}>
                                {Number.isFinite(results.average) ? `${results.average} kg` : '—'}
                            </dd>
                            <RoundSwitch ariaLabel="Zaokrąglij wyniki do talerzy (2,5 kg)" />
                        </dl>
                        {bwMode && Number.isFinite(results.averageNoBw) && (
                            <dl className={`${styles.highlight} ${styles.highlightBw}`} style={{ flex: 1 }}>
                                <dt className={styles.highlightLabel}>1RM Bez masy ciała</dt>
                                <dd className={styles.highlightValue}>
                                    {results.averageNoBw} kg
                                </dd>
                                <RoundSwitch ariaLabel="Zaokrąglij wynik bez masy ciała do talerzy (2,5 kg)" />
                            </dl>
                        )}
                    </div>

                    {/* ── Przełącznik formuł – poza blokami highlight ── */}
                    <ShowFormulasSwitch />

                    {/* ── Karty formuł (opcjonalne) ── */}
                    {showFormulas && (
                        <>
                            <div className={styles.formulaGrid}>
                                {Object.entries(results.perFormula).map(([key, val]) => {
                                    const noBw = results.perFormulaNoBw?.[key];
                                    return (
                                        <dl key={key} className={styles.card}>
                                            <div>
                                                <dt>{FORMULA_LABEL[key]}</dt>
                                                <dd className={styles.cardValueGreen}>
                                                    {Number.isFinite(val) ? `${val} kg` : '—'}
                                                </dd>
                                                {bwMode && Number.isFinite(noBw) && (
                                                    <dd className={styles.cardValueBw}>
                                                        {noBw} kg
                                                    </dd>
                                                )}
                                            </div>
                                        </dl>
                                    );
                                })}
                            </div>
                            <p className={styles.formulaSource}>
                                Źródło formuł:{' '}
                                <a href={FORMULA_WIKI} target="_blank" rel="noopener noreferrer">
                                    One-repetition maximum – Wikipedia ↗
                                </a>
                            </p>
                        </>
                    )}

                    <hr style={{ margin: '16px 0' }} />

                    <h3 style={{ marginTop: 0, marginBottom: 12 }}>Ile chcesz teraz podnieść?</h3>

                    {/* ── Suwak %1RM ── */}
                    <div className={styles.pctSection}>
                        <label htmlFor="orm-pct" className={styles.label}>
                            Wybrany poziom: <strong>{pct}% 1RM</strong>
                        </label>
                        <div className={styles.row}>
                            <input
                                id="orm-pct" className={styles.range}
                                type="range" min={PCT_MIN} max={PCT_MAX} step={1}
                                value={pct}
                                style={fillStyle(pct, PCT_MIN, PCT_MAX)}
                                aria-valuemin={PCT_MIN} aria-valuemax={PCT_MAX}
                                aria-valuenow={pct} aria-valuetext={`${pct}%`}
                                onChange={(e) => setPct(Number(e.target.value))}
                            />
                            <NumericInput
                                value={pct} min={PCT_MIN} max={PCT_MAX} step={1}
                                ariaLabel="Procent 1RM" className={styles.number}
                                onCommit={(v) => setPct(Math.round(v))}
                            />
                        </div>
                        <p className={styles.pctHint}>
                            Orientacyjnie: Siła maksymalna ~80–100% 1RM; Hipertrofia (przyrost masy mięśniowej) ~60–80% 1RM; Wytrzymałość mięśniowa &lt;60% 1RM.{' '}
                            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7927075/" target="_blank" rel="noopener noreferrer">
                                Źródło ↗
                            </a>
                        </p>
                    </div>

                    {/* ── Wybrany ciężar + tylko zaokrąglanie (bez przełącznika formuł) ── */}
                    <dl
                        className={`${styles.highlight} ${styles.highlightSelected}`}
                        style={{ marginBottom: 16 }}
                    >
                        <dt className={styles.highlightLabel}>Ciężar dla {pct}% 1RM</dt>
                        <dd className={styles.highlightValue}>
                            {Number.isFinite(sliderWeight) ? `${sliderWeight} kg` : '—'}
                        </dd>
                        <RoundSwitch ariaLabel="Zaokrąglij wybrany ciężar do talerzy (2,5 kg)" />
                    </dl>

                    {/* ── Tabela + wizualizacja ── */}
                    {percentRows.length > 0 && (
                        <div className={styles.tableAndViz}>
                            <div className={styles.tableWrap}>
                                <h4>Proponowane ciężary (%1RM)</h4>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="table">
                                        <thead>
                                        <tr>
                                            <th>% 1RM</th>
                                            <th>Ciężar (kg)</th>
                                            <th>Szac. max powt.</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {percentRows.map((row) => (
                                            <tr
                                                key={row.p}
                                                className={row.p === highlightPct ? styles.rowActive : undefined}
                                            >
                                                <td>{row.p}%</td>
                                                <td>{row.w} kg</td>
                                                <td>{Number.isFinite(row.reps) ? row.reps : '—'}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className={styles.tableNote}>
                                    Liczba powtórzeń szacowana wg odwróconego wzoru Epleya; traktuj jako punkt wyjścia.
                                </p>
                            </div>

                            {Number.isFinite(sliderWeight) && (
                                <PlateViz
                                    targetKg={sliderWeight}
                                    barbellKg={barbellKg}
                                    onBarbellChange={setBarbellKg}
                                />
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}