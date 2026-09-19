import { STEP_DEFS } from "../data/scenario.js";

export default function Header({ scenario }) {
  const { state, advance, reset } = scenario;
  const atEnd = state.stageIndex >= STEP_DEFS.length;
  const currentStepLabel = STEP_DEFS[state.stageIndex];

  let buttonText;
  if (atEnd) buttonText = "Scenario complete";
  else if (state.isAnimating) buttonText = "Running…";
  else buttonText = `Run Step ${currentStepLabel.step} — ${currentStepLabel.label}`;

  return (
    <header className="header">
      <div className="brand">
        <span className="brand-mark" />
        <span className="brand-name">DronAid-ResQ</span>
        <span className="brand-sub">GCS — Exercise Kashi-1 (fictional scenario)</span>
      </div>
      <div className="badge-offline">
        <span className="dot" />
        OFFLINE · SYNTHETIC DATA · EDGE ML
      </div>
      <div className="header-spacer" />
      <div className="clock">{formatClock(state.simSeconds)}</div>
      <button className="btn btn-ghost" onClick={reset} disabled={state.isAnimating || state.stageIndex === 0}>
        Reset
      </button>
      <button className="btn btn-primary" onClick={advance} disabled={state.isAnimating || atEnd}>
        {buttonText}
      </button>
    </header>
  );
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `T+${m}:${s}`;
}
