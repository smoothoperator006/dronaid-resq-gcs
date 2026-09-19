import { STEP_DEFS } from "../data/scenario.js";

export default function StepList({ scenario }) {
  const { state } = scenario;

  return (
    <>
      <div className="panel-title">PIPELINE</div>
      <div className="step-list">
        {STEP_DEFS.map((s, i) => {
          let cls = "step-item";
          if (state.stageIndex > i) cls += " done";
          if (state.isAnimating && state.stageIndex === i) cls += " current";
          return (
            <div className={cls} key={s.step}>
              <span className="step-num">{s.step}</span>
              <div className="step-item-label">{s.label}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
