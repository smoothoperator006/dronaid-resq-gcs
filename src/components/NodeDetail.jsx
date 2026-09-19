import { ZONES } from "../data/scenario.js";
import { colorForNodeStatus, tierLabel } from "../utils/colors.js";

const FEATURE_LABEL = {
  structural_damage: "Structural damage",
  thermal_signal_count: "Thermal signals",
  population_density: "Population density",
  road_access_score: "Road access",
  proximity: "Proximity to epicenter"
};

export default function NodeDetail({ scenario }) {
  const { state, select } = scenario;
  const selected = state.selectedId ? ZONES.find((z) => z.id === state.selectedId) : null;

  if (!selected) {
    if (state.stageIndex >= 4) {
      return <PriorityQueue state={state} onSelect={select} />;
    }
    return (
      <>
        <div className="panel-title">NODE DETAIL</div>
        <div className="empty-state">
          Click a zone marker on the map to see what DronAid-ResQ knows about it at the current step.
        </div>
      </>
    );
  }

  const runtime = state.zones[selected.id];

  return (
    <>
      <div className="panel-title">
        NODE DETAIL
        <button className="popover-close" onClick={() => select(null)} aria-label="Close">×</button>
      </div>
      <div className="node-detail-body">
        <div className="popover-title">{selected.name}</div>

        {!runtime.surveyed ? (
          <>
            <div className="popover-tier" style={{ background: "#EFEFEC", color: "#5B6570" }}>UNSURVEYED</div>
            <div className="popover-row"><span>Population</span><b>{selected.population}</b></div>
            <p className="node-note">No field data yet — this zone has not been reached by the SLAM sweep.</p>
          </>
        ) : !runtime.scored ? (
          <>
            <div className="popover-tier" style={{ background: "#E7ECF3", color: "#1B2A4A" }}>SURVEYED</div>
            <div className="popover-row"><span>Population</span><b>{selected.population}</b></div>
            <div className="popover-row"><span>Structural damage</span><b>{selected.features.structural_damage}</b></div>
            <div className="popover-row"><span>Thermal signals</span><b>{selected.features.thermal_signal_count}</b></div>
            <div className="popover-row"><span>Priority</span><b>pending — model not yet run</b></div>
          </>
        ) : (
          <>
            <div className="popover-tier" style={{ background: tintFor(runtime.tier), color: colorForNodeStatus(runtime.tier) }}>
              {tierLabel(runtime.tier)} · {runtime.score.toFixed(1)}
            </div>
            <div className="popover-row"><span>Population</span><b>{selected.population}</b></div>
            {runtime.assignedAsset ? (
              <>
                <div className="popover-row"><span>Assigned asset</span><b>{runtime.assignedAsset}</b></div>
                <div className="popover-row"><span>ETA</span><b>{runtime.eta}</b></div>
                <div className="popover-row"><span>Status</span><b>{runtime.arrived ? "ARRIVED" : "EN ROUTE"}</b></div>
              </>
            ) : (
              <div className="popover-row"><span>Assigned asset</span><b>none — queued</b></div>
            )}

            {selected.needs.length > 0 && (
              <div className="popover-needs">
                {selected.needs.map((n) => (
                  <span className="need-tag" key={n}>{n}</span>
                ))}
              </div>
            )}

            <div className="feature-breakdown">
              <div className="feature-breakdown-title">Why this score — model contributions</div>
              {sortedContributions(runtime.contributions).map((c) => (
                <FeatureBar key={c.feature} label={FEATURE_LABEL[c.feature]} value={c.contribution} />
              ))}
            </div>

            <p className="node-note">{selected.note}</p>
          </>
        )}
      </div>
    </>
  );
}

function sortedContributions(contributions) {
  return [...contributions].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}

function FeatureBar({ label, value }) {
  const max = 12; // rough scale for bar width, contributions typically fall within +-12
  const pct = Math.min(100, (Math.abs(value) / max) * 100);
  const positive = value >= 0;
  return (
    <div className="feature-bar-row">
      <span className="feature-bar-label">{label}</span>
      <span className="feature-bar-track">
        <span
          className={`feature-bar-fill ${positive ? "pos" : "neg"}`}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="feature-bar-value">{value >= 0 ? "+" : ""}{value.toFixed(1)}</span>
    </div>
  );
}

function tintFor(tier) {
  return { critical: "#F5E4E1", high: "#F3EAD4", low: "#E2EEE6" }[tier] || "#EFEFEC";
}

function PriorityQueue({ state, onSelect }) {
  const ranked = [...ZONES]
    .filter((z) => state.zones[z.id].scored)
    .sort((a, b) => state.zones[b.id].score - state.zones[a.id].score);

  return (
    <>
      <div className="panel-title">
        PRIORITY QUEUE <span className="count">{ranked.length} ranked</span>
      </div>
      <div className="scroll">
        {ranked.map((z, i) => {
          const runtime = state.zones[z.id];
          return (
            <div className="qitem" key={z.id} onClick={() => onSelect(z.id)} tabIndex={0} role="button">
              <span className="qitem-rank">{i + 1}</span>
              <span className="qitem-tier" style={{ background: colorForNodeStatus(runtime.tier) }} />
              <span className="qitem-body">
                <div className="qitem-name">{z.name}</div>
                <div className="qitem-sub">
                  {tierLabel(runtime.tier)}
                  {runtime.assignedAsset ? ` · ${runtime.assignedAsset}` : " · queued"}
                </div>
              </span>
              <span className="qitem-score" style={{ color: colorForNodeStatus(runtime.tier) }}>
                {runtime.score.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
