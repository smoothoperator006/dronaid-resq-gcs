import { ASSETS, ZONES } from "../data/scenario.js";

const GROUPS = [
  { type: "scout", label: "SCOUT DRONES" },
  { type: "payload", label: "PAYLOAD DRONES" },
  { type: "rover", label: "GROUND ROVERS" }
];

const STATUS_LABEL = {
  standby: "STANDBY",
  airborne: "AIRBORNE",
  enroute: "EN ROUTE",
  onsite: "ON SITE",
  monitoring: "MONITORING",
  reserve: "RESERVE"
};

export default function FleetPanel({ scenario }) {
  const { state } = scenario;
  const activeCount = ASSETS.filter((a) => state.assets[a.id].status !== "standby").length;

  return (
    <>
      <div className="panel-title">
        FLEET STATUS <span className="count">{activeCount}/{ASSETS.length} active</span>
      </div>
      <div className="scroll">
        {GROUPS.map((g) => (
          <div className="fleet-group" key={g.type}>
            <div className="fleet-group-label">{g.label}</div>
            {ASSETS.filter((a) => a.type === g.type).map((a) => {
              const st = state.assets[a.id];
              const target = st.target ? ZONES.find((z) => z.id === st.target) : null;
              return (
                <div className="asset" key={a.id}>
                  <div className="asset-row1">
                    <span className="asset-id">{a.id}</span>
                    <span className={`asset-status st-${st.status}`}>{STATUS_LABEL[st.status] || st.status}</span>
                  </div>
                  <div className="asset-meta">
                    <span className="batt-bar">
                      <span className={`batt-fill${a.battery < 25 ? " low" : ""}`} style={{ width: `${a.battery}%` }} />
                    </span>
                    <span>{a.battery}%</span>
                  </div>
                  {target && <div className="asset-target">→ {target.name}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
