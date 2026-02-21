import React, { useMemo, useState, useEffect, useRef } from 'react';
import styles from './OneRepMax.module.css';

/* ════════════════════════════════════════════════════════════
   Stałe i funkcje pomocnicze – poza komponentami
   ════════════════════════════════════════════════════════════ */

const FORMULA_WIKI =
    'https://en.wikipedia.org/wiki/One-repetition_maximum#Estimation_formulas';

const FORMULA_LABEL = {
    epley: 'Epley',
    brzycki: 'Brzycki',
    oconner: "O'Conner",
    lander: 'Lander',
    lombardi: 'Lombardi',
    wathan: 'Wathan',
};

const PCT_MIN = 40;
const PCT_MAX = 100;
const PCT_ROWS = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40];

/* Dostępne rozmiary talerzy (kg) – od największego */
const PLATE_SIZES = [25, 20, 15, 10, 5, 2.5, 1.25];

/* Kolory talerzy (z grubsza zbliżone do standardów) */
const PLATE_COLORS = {
    '25': '#D62728',   // czerwony
    '20': '#1F77B4',   // niebieski
    '15': '#FFBF00',   // żółty
    '10': '#2CA02C',   // zielony
    '5':  '#FFFFFF',   // biały
    '2.5':'#A9A9A9',   // szary
    '1.25':'#6E6E6E',  // ciemnoszary
};

/* Maks. liczba talerzy na jedną stronę (ochrona przed groteskowym widokiem) */
const MAX_PLATES_PER_SIDE = 10;

const round2 = (x) => Math.round(x * 100) / 100;
const roundToPlate = (x) => Math.round(x / 2.5) * 2.5;

/* Formuły 1RM – przy reps === 1 zwracają dokładnie podany ciężar */
const epley = (w, r) => (r === 1 ? w : w * (1 + r / 30));
const brzycki = (w, r) => (r === 1 ? w : (37 - r) <= 0 ? NaN : (w * 36) / (37 - r));
const oconner = (w, r) => (r === 1 ? w : w * (1 + 0.025 * r));
const lander = (w, r) =>
    r === 1 ? w : (101.3 - 2.67123 * r) === 0 ? NaN : (100 * w) / (101.3 - 2.67123 * r);
const lombardi = (w, r) => (r === 1 ? w : w * Math.pow(r, 0.1));
const wathan = (w, r) => {
    if (r === 1) return w;
    const d = 48.8 + 53.8 * Math.exp(-0.075 * r);
    return d === 0 ? NaN : (100 * w) / d;
};

/* Odwrócona Epley do oszacowania max powtórzeń przy danym %1RM */
const estimateRepsAtWeight = (oneRM, w) => {
    if (!(oneRM > 0) || !(w > 0)) return NaN;
    return Math.max(1, Math.round(30 * (oneRM / w - 1)));
};

const fillStyle = (val, min, max) => ({
    '--fill': `${((val - min) / (max - min)) * 100}%`,
});

/* Najwyższy wiersz PCT_ROWS ≤ pct */
const activeRowPct = (pct) => PCT_ROWS.find((p) => p <= pct) ?? PCT_ROWS[PCT_ROWS.length - 1];

/*
  Oblicza talerze na jedną stronę gryfu.
  Poprawka: warunek `remaining > 0.001` zapobiega wejściu w pętlę
  przy ujemnych wartościach będących efektem błędów zmiennoprzecinkowych.
*/
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
   NumericInput – edycja jako string (brak "przyklejonego zera")
   ════════════════════════════════════════════════════════════ */
function NumericInput({ value, min, max, step, ariaLabel, onCommit, className }) {
    const [local, setLocal] = useState(String(value));

    useEffect(() => {
        setLocal(String(value));
    }, [value]);

    const handleChange = (e) => setLocal(e.target.value);

    const commit = () => {
        const parsed = parseFloat(local);
        const clamped = Number.isFinite(parsed)
            ? Math.min(Math.max(parsed, min), max)
            : value;
        onCommit(clamped);
        setLocal(String(clamped));
    };

    const handleBlur = () => commit();

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setLocal(String(value));
    };

    return (
        <input
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            className={className}
            aria-label={ariaLabel}
            value={local}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
        />
    );
}

