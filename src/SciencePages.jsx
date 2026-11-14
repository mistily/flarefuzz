import React, { useMemo, useState } from "react";

function dataKind(experiment) {
  if (experiment?.dataType === "measured") return { label: "MEASURED DATA", className: "measured" };
  if (experiment?.dataType === "prediction") return { label: "MODEL OUTPUT", className: "predicted" };
  if (experiment?.dataType === "illustrative") return { label: "ILLUSTRATIVE ONLY", className: "illustrative" };
  return { label: "SOURCE NOT CLASSIFIED", className: "unknown" };
}

function measurementsFor(experiment) {
  const measurements = experiment?.measurements;
  return measurements && Array.isArray(measurements.timeS) ? measurements : null;
}

function toMillimeters(value) {
  return Number.isFinite(value) ? value * 1000 : null;
}

function formatMeters(value) {
  return Number.isFinite(value) ? value.toExponential(3) : "—";
}

function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="science-page-header">
      <div>
        <div className="eyebrow"><span className="eyebrow-line" /> {eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="science-header-actions">{children}</div>}
    </div>
  );
}

function DataBadge({ experiment }) {
  const kind = dataKind(experiment);
  return <span className={`data-kind ${kind.className}`}><i />{kind.label}</span>;
}

function PageFooter({ illustrative = false }) {
  return <footer className="page-footer"><span>FLARE FUZZ <b>×</b> FLAME IN FREEFALL</span><span>{illustrative ? "Illustrative series · model output · clear provenance" : "Source data · model output · clear provenance"}</span><span>Research interface / v0.1</span></footer>;
}

