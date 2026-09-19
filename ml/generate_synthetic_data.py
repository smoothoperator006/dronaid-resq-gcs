"""
generate_synthetic_data.py
---------------------------
DronAid-ResQ has no real historical incident database to train on, so
this generates a synthetic one: rows that look like what a scout-drone
sweep + edge database would log for a damaged zone after past incidents.

Features (all things a scout drone or ground sensor can plausibly read):
  structural_damage      0-100   visual/thermal structural assessment
  thermal_signal_count   0-25    distinct heat signatures (proxy for trapped people)
  population_density     50-500 people/hectare (dense old-city wards run high)
  road_access_score      0-100  100 = vehicle-accessible, 0 = blocked/too narrow
  distance_from_epicenter_m  0-800  within a compact ~800m affected radius

Label:
  priority_score  0-100, a weighted combination of the above plus noise,
  standing in for what a post-incident review board would have assigned.
  The weights here are the "ground truth" the model has to recover —
  they are intentionally not shown to the training script.
"""

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)
N = 300

# Distance first, since damage/thermal correlate with proximity to the epicenter.
distance = RNG.uniform(0, 800, N)
proximity = 1 - (distance / 800)  # 1 = at epicenter, 0 = edge of affected area

structural_damage = np.clip(
    proximity * 70 + RNG.normal(20, 18, N), 0, 100
)
thermal_signal_count = np.clip(
    proximity * 18 + RNG.normal(3, 5, N), 0, 25
).round()
population_density = np.clip(
    RNG.normal(260, 110, N), 40, 520
)
road_access_score = np.clip(
    100 - proximity * 55 + RNG.normal(0, 20, N), 0, 100
)

true_weights = {
    "structural_damage": 0.30,
    "thermal_signal_count": 0.25,
    "population_density": 0.20,
    "road_access_inverse": 0.15,
    "proximity": 0.10,
}

priority_raw = (
    true_weights["structural_damage"] * structural_damage
    + true_weights["thermal_signal_count"] * (thermal_signal_count / 25 * 100)
    + true_weights["population_density"] * (population_density / 520 * 100)
    + true_weights["road_access_inverse"] * (100 - road_access_score)
    + true_weights["proximity"] * (proximity * 100)
)
priority_score = np.clip(priority_raw + RNG.normal(0, 6, N), 0, 100)

df = pd.DataFrame({
    "structural_damage": structural_damage.round(1),
    "thermal_signal_count": thermal_signal_count.astype(int),
    "population_density": population_density.round(0),
    "road_access_score": road_access_score.round(1),
    "distance_from_epicenter_m": distance.round(0),
    "priority_score": priority_score.round(1),
})

df.to_csv("synthetic_incidents.csv", index=False)
print(f"Wrote synthetic_incidents.csv with {len(df)} rows")
print(df.head())
