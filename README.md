<div align="center">

# 🚁 DronAid-ResQ — Ground Control Station

### Smart India Hackathon 2026 &nbsp;·&nbsp; Team DronAid-ResQ &nbsp;·&nbsp; 

A working Ground Control Station (GCS) that coordinates heterogeneous rescue teams — scout drones, payload drones, and ground rovers — using an offline-first AI pipeline that scores disaster zones in real time and autonomously dispatches assets without any cloud or internet dependency.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-Linear%20Regression-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org)

</div>

---

## Problem We're Solving

When a disaster hits a dense urban area — collapsed buildings, narrow lanes, blocked roads — first responders face three hard problems simultaneously:

1. **No visibility** — they don't know which of 8+ zones needs help most urgently
2. **No access** — ground vehicles can't reach many areas
3. **No coordination** — manually deciding which drone or rover goes where wastes critical minutes

DronAid-ResQ solves all three. Scout drones sweep the area and collect sensor data. A trained ML model on the edge computer scores every zone in real time. The GCS then autonomously dispatches the right asset — payload drone or rover — to the right zone, ranked by priority.

**No cloud. No internet. Runs on an offline edge computer at the disaster site.**

---

## This Repository

This is the **working prototype** of the DronAid-ResQ GCS — a browser-based command interface that runs the full 5-step pipeline end to end. The ML model is real (trained with scikit-learn), the map uses real street geometry, and the asset dispatch logic mirrors what a production system would execute.

The scenario loaded in this build is a simulated M5.2 tremor near Vishwanath Gali, Varanasi — chosen because its dense old-city lanes (too narrow for any ground vehicle) are exactly the environment this system is built for.

```bash
git clone https://github.com/smoothoperator006/dronaid-resq-gcs.git
cd dronaid-resq-gcs
npm install
npm run dev
# Open http://localhost:5173 — click ▶ Run Next Step five times
```

---

## The 5-Step Pipeline (all running in this prototype)

| Step | What happens | Code |
|------|-------------|------|
| **I — Scout Sweep** | Two scout drones fly a lawnmower grid over the sector. Fog-of-war clears cell by cell. Each zone's sensor data is revealed as drones pass over it. | `src/utils/grid.js` |
| **II — Data Fusion** | Sensor readings from aerial imagery + rover sensors are fused into the local edge database. | `src/hooks/useScenario.js` |
| **III — AI Scoring** | The trained ML model scores every zone 0–100 live in the browser. Not hardcoded — real inference. | `src/utils/priorityModel.js` |
| **IV — Priority Ranking** | Zones are tiered: **CRITICAL / HIGH / LOW** based on model output. | `src/hooks/useScenario.js` |
| **V — Autonomous Dispatch** | Top 2 zones → payload drones (emergency kits). Next 3 → ground rovers (supplies + monitoring). Remaining zones queued. Asset markers physically move to targets on the map. | `src/components/MapView.jsx` + `src/utils/motion.js` |

---

## The AI Model — How It Actually Works

The priority score for each zone is computed by a **linear regression trained offline on 300 synthetic disaster incidents** using scikit-learn. The trained weights are exported as JSON and loaded directly by the browser — no Python, no server, no API call at inference time.

### Features

| Feature | What it captures |
|---------|-----------------|
| `structural_damage` | Collapse severity from scout drone imagery (0–100) |
| `thermal_signal_count` | Heat signatures — possible trapped survivors |
| `population_density` | Estimated persons in the zone |
| `road_access_score` | Lane passability for ground vehicles (lower = worse) |
| `proximity` | Derived from distance to epicenter — closer zones score higher risk |

### Training the model

```bash
cd ml
pip install numpy pandas scikit-learn
python3 generate_synthetic_data.py   # creates 300-row synthetic_incidents.csv
python3 train_model.py               # trains, prints metrics, exports weights
```

Output from `train_model.py`:
```
Train R²:  0.909
Test  R²:  0.884      ← holds on unseen data, not overfit
Test  MAE: 5.29 priority points

Learned weights (standardised features):
  structural_damage      +7.671   ← strongest driver
  thermal_signal_count   +7.121
  population_density     +4.533
  road_access_score      −3.204   ← negative: better road = lower urgency
  proximity              +3.793
  intercept              +47.615
```

Weights are saved to `ml/model/priority_weights.json` and copied into `src/data/` so the browser can load them directly.

### Inference in the browser (`src/utils/priorityModel.js`)

