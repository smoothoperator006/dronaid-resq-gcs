import { useMemo, useRef, useState, useCallback } from "react";
import { ZONES, ASSETS, NODES_FIXED, tierFor } from "../data/scenario.js";
import { scoreZone } from "../utils/priorityModel.js";
import { buildGrid, sweepOrder } from "../utils/grid.js";
import { interpolatePath } from "../utils/motion.js";

const OPS_BASE = NODES_FIXED.find((n) => n.id === "ops-base");
const GRID_ROWS = 4;
const GRID_COLS = 6;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fmtClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `T+${m}:${s}`;
}

function initialDraft() {
  const zones = {};
  ZONES.forEach((z) => {
    zones[z.id] = {
      surveyed: false,
      fused: false,
      scored: false,
      score: null,
      contributions: null,
      tier: null,
      assignedAsset: null,
      eta: null,
      arrived: false
    };
  });
  const assets = {};
  ASSETS.forEach((a) => {
    assets[a.id] = { lat: OPS_BASE.lat, lng: OPS_BASE.lng, status: "standby", target: null };
  });
  return {
    stageIndex: 0,
    isAnimating: false,
    revealedCells: {},
    zones,
    assets,
    log: [],
    simSeconds: 0,
    selectedId: null
  };
}

export function useScenario() {
  const grid = useMemo(() => buildGrid(ZONES, GRID_ROWS, GRID_COLS), []);
  const zoneCellMap = useMemo(() => {
    const map = {};
    ZONES.forEach((z) => {
      map[z.id] = grid.cellForPoint(z.lat, z.lng);
    });
    return map;
  }, [grid]);

  const draftRef = useRef(initialDraft());
  const epochRef = useRef(0); // bumped on reset so stale background timers (post-animation arrivals) can no-op
  const [state, setState] = useState(draftRef.current);

  const commit = useCallback(() => {
    draftRef.current = { ...draftRef.current };
    setState(draftRef.current);
  }, []);

  const addLog = useCallback((text, kind = null, secondsToAdd = 0) => {
    const d = draftRef.current;
    d.simSeconds += secondsToAdd;
    d.log = [...d.log, { time: fmtClock(d.simSeconds), text, kind }];
    commit();
  }, [commit]);

  const updateAsset = useCallback((id, patch) => {
    const d = draftRef.current;
    d.assets = { ...d.assets, [id]: { ...d.assets[id], ...patch } };
    commit();
  }, [commit]);

  const updateZone = useCallback((id, patch) => {
    const d = draftRef.current;
    d.zones = { ...d.zones, [id]: { ...d.zones[id], ...patch } };
    commit();
  }, [commit]);

  const revealCell = useCallback((cellId) => {
    const d = draftRef.current;
    d.revealedCells = { ...d.revealedCells, [cellId]: true };
    commit();
  }, [commit]);

  const select = useCallback((id) => {
    draftRef.current.selectedId = id;
    commit();
  }, [commit]);

  const setAnimating = useCallback((v) => {
    draftRef.current.isAnimating = v;
    commit();
  }, [commit]);

  const setStage = useCallback((n) => {
    draftRef.current.stageIndex = n;
    commit();
  }, [commit]);

  /** Moves an asset marker along an interpolated path, tick by tick (CSS handles the smoothing). */
  async function moveAsset(id, toLatLng, { steps = 8, tickMs = 90 } = {}) {
    const from = [draftRef.current.assets[id].lat, draftRef.current.assets[id].lng];
    const points = interpolatePath(from, toLatLng, steps);
    for (const [lat, lng] of points) {
      updateAsset(id, { lat, lng });
      await wait(tickMs);
    }
  }

  /* ---------------- STEP I — deploy swarm & SLAM sweep ---------------- */
  async function runStepI() {
    addLog("SD-1, SD-2 launched from Ops Base — beginning SLAM sweep of the affected sector.", "ok", 2);
    updateAsset("SD-1", { status: "airborne" });
    updateAsset("SD-2", { status: "airborne" });

    const pathA = sweepOrder(GRID_ROWS, 0, 2); // SD-1: west half
    const pathB = sweepOrder(GRID_ROWS, 3, 5); // SD-2: east half
    const cellToZones = {};
    Object.entries(zoneCellMap).forEach(([zoneId, cellId]) => {
      cellToZones[cellId] = cellToZones[cellId] ? [...cellToZones[cellId], zoneId] : [zoneId];
    });

    const steps = Math.max(pathA.length, pathB.length);
    for (let i = 0; i < steps; i++) {
      const cellA = pathA[i];
      const cellB = pathB[i];
      if (cellA) {
        revealCell(cellA);
        const center = grid.cells.find((c) => c.id === cellA).center;
        updateAsset("SD-1", { lat: center[0], lng: center[1] });
        (cellToZones[cellA] || []).forEach((zoneId) => {
          updateZone(zoneId, { surveyed: true });
          const z = ZONES.find((zz) => zz.id === zoneId);
          addLog(`Field data received — ${z.name}`, null, 3);
        });
      }
      if (cellB) {
        revealCell(cellB);
        const center = grid.cells.find((c) => c.id === cellB).center;
        updateAsset("SD-2", { lat: center[0], lng: center[1] });
        (cellToZones[cellB] || []).forEach((zoneId) => {
          updateZone(zoneId, { surveyed: true });
          const z = ZONES.find((zz) => zz.id === zoneId);
          addLog(`Field data received — ${z.name}`, null, 1);
        });
      }
      await wait(260);
    }

    addLog("SLAM sweep complete — local occupancy map built, 0 network calls.", "ok", 2);

    // scouts head home
    const myEpoch = epochRef.current;
    moveAsset("SD-1", [OPS_BASE.lat, OPS_BASE.lng], { steps: 6, tickMs: 80 });
    moveAsset("SD-2", [OPS_BASE.lat, OPS_BASE.lng], { steps: 6, tickMs: 80 }).then(() => {
      if (epochRef.current !== myEpoch) return;
      updateAsset("SD-1", { status: "reserve" });
      updateAsset("SD-2", { status: "reserve" });
      addLog("SD-1, SD-2 back at Ops Base — holding in reserve.", null, 4);
    });
  }

  /* ---------------- STEP II — collect & fuse field data ---------------- */
  async function runStepII() {
    addLog("Fusing 8 surveyed zones into the local database…", null, 1);
    await wait(900);
    ZONES.forEach((z) => updateZone(z.id, { fused: true }));
    addLog("Fusion complete — feature vectors ready for scoring.", "ok", 2);
  }

  /* ---------------- STEP III — run priority model (edge) ---------------- */
  async function runStepIII() {
    addLog("Running local risk & priority model — fully offline.", null, 1);
    await wait(400);
    for (const z of ZONES) {
      const { score, contributions } = scoreZone(z.features);
      const tier = tierFor(score);
      updateZone(z.id, { scored: true, score, contributions, tier });
      addLog(`Model scored ${z.name} → ${score.toFixed(1)}`, null, 2);
      await wait(220);
    }
  }

  /* ---------------- STEP IV — rank relief zones ---------------- */
  async function runStepIV() {
    await wait(300);
    const ranked = [...ZONES].sort(
      (a, b) => draftRef.current.zones[b.id].score - draftRef.current.zones[a.id].score
    );
    const counts = { critical: 0, high: 0, low: 0 };
    ranked.forEach((z) => counts[draftRef.current.zones[z.id].tier]++);
    const top = ranked[0];
    addLog(
      `Ranking complete — ${top.name} highest at ${draftRef.current.zones[top.id].score.toFixed(1)}. ` +
        `${counts.critical} CRITICAL, ${counts.high} HIGH, ${counts.low} LOW.`,
      "ok",
      2
    );
  }

  /* ---------------- STEP V — allocate missions ---------------- */
  async function runStepV() {
    const ranked = [...ZONES].sort(
      (a, b) => draftRef.current.zones[b.id].score - draftRef.current.zones[a.id].score
    );

    const payloadAssets = ["PD-1", "PD-2"];
    const roverAssets = ["GR-1", "GR-2", "GR-3"];
    const payloadEtas = ["6 min", "9 min"];
    const roverEtas = ["14 min", "19 min", "24 min"];

    const assignments = [];
    ranked.slice(0, 2).forEach((z, i) => {
      assignments.push({ zoneId: z.id, assetId: payloadAssets[i], eta: payloadEtas[i], kind: "payload" });
    });
    ranked.slice(2, 5).forEach((z, i) => {
      assignments.push({ zoneId: z.id, assetId: roverAssets[i], eta: roverEtas[i], kind: "rover" });
    });

    for (const a of assignments) {
      const zone = ZONES.find((z) => z.id === a.zoneId);
      updateZone(a.zoneId, { assignedAsset: a.assetId, eta: a.eta });
      updateAsset(a.assetId, { status: "enroute", target: a.zoneId });
      addLog(
        `${a.assetId} dispatched → ${zone.name} — ${a.kind === "payload" ? "payload drop" : "last-mile assessment"} — ETA ${a.eta}`,
        a.kind === "payload" ? "crit" : null,
        2
      );
      const myEpoch = epochRef.current;
      moveAsset(a.assetId, [zone.lat, zone.lng], { steps: 10, tickMs: 130 }).then(() => {
        if (epochRef.current !== myEpoch) return;
        updateAsset(a.assetId, { status: "onsite" });
        updateZone(a.zoneId, { arrived: true });
        addLog(`${a.assetId} arrived on site — ${zone.name}.`, "ok", 1);
      });
      await wait(450); // stagger dispatch starts
    }

    const queued = ranked.slice(5);
    if (queued.length > 0) {
      addLog(
        `${queued.map((z) => z.name).join(", ")} — no asset available. Queued pending fleet return.`,
        "warn",
        1
      );
    }
  }

  const STEP_RUNNERS = [runStepI, runStepII, runStepIII, runStepIV, runStepV];

  const advance = useCallback(async () => {
    if (draftRef.current.isAnimating) return;
    const current = draftRef.current.stageIndex;
    if (current >= STEP_RUNNERS.length) return;
    setAnimating(true);
    await STEP_RUNNERS[current]();
    setStage(current + 1);
    setAnimating(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = useCallback(() => {
    epochRef.current += 1;
    draftRef.current = initialDraft();
    setState(draftRef.current);
  }, []);

  return { state, grid, advance, reset, select };
}
