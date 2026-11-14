import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { emptyDashboard, fetchDashboard } from "./api.js";
import { demoDashboard } from "./data.js";
import { ExperimentPage, exportExperimentCsv, PredictionsPage, SimulationPage } from "./SciencePages.jsx";

const navItems = [
  ["overview", "Overview", "◫"],
  ["experiments", "Experiments", "⌕"],
  ["simulation", "Simulation", "◉"],
  ["predictions", "Predictions", "∿"],
];

function Icon({ children, className = "" }) {
  return <span className={`icon ${className}`} aria-hidden="true">{children}</span>;
}

function MetricCard({ label, value, note, icon, accent }) {
  return (
    <article className={`metric-card ${accent}`}>
      <div className="metric-top"><span>{label}</span><Icon>{icon}</Icon></div>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
    </article>
  );
}

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [dataMode, setDataMode] = useState("live");
  const [source, setSource] = useState("unconfigured");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const requestNumber = useRef(0);
  const [activeNav, setActiveNav] = useState("overview");
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [normalizationOpen, setNormalizationOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("All domains");
  const [selectedExperimentId, setSelectedExperimentId] = useState("");
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);

  const loadData = useCallback(async () => {
    const request = ++requestNumber.current;
    setLoading(true);
    setError("");
    try {
      const result = await fetchDashboard();
      if (request !== requestNumber.current) return;
      setDashboard(result.data);
      setSource(result.source);
    } catch (loadError) {
      if (request !== requestNumber.current) return;
      setError(loadError.message || "Unable to load dashboard data.");
      setDashboard((current) => current || emptyDashboard);
      setSource("error");
    } finally {
      if (request === requestNumber.current) setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function changeDataMode(mode) {
    if (mode === dataMode) return;
    setDataMode(mode);
    setError("");
    if (mode === "showoff") {
      requestNumber.current += 1;
      setDashboard(demoDashboard);
      setSource("showoff");
      setLoading(false);
      return;
    }
    setDashboard(null);
    setSource("unconfigured");
    loadData();
  }

  const investigations = dashboard?.investigations || [];
  const experiments = dashboard?.experiments || investigations;
  const selectedExperiment = experiments.find((item) => item.id === selectedExperimentId) || experiments[0] || null;
  const timeCount = selectedExperiment?.measurements?.timeS?.length || 0;
  const domains = useMemo(() => ["All domains", ...new Set(investigations.map((item) => item.domain))], [investigations]);
  const filteredInvestigations = useMemo(() => investigations.filter((item) => (
    (domain === "All domains" || item.domain === domain)
    && `${item.title} ${item.id} ${item.platform} ${item.domain}`.toLowerCase().includes(query.toLowerCase())
  )), [investigations, domain, query]);
  const sourceLabel = source === "api" ? "FASTAPI LIVE"
    : source === "unconfigured" ? "API NOT CONNECTED"
      : source === "showoff" ? "SHOWOFF DATA"
        : source === "error" ? "API ERROR" : "LIVE DATA";
  const sourceClass = source === "api" ? "connected"
    : source === "showoff" ? "demo"
      : source === "error" ? "error" : "offline";
  const activePageTitle = navItems.find(([id]) => id === activeNav)?.[1] || "Overview";

  function navigateTo(section) {
    setActiveNav(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectExperiment(id) {
    setSelectedExperimentId(id);
    setPlayhead(0);
    setPlaying(false);
  }

  function openSimulation(id) {
    selectExperiment(id);
    navigateTo("simulation");
  }

  function togglePlayback() {
    if (!playing && timeCount > 1 && playhead >= timeCount - 1) setPlayhead(0);
    setPlaying((current) => !current);
  }

  useEffect(() => {
    setPlayhead(0);
    setPlaying(false);
  }, [selectedExperiment?.id, timeCount]);

  useEffect(() => {
    if (!playing || timeCount < 2) return undefined;
    const timer = window.setInterval(() => {
      setPlayhead((current) => current >= timeCount - 1 ? 0 : current + 1);
    }, 650);
    return () => window.clearInterval(timer);
  }, [playing, timeCount]);

  if (loading && !dashboard) {
    return <div className="loading-screen"><span className="loading-mark">FF</span><p>Preparing research intelligence…</p></div>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">FF<span>✳</span></div>
          <div><strong>FLARE FUZZ</strong><small>RESEARCH INTELLIGENCE</small></div>
        </div>
        <div className="side-label">MISSION CONTROL</div>
        <nav className="nav-list" aria-label="Dashboard sections">
          {navItems.map(([id, label, icon]) => (
            <button key={id} className={`nav-item ${activeNav === id ? "selected" : ""}`} onClick={() => navigateTo(id)}>
              <Icon>{icon}</Icon><span>{label}</span>{activeNav === id && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="safety-note"><span className="pulse-dot" /> SAFETY-FIRST RESEARCH</div>
          <div className="scope-note">PSI DATA · NO ROCKET PROPULSION</div>
          <div className="sidebar-footer">FLAME IN FREEFALL <span>v0.1</span></div>
        </div>
      </aside>

      <main className="main-area" id="overview">
        <header className="topbar">
          <div className="breadcrumbs"><span>FLAME IN FREEFALL</span><b>›</b><strong>{activePageTitle}</strong></div>
          <div className="topbar-actions">
            <span className={`source-badge ${sourceClass}`}><i />{sourceLabel}</span>
            <div className="mode-switch" role="group" aria-label="Dashboard data mode">
              <button className={dataMode === "live" ? "active" : ""} aria-pressed={dataMode === "live"} onClick={() => changeDataMode("live")}>Live</button>
              <button className={dataMode === "showoff" ? "active" : ""} aria-pressed={dataMode === "showoff"} onClick={() => changeDataMode("showoff")}>Showoff</button>
            </div>
            <button className="icon-button refresh-button" onClick={loadData} disabled={loading} title="Refresh dashboard data" aria-label="Refresh dashboard data">↻</button>
            <span className="timezone">UTC</span>
          </div>
        </header>

        <div className="content">
          {error && <div className="error-banner" role="alert"><div><strong>Could not load live dashboard data</strong><span>{error}</span></div><button onClick={loadData}>Retry</button></div>}
          {dataMode === "showoff" && <div className="demo-banner"><span>SHOWOFF MODE</span> These illustrative records are sample UI data, not verified NASA findings.</div>}
          {dataMode === "live" && source === "unconfigured" && !loading && <div className="demo-banner live-empty"><span>LIVE DATA</span> The FastAPI URL is not configured yet. This view will reflect API results when connected.</div>}

          {activeNav === "overview" && <>
          <section className="intro">
            <div className="intro-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> COMBUSTION SCIENCE / DECISION SUPPORT</div>
              <h1>Make the next giant leap<br /><em>a safer one.</em></h1>
              <p>Turn microgravity combustion research into clear, traceable evidence for fire safety in crewed exploration.</p>
            </div>
            <button className="primary-button" onClick={() => document.getElementById("pipeline")?.scrollIntoView({ behavior: "smooth", block: "start" })}><Icon>⇄</Icon> Explore ingestion pipeline <span>→</span></button>
            <div className="orbit-art" aria-hidden="true">
              <div className="orbit orbit-one" /><div className="orbit orbit-two" />
              <div className="orbit-core"><span>ISS</span><i>✳</i></div>
              <span className="orbit-point point-one" /><span className="orbit-point point-two" />
              <small>SAFETY IN MICROGRAVITY</small>
            </div>
          </section>

          <section className="metrics-grid" aria-label="Research portfolio metrics">
            <MetricCard label="INVESTIGATIONS" value={dashboard?.metrics?.investigations ?? investigations.length} note="Across PSI research" icon="⌕" accent="mint" />
            <MetricCard label="PARSED DOCUMENTS" value={dashboard?.metrics?.parsedDocuments ?? dashboard?.pipeline?.documents?.length ?? 0} note="Source-linked evidence" icon="▤" accent="gold" />
            <MetricCard label="HIGH RELEVANCE" value={dashboard?.metrics?.highRelevance ?? investigations.filter((item) => item.relevance >= 80).length} note="Habitat safety priorities" icon="↗" accent="mint" />
            <MetricCard label="MODELED SIGNALS" value={dashboard?.metrics?.modeledSignals ?? 0} note="Ready for prediction" icon="⌁" accent="gold" />
          </section>

          <section className="pipeline-card panel" id="pipeline">
            <div className="panel-heading pipeline-heading">
              <div><div className="eyebrow">TRANSPARENT BY DESIGN</div><h2>Research ingestion pipeline</h2><p>From source record to actionable fire-safety insight.</p></div>
              <div className="run-meta"><span className="live-dot" /> LAST RUN <b>{dashboard?.pipeline?.lastRun || "—"}</b><small>{dashboard?.pipeline?.runId || ""}</small></div>
            </div>
            <div className="pipeline-flow">
              {(dashboard?.pipeline?.stages || []).map((stage, index) => (
                <div className="stage-wrap" key={stage.name}>
                  <article className={`stage ${stage.tone || "green"}`}>
                    <div className="stage-number">0{index + 1}</div>
                    <div className="stage-symbol">{["⌕", "▤", "⟲", "✳"][index % 4]}</div>
                    <div className="stage-name">{stage.name}</div>
                    <div className="stage-detail">{stage.detail}</div>
                    <div className={`stage-result ${stage.state === "Complete" ? "complete" : "waiting"}`}><span>{stage.state === "Complete" ? "✓" : "○"}</span> {stage.state}</div>
                    <div className="stage-count">{stage.count}</div>
                  </article>
                  {index < dashboard.pipeline.stages.length - 1 && <div className="flow-link"><span /><i>›</i></div>}
                </div>
              ))}
            </div>
            <div className="pipeline-footer">
              <div className="pipeline-legend"><span><i className="legend-info" /> Source data</span><span><i className="legend-process" /> Processing</span><span><i className="legend-output" /> Verified output</span></div>
              <div className="pipeline-controls">
                <button className="text-button" onClick={() => setNormalizationOpen(!normalizationOpen)}>{normalizationOpen ? "Hide" : "View"} normalization <span>{normalizationOpen ? "−" : "+"}</span></button>
                <button className="text-button" onClick={() => setDocumentsOpen(!documentsOpen)}>{documentsOpen ? "Hide" : "Show"} parsed documents <span>{documentsOpen ? "−" : "+"}</span></button>
              </div>
            </div>
            {normalizationOpen && <div className="detail-drawer normalization-drawer">
              <div className="drawer-title"><strong>Normalization applied</strong><span>Applied before ranking and batch synthesis</span></div>
              <div className="normalization-grid">
                {(dashboard?.pipeline?.normalizations || []).map((item) => <div className="normalization-item" key={item.label}><span>{item.label}</span><b>{item.value}</b><i>✓</i></div>)}
              </div>
            </div>}
            {documentsOpen && <div className="detail-drawer documents-drawer">
              <div className="drawer-title"><strong>Parsed documents</strong><span>{(dashboard?.pipeline?.documents || []).length} items from run {dashboard?.pipeline?.runId || ""}</span></div>
              <div className="document-list">
                {(dashboard?.pipeline?.documents || []).map((document) => <div className="document-row" key={document.name}><div className="file-icon">PDF</div><div className="document-name"><strong>{document.name}</strong><span>{document.type} · {document.size}</span></div><span className="parsed-status"><i />{document.status}</span><button aria-label={`Open ${document.name}`} className="open-doc">↗</button></div>)}
                {!dashboard?.pipeline?.documents?.length && <div className="empty-note">No parsed documents were returned by the API.</div>}
              </div>
            </div>}
          </section>

          <div className="content-columns">
            <section className="panel investigations-panel" id="investigations">
              <div className="panel-heading compact-heading">
                <div><div className="eyebrow">RANKED FOR CREW SAFETY</div><h2>Priority investigations</h2><p>Research most relevant to habitable environments.</p></div>
                <button className="view-all" onClick={() => navigateTo("experiments")}>Explore <span>→</span></button>
              </div>
              <div className="table-tools">
                <label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search investigations" /></label>
                <select aria-label="Filter by research domain" value={domain} onChange={(event) => setDomain(event.target.value)}>{domains.map((item) => <option key={item}>{item}</option>)}</select>
              </div>
              <div className="investigation-list">
                {filteredInvestigations.map((item, index) => <article className="investigation-row" key={item.id}>
                  <div className="rank">0{index + 1}</div>
                  <div className="inv-main"><div className="inv-title-line"><h3>{item.title}</h3><span>{item.id}</span></div><p>{item.platform} <i>·</i> {item.domain}</p></div>
                  <div className="relevance"><div><b>{item.relevance}</b><small>/100</small></div><span>RELEVANCE</span><i><b style={{ width: `${item.relevance}%` }} /></i></div>
                  <span className={`readiness ${item.readiness.toLowerCase().replaceAll(" ", "-")}`}>{item.readiness}</span>
                  <button className="row-expand" aria-label={`View details for ${item.title}`} onClick={(event) => event.currentTarget.closest(".investigation-row").classList.toggle("expanded")}>⌄</button>
                  <div className="investigation-detail"><p>{item.summary}</p><div>{(item.signals || []).map((signal) => <span key={signal}>{signal}</span>)}</div></div>
                </article>)}
                {filteredInvestigations.length === 0 && <div className="empty-note">No investigations match those filters.</div>}
              </div>
              <div className="panel-footnote"><span><i className="pulse-dot" /> RELEVANCE INDEX</span> Weighted for mission context, evidence strength & model utility</div>
            </section>

            <div className="right-column">
              <section className="panel batch-panel" id="batches">
                <div className="panel-heading compact-heading">
                  <div><div className="eyebrow">EVIDENCE → IMPACT</div><h2>Influenced result batches</h2><p>Outputs shaped by normalized research.</p></div>
                  <button className="more-button" aria-label="More batch options">···</button>
                </div>
                <div className="batch-list">
                  {(dashboard?.batches || []).map((batch) => <article className="batch-row" key={batch.id}>
                    <div className={`batch-marker ${batch.color || "teal"}`}><span>↗</span></div>
                    <div className="batch-content"><div className="batch-name-line"><h3>{batch.name}</h3><span className={`batch-status ${batch.status.toLowerCase().replaceAll(" ", "-")}`}>{batch.status}</span></div>
                      <p>{batch.result}</p>
                      <div className="batch-meta"><span>{batch.id}</span><span>{batch.documents} documents</span><span>{batch.updated}</span></div>
                      <div className="tag-row">{(batch.targets || []).map((target) => <span key={target}>{target}</span>)}</div>
                    </div>
                  </article>)}
                  {!dashboard?.batches?.length && <div className="empty-note">No result batches are available yet.</div>}
                </div>
              </section>
              <section className="boundary-card">
                <div className="boundary-icon">!</div><div><strong>Research boundary</strong><p>Rocket engines and propellants are out of scope. Their high-velocity combustion is effectively independent of gravity.</p></div>
              </section>
            </div>
          </div>

          <section className="earth-section panel" id="earth">
            <div className="earth-heading">
              <div><div className="eyebrow">BEYOND THE ORBIT</div><h2>Insights with a life on Earth, too.</h2><p>Space-tested ideas can inform protection for communities and responders here at home.</p></div>
              <div className="earth-stamp"><span>MISSION</span><b>EARTH</b><i>✳</i></div>
            </div>
            <div className="earth-cards">
              {(dashboard?.earthApplications || []).map((item, index) => <article className="earth-card" key={item.title}><div className={`earth-card-icon icon-${index}`}>{item.icon}</div><div><span>APPLICATION 0{index + 1}</span><h3>{item.title}</h3><p>{item.text}</p></div><span className="earth-arrow">↗</span></article>)}
            </div>
            <div className="earth-foot"><span>TRANSFER POTENTIAL IS NOT A DEPLOYMENT CLAIM.</span><span>Evidence mapped to terrestrial use cases <b>·</b> review required</span></div>
          </section>
          <footer className="page-footer"><span>FLARE FUZZ <b>×</b> FLAME IN FREEFALL</span><span>Evidence first. People always.</span><a href="#overview" onClick={() => setActiveNav("overview")}>Back to top ↑</a></footer>
          </>}
          {activeNav === "experiments" && <ExperimentPage
            experiments={experiments}
            selectedExperiment={selectedExperiment}
            onSelect={selectExperiment}
            onOpenSimulation={openSimulation}
            onExport={exportExperimentCsv}
          />}
          {activeNav === "simulation" && <SimulationPage
            experiments={experiments}
            selectedExperiment={selectedExperiment}
            onSelect={selectExperiment}
            playhead={playhead}
            playing={playing}
            onPlay={togglePlayback}
            onSeek={(value) => { setPlayhead(value); setPlaying(false); }}
          />}
          {activeNav === "predictions" && <PredictionsPage
            selectedExperiment={selectedExperiment}
            playhead={playhead}
            onExport={exportExperimentCsv}
          />}
        </div>
      </main>
    </div>
  );
}

export default App;