```js
import weights from "../data/priority_weights.json";
const { features, mean, std, coef, intercept } = weights;

export function scoreZone(rawFeatures) {
  const proximity = 1 - Math.min(rawFeatures.distance_from_epicenter_m, 800) / 800;
  const values = {
    structural_damage: rawFeatures.structural_damage,
    thermal_signal_count: rawFeatures.thermal_signal_count,
    population_density: rawFeatures.population_density,
    road_access_score: rawFeatures.road_access_score,
    proximity
  };

  let score = intercept;
  const contributions = [];

  features.forEach((name, i) => {
    const standardized = (values[name] - mean[i]) / std[i];
    const contribution = standardized * coef[i];
    score += contribution;
    contributions.push({ feature: name, contribution });
  });

  // contributions array powers the "why this score?" breakdown in the UI
  return { score: Math.max(0, Math.min(100, score)), contributions };
}
```

The `contributions` array is what the GCS uses to show operators **why** a zone was ranked critical — not just a number, but a breakdown of which sensor readings drove the score.

---

## Asset Fleet

| Asset | Count | Role | Dispatched to |
|-------|-------|------|--------------|
| 🚁 Scout Drone | 2 | Aerial sweep, imagery, sensor collection | All zones — Step I |
| 📦 Payload Drone | 2 | Immediate emergency kit delivery | CRITICAL priority zones |
| 🚗 Ground Rover | 3 | Supply delivery + continuous monitoring | HIGH / LOW priority zones |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| GCS Frontend | React 18 + Vite 5 | Fast, componentised, runs in any browser |
| Map Engine | Leaflet 1.9 + OpenStreetMap | Real street geometry, no Google Maps dependency |
| AI / ML | scikit-learn → JSON weights → browser inference | Train offline, run anywhere with zero runtime deps |
| State Machine | Custom React hook (`useScenario.js`) | Entire pipeline in one place, no Redux needed |
| Offline-first | No external API calls after page load | Works on edge hardware with no internet |

---

## Project Structure

```
dronaid-resq-gcs/
├── ml/
│   ├── generate_synthetic_data.py    # generates 300-row synthetic training set
│   ├── train_model.py                # trains linear regression, exports weights
│   └── model/
│       └── priority_weights.json     # trained weights — also copied into src/data/
└── src/
    ├── data/
    │   ├── scenario.js               # zones, assets, nodes, event metadata
    │   └── priority_weights.json     # weights consumed by the browser at runtime
    ├── utils/
    │   ├── priorityModel.js          # inference — scores zones using trained weights
    │   ├── grid.js                   # fog-of-war grid + lawnmower sweep algorithm
    │   ├── motion.js                 # asset marker position interpolation
    │   └── colors.js                 # status/tier → colour mapping
    ├── hooks/
    │   └── useScenario.js            # full pipeline state machine + animation timing
    ├── components/
    │   ├── Header.jsx                # mission clock + step controls
    │   ├── FleetPanel.jsx            # live asset status
    │   ├── StepList.jsx              # pipeline step progress
    │   ├── MapView.jsx               # Leaflet map + fog-of-war + moving asset markers
    │   ├── NodeDetail.jsx            # zone detail + model score breakdown
    │   ├── MissionLog.jsx            # timestamped event log
    │   └── DataSources.jsx           # transparency panel
    ├── App.jsx
    └── App.css
```

---

## Retraining the Model

Want to adjust features, add new sensor types, or change the training distribution?

```bash
cd ml
# Edit generate_synthetic_data.py to change features or sample size
python3 generate_synthetic_data.py
python3 train_model.py
cp model/priority_weights.json ../src/data/priority_weights.json
# Restart npm run dev — browser picks up new weights immediately
```

---

## What's Prototype vs What's Real

| Component | Status | Notes |
|-----------|--------|-------|
| ML model training + inference | ✅ Real | scikit-learn linear regression, real weights |
| In-browser scoring (no server) | ✅ Real | `priorityModel.js` runs standardisation + dot product |
| Fog-of-war sweep algorithm | ✅ Real | Lawnmower grid order in `grid.js` |
| Priority-based asset allocation | ✅ Real | Top-N assignment logic in `useScenario.js` |
| Map geometry (Varanasi lanes) | ✅ Real | OpenStreetMap tiles, real GPS coordinates |
| Drone/rover telemetry | 🔶 Simulated | Real system would use MAVLink over radio |
| Sensor readings | 🔶 Synthetic | Real system would receive from onboard sensors |
| Earthquake event | 🔶 Fictional | Training scenario — Exercise Kashi-1 |

---

## Smart India Hackathon 2026

**Team:** DronAid-ResQ  
**Problem ID:** SIH26177  
**Repo:** [github.com/smoothoperator006/dronaid-resq-gcs](https://github.com/smoothoperator006/dronaid-resq-gcs)

---

<div align="center">
<sub>Map tiles © OpenStreetMap contributors &nbsp;·&nbsp; Sensor data and scenario events are synthetic, created for this prototype</sub>
</div>