export function ExperimentPage({ experiments, selectedExperiment, onSelect, onOpenSimulation, onExport }) {
  const [query, setQuery] = useState("");
  const [fuel, setFuel] = useState("All fuels");
  const [oxidizer, setOxidizer] = useState("All gas compositions");
  const [pressure, setPressure] = useState("All pressures");
  const [series, setSeries] = useState("All measurement series");
  const fuels = useMemo(() => ["All fuels", ...new Set(experiments.map((item) => item.fuel).filter(Boolean))], [experiments]);
  const oxidizers = useMemo(() => ["All gas compositions", ...new Set(experiments.map((item) => item.oxidizer).filter(Boolean))], [experiments]);
  const pressures = useMemo(() => ["All pressures", ...new Set(experiments.map((item) => item.pressureKPa).filter(Number.isFinite).map((value) => `${value} kPa`))], [experiments]);
  const measurementSeries = ["All measurement series", "Droplet diameter", "Flame diameter", "Optical signal", "Model prediction"];
  const filtered = experiments.filter((item) => (
    (!query || `${item.title} ${item.id} ${item.sourceName || ""}`.toLowerCase().includes(query.toLowerCase()))
    && (fuel === "All fuels" || item.fuel === fuel)
    && (oxidizer === "All gas compositions" || item.oxidizer === oxidizer)
    && (pressure === "All pressures" || `${item.pressureKPa} kPa` === pressure)
    && (series === "All measurement series"
      || (series === "Droplet diameter" && item.measurements?.dropletDiameterM?.length)
      || (series === "Flame diameter" && item.measurements?.flameDiameterM?.length)
      || (series === "Optical signal" && item.measurements?.radianceAU?.length)
      || (series === "Model prediction" && item.predictions?.flameDiameterM?.length))
  ));
  const measurements = measurementsFor(selectedExperiment);
  const illustrative = selectedExperiment?.dataType === "illustrative";

  return (
    <>
      <PageHeader eyebrow="EXPERIMENT DATA / PROVENANCE FIRST" title="Experiment explorer" description="Browse source records, inspect normalized measurements, and keep every series tied to its provenance.">
        <span className="result-count">{experiments.length} SERIES</span>
      </PageHeader>
      <section className="panel experiment-explorer">
        <div className="explorer-toolbar">
          <label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, ID, or source" /></label>
          <select aria-label="Filter by fuel" value={fuel} onChange={(event) => setFuel(event.target.value)}>{fuels.map((item) => <option key={item}>{item}</option>)}</select>
          <select aria-label="Filter by gas composition" value={oxidizer} onChange={(event) => setOxidizer(event.target.value)}>{oxidizers.map((item) => <option key={item}>{item}</option>)}</select>
          <select aria-label="Filter by pressure" value={pressure} onChange={(event) => setPressure(event.target.value)}>{pressures.map((item) => <option key={item}>{item}</option>)}</select>
          <select aria-label="Filter by measurement series" value={series} onChange={(event) => setSeries(event.target.value)}>{measurementSeries.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        {filtered.length ? (
          <div className="experiment-card-grid">
            {filtered.map((experiment) => (
              <article className={`experiment-card ${selectedExperiment?.id === experiment.id ? "chosen" : ""}`} key={experiment.id}>
                <div className="experiment-card-top"><span className="experiment-id">{experiment.id}</span><DataBadge experiment={experiment} /></div>
                <h2>{experiment.title}</h2>
                <p className="experiment-source">{experiment.sourceName || experiment.platform || "Source details not provided"}</p>
                <div className="experiment-meta">
                  <span><small>FUEL</small><b>{experiment.fuel || "—"}</b></span>
                  <span><small>GAS</small><b>{experiment.oxidizer || "—"}</b></span>
                  <span><small>PRESSURE</small><b>{Number.isFinite(experiment.pressureKPa) ? `${experiment.pressureKPa} kPa` : "—"}</b></span>
                </div>
                <div className="experiment-card-actions">
                  <button className="subtle-button" onClick={() => onSelect(experiment.id)}>{selectedExperiment?.id === experiment.id ? "Selected" : "Inspect data"}</button>
                  <button className="text-button" onClick={() => onOpenSimulation(experiment.id)}>Open simulation →</button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="page-empty"><span>⌕</span><strong>No experiment series found</strong><p>Connect an experiment record in Live mode or switch to Showoff to preview the interface.</p></div>}
      </section>

      <section className="panel normalized-panel">
        <div className="panel-heading science-panel-heading">
          <div><div className="eyebrow">{illustrative ? "ILLUSTRATIVE SERIES / SI UNITS" : "NORMALIZED MEASUREMENTS"}</div><h2>{selectedExperiment?.title || "Select an experiment"}</h2><p>{illustrative ? "Synthetic demonstration values in SI units; these are not NASA measurements." : "Values are shown in SI units as supplied or normalized by the API."}</p></div>
          <div className="science-heading-tools">{selectedExperiment && <DataBadge experiment={selectedExperiment} />}{measurements?.timeS?.length > 0 && <button className="subtle-button" onClick={() => onExport(selectedExperiment)}>Export CSV ↓</button>}</div>
        </div>
        {measurements?.timeS?.length ? (
          <>
            <div className="provenance-strip"><span>Source: <b>{selectedExperiment.sourceName || "Not provided"}</b></span><span>Fuel: <b>{selectedExperiment.fuel || "—"}</b></span><span>Pressure: <b>{Number.isFinite(selectedExperiment.pressureKPa) ? `${selectedExperiment.pressureKPa} kPa` : "—"}</b></span></div>
            <div className="science-table-scroll"><table className="science-table">
              <thead><tr><th>TIME <small>s</small></th><th>DROPLET DIAMETER <small>m</small></th><th>FLAME DIAMETER <small>m</small></th><th>OPTICAL SIGNAL <small>a.u.</small></th><th>DATA KIND</th></tr></thead>
              <tbody>{measurements.timeS.map((time, index) => <tr key={`${selectedExperiment.id}-${time}-${index}`}><td>{time}</td><td>{formatMeters(measurements.dropletDiameterM?.[index])}</td><td>{formatMeters(measurements.flameDiameterM?.[index])}</td><td>{Number.isFinite(measurements.radianceAU?.[index]) ? measurements.radianceAU[index].toFixed(3) : "—"}</td><td><DataBadge experiment={selectedExperiment} /></td></tr>)}</tbody>
            </table></div>
            <div className="method-note">{illustrative ? "The optical signal is synthetic and in arbitrary units. It is not a measurement or temperature." : "Optical signal is reported in arbitrary units and must not be interpreted as temperature unless a validated calibration is supplied."}</div>
          </>
        ) : <div className="empty-note">No normalized measurement series is available for this record.</div>}
      </section>
      <PageFooter illustrative={illustrative} />
    </>
  );
}

function DiameterChart({ experiment, playhead = 0, full = false }) {
  const measurements = measurementsFor(experiment);
  const predictions = experiment?.predictions;
  const illustrative = experiment?.dataType === "illustrative";
  const seriesPrefix = illustrative ? "Illustrative" : experiment?.dataType === "measured" ? "Measured" : "Source";
  if (!measurements?.timeS?.length) {
    return <div className="chart-empty"><span>∿</span><strong>No time-series data returned</strong><p>Live mode needs normalized measurement arrays from the API.</p></div>;
  }

  const times = measurements.timeS;
  const minTime = times[0] || 0;
  const maxTime = times[times.length - 1] ?? minTime;
  const timeRange = Math.max(maxTime - minTime, 1);
  const values = [
    ...(measurements.dropletDiameterM || []),
    ...(measurements.flameDiameterM || []),
    ...(predictions?.flameDiameterM || []),
    ...(predictions?.upperFlameDiameterM || []),
  ].map(toMillimeters).filter(Number.isFinite);
  const maxMm = Math.max(1, ...values) * 1.15;
  const left = 54;
  const top = 18;
  const plotWidth = 540;
  const plotHeight = full ? 228 : 167;
  const x = (time) => left + ((time - minTime) / timeRange) * plotWidth;
  const y = (diameterM) => top + plotHeight - ((toMillimeters(diameterM) || 0) / maxMm) * plotHeight;
  const makePath = (seriesTimes, seriesValues) => {
    if (!Array.isArray(seriesValues)) return "";
    return seriesValues.map((value, index) => `${index === 0 ? "M" : "L"} ${x(seriesTimes?.[index] ?? times[index] ?? 0)} ${y(value)}`).join(" ");
  };
  const currentTime = times[Math.min(playhead, times.length - 1)] || 0;
  const band = predictions?.lowerFlameDiameterM && predictions?.upperFlameDiameterM
    ? [
      ...predictions.upperFlameDiameterM.map((value, index) => `${index === 0 ? "M" : "L"} ${x(predictions.timeS?.[index] ?? times[index] ?? 0)} ${y(value)}`),
      ...predictions.lowerFlameDiameterM.map((value, index, array) => `L ${x(predictions.timeS?.[index] ?? times[index] ?? 0)} ${y(value)}`).reverse(),
      "Z",
    ].join(" ")
    : "";
  const legends = [
    { label: `${seriesPrefix} droplet series`, color: "#47a5a6", show: Boolean(measurements.dropletDiameterM) },
    { label: `${seriesPrefix} flame series`, color: "#d9a04e", show: Boolean(measurements.flameDiameterM) },
    { label: illustrative ? "Illustrative model" : "Model prediction", color: "#177365", show: Boolean(predictions?.flameDiameterM), dashed: true },
  ].filter((item) => item.show);

  return (
    <div className={`chart-wrap ${full ? "chart-full" : ""}`}>
      <svg className="diameter-chart" viewBox={`0 0 620 ${top + plotHeight + 40}`} role="img" aria-label="Synchronized droplet and flame diameter time series">
        {[0, 1, 2, 3].map((tick) => {
          const value = maxMm * tick / 3;
          const yy = top + plotHeight - (tick / 3) * plotHeight;
          return <g key={tick}><line x1={left} y1={yy} x2={left + plotWidth} y2={yy} className="chart-grid-line" /><text x={left - 9} y={yy + 4} textAnchor="end" className="chart-axis-text">{value.toFixed(1)}</text></g>;
        })}
        <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} className="chart-axis-line" />
        <text x={left} y={top + plotHeight + 23} className="chart-axis-text">{minTime} s</text>
        <text x={left + plotWidth} y={top + plotHeight + 23} textAnchor="end" className="chart-axis-text">{maxTime} s</text>
        <text x="12" y="13" className="chart-axis-label">DIAMETER · mm</text>
        <text x={left + plotWidth / 2} y={top + plotHeight + 36} textAnchor="middle" className="chart-axis-label">TIME · seconds</text>
        {band && <path d={band} className="uncertainty-band" />}
        {measurements.dropletDiameterM && <path d={makePath(times, measurements.dropletDiameterM)} className="chart-series droplet-series" />}
        {measurements.flameDiameterM && <path d={makePath(times, measurements.flameDiameterM)} className="chart-series flame-series" />}
        {predictions?.flameDiameterM && <path d={makePath(predictions.timeS || times, predictions.flameDiameterM)} className="chart-series prediction-series" />}
        <line x1={x(currentTime)} y1={top} x2={x(currentTime)} y2={top + plotHeight} className="chart-cursor" />
        {measurements.flameDiameterM?.[playhead] !== undefined && <circle cx={x(currentTime)} cy={y(measurements.flameDiameterM[playhead])} r="4" className="cursor-point" />}
      </svg>
      <div className="chart-legend">{legends.map((legend) => <span key={legend.label}><i className={legend.dashed ? "dashed" : ""} style={{ "--legend-color": legend.color }} />{legend.label}</span>)}{band && <span><i className="band-legend" />{illustrative ? "Illustrative interval" : "Uncertainty interval"}</span>}</div>
    </div>
  );
}

function PlaybackControls({ times, playhead, playing, onPlay, onSeek }) {
  const timeCount = times.length;
  const maxIndex = Math.max(0, timeCount - 1);
  return (
    <div className="playback-bar">
      <button className="play-button" onClick={onPlay} disabled={timeCount < 2} aria-label={playing ? "Pause animation" : "Play animation"}>{playing ? "Ⅱ" : "▶"}</button>
      <span className="playback-label">{playing ? "PLAYING" : "FRAME"} <b>{timeCount ? String(playhead + 1).padStart(2, "0") : "00"} / {String(timeCount).padStart(2, "0")}</b></span>
      <input type="range" min="0" max={maxIndex} value={Math.min(playhead, maxIndex)} disabled={timeCount < 2} onChange={(event) => onSeek(Number(event.target.value))} aria-label="Select experiment time step" />
      <span className="playback-time">{timeCount ? `${times[Math.min(playhead, maxIndex)]} s` : "—"}</span>
    </div>
  );
}

function SimulationGraphic({ experiment, playhead }) {
  const measurements = measurementsFor(experiment);
  const index = Math.min(playhead, Math.max((measurements?.timeS?.length || 1) - 1, 0));
  const dropletMm = toMillimeters(measurements?.dropletDiameterM?.[index]) || 0;
  const flameMm = toMillimeters(measurements?.flameDiameterM?.[index]) || 0;
  const flameRadius = flameMm * 5.2;
  const dropletRadius = dropletMm * 5.2;
  const available = Boolean(measurements?.timeS?.length);
  return (
    <div className={`flame-stage ${available ? "" : "no-series"}`}>
      <div className="flame-stage-top"><span>2D GEOMETRY RENDER</span><span>{experiment ? dataKind(experiment).label : "NO SOURCE"}</span></div>
      <svg viewBox="0 0 380 265" role="img" aria-label="Schematic droplet and flame diameter visualization">
        <defs>
          <radialGradient id="flameGlow"><stop offset="0%" stopColor="#f7cf71" stopOpacity=".16" /><stop offset="72%" stopColor="#e9a34b" stopOpacity=".28" /><stop offset="100%" stopColor="#dc7548" stopOpacity=".06" /></radialGradient>
          <radialGradient id="dropletFill"><stop offset="0%" stopColor="#f7fff9" /><stop offset="75%" stopColor="#b5d9d3" /><stop offset="100%" stopColor="#65a8a2" /></radialGradient>
        </defs>
        <circle cx="190" cy="128" r="95" className="flame-grid-ring" />
        <circle cx="190" cy="128" r="64" className="flame-grid-ring" />
        {available && <circle cx="190" cy="128" r={flameRadius} fill="url(#flameGlow)" stroke="#efb054" strokeWidth="1.5" className="flame-envelope" />}
        {available && <circle cx="190" cy="128" r={dropletRadius} fill="url(#dropletFill)" stroke="#a9d8d1" strokeWidth="1.2" className="droplet-core" />}
        {!available && <text x="190" y="124" textAnchor="middle" className="flame-empty-text">Awaiting live series</text>}
        {!available && <text x="190" y="145" textAnchor="middle" className="flame-empty-sub">No values will be fabricated</text>}
        <text x="190" y="248" textAnchor="middle" className="flame-stage-caption">{available ? `t = ${measurements.timeS[index]} s  ·  diameters scaled for display` : "Schematic only"}</text>
      </svg>
      <div className="flame-stage-readouts">
        <span><i className="readout-dot droplet-dot" /> DROPLET <b>{available ? `${dropletMm.toFixed(2)} mm` : "—"}</b></span>
        <span><i className="readout-dot flame-dot" /> FLAME <b>{available ? `${flameMm.toFixed(2)} mm` : "—"}</b></span>
      </div>
    </div>
  );
}

export function SimulationPage({ experiments, selectedExperiment, onSelect, playhead, playing, onPlay, onSeek }) {
  const measurements = measurementsFor(selectedExperiment);
  const illustrative = selectedExperiment?.dataType === "illustrative";
  const measured = selectedExperiment?.dataType === "measured";
  return (
    <>
      <PageHeader eyebrow="PHYSICS VISUALIZATION / TRACEABLE INPUTS" title="Flame simulation" description={illustrative ? "Animate an explicitly synthetic diameter series and model trend; no NASA measurements are connected." : "Animate a diameter-based schematic in lockstep with source measurements and model output."}>
        <label className="experiment-select-label">ACTIVE SERIES
          <select value={selectedExperiment?.id || ""} onChange={(event) => onSelect(event.target.value)} disabled={!experiments.length}>
            {!experiments.length && <option value="">No live series</option>}
            {experiments.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
          </select>
        </label>
      </PageHeader>
      <div className="science-two-column">
        <section className="panel simulation-panel">
          <div className="science-panel-heading">
            <div><div className="eyebrow">FLAME GEOMETRY</div><h2>{selectedExperiment?.title || "No experiment selected"}</h2><p>Conceptual 2D cross-section scaled from diameter values.</p></div>
            <DataBadge experiment={selectedExperiment} />
          </div>
          <SimulationGraphic experiment={selectedExperiment} playhead={playhead} />
          <PlaybackControls times={measurements?.timeS || []} playhead={playhead} playing={playing} onPlay={onPlay} onSeek={onSeek} />
          <div className="visualization-caveat">{illustrative ? "This geometry visualizes a synthetic series, not NASA imagery, experimental data, or a temperature field." : "This geometry visualizes reported diameters, not a reconstructed flame image or temperature field."}</div>
        </section>
        <section className="panel chart-panel">
          <div className="science-panel-heading">
            <div><div className="eyebrow">SYNCHRONIZED TIME SERIES</div><h2>Diameter evolution</h2><p>{illustrative ? "Illustrative series and model trend share one time cursor." : measured ? "Measured series and prediction share one time cursor." : "Source series and model outputs share one time cursor."}</p></div>
          </div>
          <DiameterChart experiment={selectedExperiment} playhead={playhead} />
          <div className="chart-caveat">{illustrative ? "The series, trend, and interval are synthetic showoff values; no measured data or calibrated model is connected." : "Model prediction and uncertainty are separate from measured values."}</div>
        </section>
      </div>
      <div className="science-two-column simulation-lower">
        <section className="panel current-measurements">
          <div className="science-panel-heading"><div><div className="eyebrow">CURRENT FRAME</div><h2>{illustrative ? "Illustrative series values" : "Normalized measurements"}</h2><p>{illustrative ? "Synthetic SI-unit values at the selected time step." : "SI-unit values at the selected time step."}</p></div></div>
          <div className="frame-metrics">
            <div><span>TIME</span><b>{measurements?.timeS?.length ? `${measurements.timeS[playhead]} s` : "—"}</b></div>
            <div><span>DROPLET DIAMETER</span><b>{formatMeters(measurements?.dropletDiameterM?.[playhead])} <small>m</small></b></div>
            <div><span>FLAME DIAMETER</span><b>{formatMeters(measurements?.flameDiameterM?.[playhead])} <small>m</small></b></div>
            <div><span>OPTICAL SIGNAL</span><b>{Number.isFinite(measurements?.radianceAU?.[playhead]) ? measurements.radianceAU[playhead].toFixed(3) : "—"} <small>a.u.</small></b></div>
          </div>
        </section>
        <section className="panel experiment-context">
          <div className="science-panel-heading"><div><div className="eyebrow">SOURCE & CONDITIONS</div><h2>Experiment context</h2></div></div>
          <dl><div><dt>Data source</dt><dd>{selectedExperiment?.sourceName || "Not returned by API"}</dd></div><div><dt>Fuel</dt><dd>{selectedExperiment?.fuel || "—"}</dd></div><div><dt>Oxidizer</dt><dd>{selectedExperiment?.oxidizer || "—"}</dd></div><div><dt>Pressure</dt><dd>{Number.isFinite(selectedExperiment?.pressureKPa) ? `${selectedExperiment.pressureKPa} kPa` : "—"}</dd></div></dl>
        </section>
      </div>
      <PageFooter illustrative={illustrative} />
    </>
  );
}

export function PredictionsPage({ selectedExperiment, playhead, onExport }) {
  const prediction = selectedExperiment?.predictions;
  const illustrative = selectedExperiment?.dataType === "illustrative";
  const measured = selectedExperiment?.dataType === "measured";
  const warnings = selectedExperiment?.dataQualityWarnings || [];
  const errorMetrics = prediction?.errorMetrics || {};
  const hasPrediction = Boolean(prediction?.flameDiameterM?.length);
  return (
    <>
      <PageHeader eyebrow="MODEL OUTPUT / UNCERTAINTY AWARE" title="Predictions" description={illustrative ? "Review clearly labeled synthetic demo curves; no measured data or validated model is connected." : measured ? "Compare model trajectories with measured data without conflating the two." : "Compare source series and model outputs; source type follows the API metadata."}>
        {measurementsFor(selectedExperiment)?.timeS?.length > 0 && <button className="subtle-button" onClick={() => onExport(selectedExperiment)}>Export normalized CSV ↓</button>}
      </PageHeader>
      <section className="panel prediction-main">
        <div className="science-panel-heading">
          <div><div className="eyebrow">FLAME DIAMETER FORECAST</div><h2>{selectedExperiment?.title || "No experiment selected"}</h2><p>{illustrative ? "Illustrative trajectories and an uncalibrated band; no measured values." : measured ? "Measured values, model prediction, and interval where supplied." : "Source series, model prediction, and interval where supplied."}</p></div>
          <DataBadge experiment={selectedExperiment} />
        </div>
        <DiameterChart experiment={selectedExperiment} playhead={playhead} full />
        <div className="prediction-footnote"><span><i className="measured-dot" /> {illustrative ? "Illustrative series" : measured ? "Measured values" : "Source series"}</span><span><i className="predicted-dash" /> {illustrative ? "Illustrative model" : "Prediction"}</span><span><i className="uncertainty-swatch" /> {illustrative ? "Illustrative interval" : "Uncertainty interval"}</span><span>Cursor synchronized with simulation at frame {playhead + 1}</span></div>
      </section>
      <div className="science-two-column prediction-lower">
        <section className="panel model-card">
          <div className="science-panel-heading"><div><div className="eyebrow">MODEL CARD</div><h2>{selectedExperiment?.modelName || "Model details unavailable"}</h2><p>Prediction outputs are not observations.</p></div></div>
          <div className="model-stats">
            <div><span>MODEL STATUS</span><b>{hasPrediction ? (selectedExperiment?.dataType === "illustrative" ? "Illustrative" : "Returned by API") : "No model output"}</b></div>
            <div><span>INTERVAL</span><b>{prediction?.lowerFlameDiameterM && prediction?.upperFlameDiameterM ? "Provided" : "Not provided"}</b></div>
            <div><span>RMSE</span><b>{Number.isFinite(errorMetrics.rmseM) ? `${errorMetrics.rmseM} m` : "Not reported"}</b></div>
            <div><span>R²</span><b>{Number.isFinite(errorMetrics.rSquared) ? errorMetrics.rSquared.toFixed(3) : "Not reported"}</b></div>
          </div>
          <p className="model-limitations">{selectedExperiment?.modelLimitations || "Model assumptions and validation metrics have not been returned by the API."}</p>
        </section>
        <section className="panel quality-card">
          <div className="science-panel-heading"><div><div className="eyebrow">VALIDATION & CONFIDENCE</div><h2>Data quality notes</h2><p>Warnings travel with the selected series.</p></div></div>
          {warnings.length ? <ul className="quality-list">{warnings.map((warning) => <li key={warning}><span>!</span>{warning}</li>)}</ul> : <div className="quality-clear"><span>✓</span>No source quality warnings returned.</div>}
          <div className="quality-source"><DataBadge experiment={selectedExperiment} /><span>Provenance: {selectedExperiment?.provenance || selectedExperiment?.sourceName || "Not provided"}</span></div>
        </section>
      </div>
      <section className="panel methodology-panel">
        <div className="science-panel-heading"><div><div className="eyebrow">METHOD & LIMITATIONS</div><h2>Read the plot responsibly</h2><p>Scientific outputs retain their source type and assumptions.</p></div></div>
        <div className="methodology-grid">
          <div><span>01 / MEASUREMENTS</span><p>Measured values are shown only when supplied by the source API. Missing measurements remain empty rather than being synthesized.</p></div>
          <div><span>02 / PREDICTIONS</span><p>Prediction trajectories and uncertainty intervals are separate model outputs. Error metrics appear only when provided.</p></div>
          <div><span>03 / VISUALIZATION</span><p>Optical intensity in arbitrary units is not temperature. Diameter geometry is a schematic rendering, not experimental imagery.</p></div>
        </div>
      </section>
      <PageFooter illustrative={illustrative} />
    </>
  );
}

export function exportExperimentCsv(experiment) {
  const measurements = measurementsFor(experiment);
  if (!measurements?.timeS?.length) return;
  const prediction = experiment.predictions || {};
  const header = ["experiment_id", "source_name", "data_type", "provenance", "time_s", "droplet_diameter_m", "flame_diameter_m", "radiance_au", "predicted_flame_diameter_m", "lower_flame_diameter_m", "upper_flame_diameter_m"];
  const rows = measurements.timeS.map((time, index) => [
    experiment.id || "",
    experiment.sourceName || "",
    experiment.dataType || "unknown",
    experiment.provenance || "",
    time,
    measurements.dropletDiameterM?.[index] ?? "",
    measurements.flameDiameterM?.[index] ?? "",
    measurements.radianceAU?.[index] ?? "",
    prediction.flameDiameterM?.[index] ?? "",
    prediction.lowerFlameDiameterM?.[index] ?? "",
    prediction.upperFlameDiameterM?.[index] ?? "",
  ]);
  const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${String(experiment.id || "experiment").replace(/[^a-z0-9_-]/gi, "_")}-normalized.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
