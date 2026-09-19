import { useScenario } from "./hooks/useScenario.js";
import Header from "./components/Header.jsx";
import FleetPanel from "./components/FleetPanel.jsx";
import StepList from "./components/StepList.jsx";
import MapView from "./components/MapView.jsx";
import NodeDetail from "./components/NodeDetail.jsx";
import MissionLog from "./components/MissionLog.jsx";
import DataSources from "./components/DataSources.jsx";
import { EVENT, STEP_DEFS } from "./data/scenario.js";

export default function App() {
  const scenario = useScenario();
  const { state } = scenario;

  const statusLine =
    state.stageIndex === 0
      ? EVENT.fact
      : state.stageIndex >= STEP_DEFS.length
      ? "All steps complete — 2 payload drones and 3 rovers dispatched, 3 zones queued."
      : `Step ${STEP_DEFS[state.stageIndex - 1].step} complete.`;

  return (
    <div className="app">
      <Header scenario={scenario} />

      <div className="body">
        <div className="col">
          <FleetPanel scenario={scenario} />
          <StepList scenario={scenario} />
        </div>

        <div className="col center-col">
          <div className="stage-status">{statusLine}</div>
          <MapView scenario={scenario} />
        </div>

        <div className="col right-col">
          <div className="node-section">
            <NodeDetail scenario={scenario} />
          </div>
          <div className="log-section">
            <MissionLog entries={state.log} />
          </div>
        </div>
      </div>

      <DataSources />
    </div>
  );
}
