"""
train_model.py
---------------
Trains a basic linear regression to predict priority_score from the four
raw sensor features (distance is folded in as "proximity" so the model
learns "closer is worse" the same direction as the other features).

Deliberately simple: a linear model is the entire point for a prototype
like this — it runs anywhere with no runtime dependency, and every score
it produces can be explained as a sum of feature contributions, which
matters when the thing is deciding which drone flies where.

Run:
    python3 generate_synthetic_data.py
    python3 train_model.py

Outputs model/priority_weights.json, which the frontend loads directly
and uses to score zones at inference time (see src/utils/priorityModel.js).
"""

import json

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error

df = pd.read_csv("synthetic_incidents.csv")

df["proximity"] = 1 - (df["distance_from_epicenter_m"] / 800)
FEATURES = ["structural_damage", "thermal_signal_count", "population_density", "road_access_score", "proximity"]

X = df[FEATURES].values
y = df["priority_score"].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

# Standardize by hand (rather than importing StandardScaler) so the
# exported JSON is just plain numbers the frontend can use directly.
mean = X_train.mean(axis=0)
std = X_train.std(axis=0)
X_train_std = (X_train - mean) / std
X_test_std = (X_test - mean) / std

model = LinearRegression()
model.fit(X_train_std, y_train)

train_r2 = r2_score(y_train, model.predict(X_train_std))
test_r2 = r2_score(y_test, model.predict(X_test_std))
test_mae = mean_absolute_error(y_test, model.predict(X_test_std))

print(f"Train R^2: {train_r2:.3f}")
print(f"Test  R^2: {test_r2:.3f}")
print(f"Test  MAE: {test_mae:.2f} priority points")
print("Learned weights (on standardized features):")
for f, w in zip(FEATURES, model.coef_):
    print(f"  {f:22s} {w:+.3f}")
print(f"  intercept              {model.intercept_:+.3f}")

weights_out = {
    "features": FEATURES,
    "mean": mean.tolist(),
    "std": std.tolist(),
    "coef": model.coef_.tolist(),
    "intercept": float(model.intercept_),
    "metrics": {"train_r2": round(train_r2, 3), "test_r2": round(test_r2, 3), "test_mae": round(test_mae, 2)},
    "trained_on": "synthetic_incidents.csv (n=300, synthetic — see generate_synthetic_data.py)"
}

with open("model/priority_weights.json", "w") as f:
    json.dump(weights_out, f, indent=2)

print("\nSaved model/priority_weights.json")
