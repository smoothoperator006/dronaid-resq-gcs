export default function MissionLog({ entries }) {
  return (
    <>
      <div className="panel-title">MISSION LOG</div>
      <div className="scroll">
        {entries.length === 0 ? (
          <div className="empty-state">No events yet. Advance the pipeline to begin the replay.</div>
        ) : (
          <div className="log-list">
            {entries.map((e, i) => (
              <div className={`log-row${e.kind ? " " + e.kind : ""}`} key={i}>
                <span className="log-time">{e.time}</span>
                <span className="log-text">{e.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