/* ════════════════════════════════════════════════════════════
   Stałe wizualne talerzy – wartości bazowe (1× skala)
   ════════════════════════════════════════════════════════════ */
const PLATE_BASE_HEIGHT = {
    '25': 140, '20': 122, '15': 106, '10': 88,
    '5': 70, '2.5': 54, '1.25': 40,
};
const PLATE_BASE_WIDTH = {
    '25': 26, '20': 22, '15': 19, '10': 16,
    '5': 13, '2.5': 10, '1.25': 8,
};
const PLATE_GAP = 3;     /* px między talerzami */
const SLEEVE_W = 16;     /* px – tuleja */
const BAR_MIN_W = 40;    /* px – min. widoczna część pręta */
const MAX_SCALE = 2.2;   /* max powiększenie względem bazy */
const MIN_SCALE = 0.3;   /* min pomniejszenie */

/* ════════════════════════════════════════════════════════════
   PlateViz – wizualizacja talerzy z adaptacyjną skalą
   ════════════════════════════════════════════════════════════ */
function PlateViz({ targetKg, barbellKg, onBarbellChange /*, roundPlates */ }) {
    const wrapRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    /* Obserwuj szerokość kontenera (tylko client-side) */
    useEffect(() => {
        if (!wrapRef.current) return;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        ro.observe(wrapRef.current);
        // Inicjalny odczyt
        setContainerWidth(wrapRef.current.getBoundingClientRect().width);
        return () => ro.disconnect();
    }, []);

    const canLoad = targetKg > barbellKg;

    const { plates, remainder, overflow } = useMemo(
        () => (canLoad ? calcPlates(targetKg, barbellKg) : { plates: [], remainder: 0, overflow: false }),
        [targetKg, barbellKg, canLoad],
    );

    /* Oblicz skalę tak, żeby talerze mieściły się w dostępnej szerokości */
    const scale = useMemo(() => {
        if (plates.length === 0 || containerWidth === 0) return MAX_SCALE;
        const naturalW =
            plates.reduce((acc, kg) => acc + PLATE_BASE_WIDTH[String(kg)], 0) +
            Math.max(0, plates.length - 1) * PLATE_GAP;
        const available = containerWidth - BAR_MIN_W - SLEEVE_W;
        const raw = available / naturalW;
        return Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));
    }, [plates, containerWidth]);

    /* Skalowane wymiary */
    const ph = (kg) => Math.round(PLATE_BASE_HEIGHT[String(kg)] * scale);
    const pw = (kg) => Math.round(PLATE_BASE_WIDTH[String(kg)] * scale);

    const maxH = plates.length > 0 ? Math.max(...plates.map((kg) => ph(kg))) : 60;

    return (
        <div className={styles.vizWrap} ref={wrapRef}>
            <h4 className={styles.vizTitle}>Talerze na gryf (jedna strona)</h4>

            {/* Wybór ciężaru gryfu */}
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

            {/* Rysunek gryfu */}
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
                                width: pw(kg),
                                height: ph(kg),
                                minWidth: pw(kg),
                                background: PLATE_COLORS[String(kg)],
                                color: (String(kg) === '5') ? '#000' : '#fff',
                                fontSize: Math.max(8, Math.round(11 * scale)),
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

            {/* Lista tekstowa */}
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
export default function OneRepMax() {
    const [weight, setWeight] = useState(100);
    const [reps, setReps] = useState(5);
    const [pct, setPct] = useState(80);
    const [roundPlates, setRoundPlates] = useState(false);
    const [barbellKg, setBarbellKg] = useState(20);

    /* ── Obliczenia 1RM ── */
    const results = useMemo(() => {
        if (!(weight > 0) || !(reps >= 1 && reps <= 20)) return null;

        const perKg = {
            epley: epley(weight, reps),
            brzycki: brzycki(weight, reps),
            oconner: oconner(weight, reps),
            lander: lander(weight, reps),
            lombardi: lombardi(weight, reps),
            wathan: wathan(weight, reps),
        };

        const vals = Object.values(perKg).filter(Number.isFinite);
        const avgKg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
        const fmt = (kg) => round2(roundPlates ? roundToPlate(kg) : kg);

        return {
            perFormula: Object.fromEntries(
                Object.entries(perKg).map(([k, v]) => [k, Number.isFinite(v) ? fmt(v) : NaN]),
            ),
            average: Number.isFinite(avgKg) ? fmt(avgKg) : NaN,
        };
    }, [weight, reps, roundPlates]);

    /* ── Tabela %1RM ── */
    const percentRows = useMemo(() => {
        if (!results || !Number.isFinite(results.average)) return [];
        return PCT_ROWS.map((p) => {
            const raw = results.average * (p / 100);
            const w = round2(roundPlates ? roundToPlate(raw) : raw);
            return { p, w, reps: estimateRepsAtWeight(results.average, w) };
        });
    }, [results, roundPlates]);

    /* ── Ciężar dla wybranego %1RM ── */
    const sliderWeight = useMemo(() => {
        if (!results || !Number.isFinite(results.average)) return NaN;
        const raw = results.average * (pct / 100);
        return round2(roundPlates ? roundToPlate(raw) : raw);
    }, [results, pct, roundPlates]);

    const highlightPct = activeRowPct(pct);
    const isWeightInvalid = !(weight > 0);
    const isRepsInvalid = !(reps >= 1 && reps <= 20);

    /* Wspólny JSX przełącznika – różne aria-label dla dwóch instancji */
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

    return (
        <div className={styles.wrapper}>
            <h3 style={{ marginTop: 0 }}>Kalkulator 1RM (One‑Rep Max)</h3>

            {/* ── Ciężar ── */}
            <div style={{ marginBottom: 14 }}>
                <label htmlFor="orm-weight" className={styles.label}>
                    Ciężar: <span>{weight} kg</span>
                </label>
                <div className={styles.row}>
                    <input
                        id="orm-weight"
                        className={styles.range}
                        type="range"
                        min={1}
                        max={300}
                        step={0.5}
                        value={weight}
                        style={fillStyle(weight, 1, 300)}
                        aria-valuemin={1}
                        aria-valuemax={300}
                        aria-valuenow={weight}
                        aria-valuetext={`${weight} kg`}
                        onChange={(e) => setWeight(Number(e.target.value))}
                    />
                    <div className={styles.inputSuffix}>
                        <NumericInput
                            value={weight}
                            min={1}
                            max={300}
                            step={0.5}
                            ariaLabel="Ciężar (kg)"
                            className={styles.number}
                            onCommit={setWeight}
                        />
                        <span className={styles.suffix}>kg</span>
                    </div>
                </div>
                {isWeightInvalid && (
                    <div style={{ color: 'var(--ifm-color-danger)' }}>Podaj dodatni ciężar.</div>
                )}
            </div>

            {/* ── Powtórzenia ── */}
            <div style={{ marginBottom: 14 }}>
                <label htmlFor="orm-reps" className={styles.label}>
                    Powtórzenia: <span>{reps}</span>
                </label>
                <div className={styles.row}>
                    <input
                        id="orm-reps"
                        className={styles.range}
                        type="range"
                        min={1}
                        max={20}
                        step={1}
                        value={reps}
                        style={fillStyle(reps, 1, 20)}
                        aria-valuemin={1}
                        aria-valuemax={20}
                        aria-valuenow={reps}
                        aria-valuetext={`${reps} powtórzeń`}
                        onChange={(e) => setReps(Number(e.target.value))}
                    />
                    <NumericInput
                        value={reps}
                        min={1}
                        max={20}
                        step={1}
                        ariaLabel="Powtórzenia"
                        className={styles.number}
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
                    {/* ── Średnia + przełącznik w jednym obramowaniu ── */}
                    <dl className={styles.highlight}>
                        <dt className={styles.highlightLabel}>Średnia (z kilku formuł)</dt>
                        <dd className={styles.highlightValue}>
                            {Number.isFinite(results.average) ? `${results.average} kg` : '—'}
                        </dd>
                        <RoundSwitch ariaLabel="Zaokrąglij wyniki do talerzy (2,5 kg)" />
                    </dl>

                    {/* ── Karty formuł ── */}
                    <div className={styles.formulaGrid}>
                        {Object.entries(results.perFormula).map(([key, val]) => (
                            <dl key={key} className={styles.card}>
                                <div>
                                    <dt>{FORMULA_LABEL[key]}</dt>
                                    <dd>{Number.isFinite(val) ? `${val} kg` : '—'}</dd>
                                </div>
                            </dl>
                        ))}
                    </div>

                    <p className={styles.formulaSource}>
                        Źródło formuł:{' '}
                        <a href={FORMULA_WIKI} target="_blank" rel="noopener noreferrer">
                            One-repetition maximum – Wikipedia ↗
                        </a>
                    </p>

                    <hr style={{ margin: '16px 0' }} />

                    {/* ── h3 nad suwakiem ── */}
                    <h3 style={{ marginTop: 0, marginBottom: 12 }}>Ile chcesz teraz podnieść?</h3>

                    {/* ── Suwak %1RM ── */}
                    <div className={styles.pctSection}>
                        <label htmlFor="orm-pct" className={styles.label}>
                            Wybrany poziom: <strong>{pct}% 1RM</strong>
                        </label>
                        <div className={styles.row}>
                            <input
                                id="orm-pct"
                                className={styles.range}
                                type="range"
                                min={PCT_MIN}
                                max={PCT_MAX}
                                step={1}
                                value={pct}
                                style={fillStyle(pct, PCT_MIN, PCT_MAX)}
                                aria-valuemin={PCT_MIN}
                                aria-valuemax={PCT_MAX}
                                aria-valuenow={pct}
                                aria-valuetext={`${pct}%`}
                                onChange={(e) => setPct(Number(e.target.value))}
                            />
                            <NumericInput
                                value={pct}
                                min={PCT_MIN}
                                max={PCT_MAX}
                                step={1}
                                ariaLabel="Procent 1RM"
                                className={styles.number}
                                onCommit={(v) => setPct(Math.round(v))}
                            />
                        </div>
                        <p className={styles.pctHint}>
                            Porada: 60–80% 1RM zwykle na objętość; 85–95% 1RM pod maksymalną siłę.
                        </p>
                    </div>

                    {/* ── Wybrany ciężar + przełącznik w jednym obramowaniu ── */}
                    <dl className={`${styles.highlight} ${styles.highlightSelected}`} style={{ marginBottom: 16 }}>
                        <dt className={styles.highlightLabel}>Ciężar dla {pct}% 1RM</dt>
                        <dd className={styles.highlightValue}>
                            {Number.isFinite(sliderWeight) ? `${sliderWeight} kg` : '—'}
                        </dd>
                        <RoundSwitch ariaLabel="Zaokrąglij wybrany ciężar do talerzy (2,5 kg)" />
                    </dl>

                    {/* ── Tabela + wizualizacja talerzy ── */}
                    {percentRows.length > 0 && (
                        <div className={styles.tableAndViz}>
                            {/* Tabela */}
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

                            {/* Wizualizacja talerzy */}
                            {Number.isFinite(sliderWeight) && (
                                <PlateViz
                                    targetKg={sliderWeight}
                                    barbellKg={barbellKg}
                                    onBarbellChange={setBarbellKg}
                                    // roundPlates={roundPlates} // aktualnie nieużywane w PlateViz
                                />
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
``