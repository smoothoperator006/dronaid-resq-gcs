# DronAid-ResQ — GCS (Exercise Kashi-1)

A ground-control-station prototype for **DronAid-ResQ**: scout drones for
mapping, payload drones for emergency delivery, and rovers for last-mile
assistance — coordinated by an offline edge computer that runs a
priority-ranking model and allocates missions.

## The scenario

This build runs a **fictional training exercise**: a simulated M5.2
tremor in a dense old-city lane network. The street geography is real
(the tightly packed lanes near Vishwanath Gali, Varanasi) because that
kind of environment — narrow lanes no vehicle can enter, short distances
between wildly different damage levels — is exactly the case DronAid-ResQ
is built for. **Everything about the earthquake itself, the 8 damage
zones, and their sensor readings is invented for this demo.** See the
"Data sources & what's simulated" panel at the bottom of the app.

## What actually runs

1. **Step I** — two scout drones fly a lawnmower (SLAM-style) sweep over
   the affected sector. The fog-of-war grid clears as they pass, and each
   zone's synthetic sensor reading becomes available the moment its cell
   is swept.
2. **Step II** — readings are fused into the local database.
3. **Step III** — a **real trained model** (not hardcoded numbers) scores
   every zone live in the browser. See `/ml` — a linear regression is
   trained offline on 300 synthetic incident samples, and its learned
   weights (`ml/model/priority_weights.json`, mirrored into
   `src/data/`) are what `src/utils/priorityModel.js` runs at inference
   time.
4. **Step IV** — zones are ranked and tiered (CRITICAL / HIGH / LOW).
5. **Step V** — the top 2 zones get the 2 payload drones, the next 3 get
   the 3 ground rovers, and the remaining 3 are queued (not enough
   assets) — asset markers physically fly/drive to their targets on the
   map.

## Running the app

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Retraining the priority model

```bash
cd ml
python3 -m venv .venv && source .venv/bin/activate   # optional
pip install numpy pandas scikit-learn
python3 generate_synthetic_data.py   # writes synthetic_incidents.csv
python3 train_model.py               # writes model/priority_weights.json
cp model/priority_weights.json ../src/data/priority_weights.json
```

`train_model.py` prints train/test R² and MAE so you can see the model
isn't overfit to its own synthetic data before trusting its output.

## Project layout

```
ml/
  generate_synthetic_data.py   synthetic training set (300 rows)
  train_model.py                trains the linear model, exports weights
  model/priority_weights.json   trained weights (also copied into src/data/)
src/
  data/scenario.js              zones, assets, fixed nodes, event text
  data/priority_weights.json    same trained weights, consumed by the app
  utils/
    priorityModel.js            runs the trained model at inference time
    grid.js                     fog-of-war grid math + lawnmower scan order
    motion.js                   marker position interpolation
    colors.js                   status/tier → color
  hooks/useScenario.js          all pipeline state + animation timing
  components/                   one component per panel (Header, FleetPanel,
                                 StepList, MapView, NodeDetail, MissionLog,
                                 DataSources)
  App.jsx / App.css             layout + styling
```

## Data sources

| Data | Where it comes from |
|---|---|
| Map tiles | OpenStreetMap (`tile.openstreetmap.org`) |
| Street geography | Real lanes/localities near Vishwanath Gali, Varanasi old city |
| Earthquake, zones, sensor readings | Fictional — created for this demo |
| Priority model | Linear regression trained on synthetic data — see `/ml` |
