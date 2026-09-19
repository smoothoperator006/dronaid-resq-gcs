import weights from "../data/priority_weights.json";

const { features, mean, std, coef, intercept } = weights;

/**
 * Scores one zone's raw sensor features using the model trained offline
 * (see /ml/train_model.py). Returns a 0-100 priority score plus a
 * per-feature contribution breakdown so the UI can show *why* a zone
 * scored the way it did, not just the number.
 */
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

  return {
    score: Math.max(0, Math.min(100, score)),
    contributions
  };
}

export const MODEL_META = weights.metrics;
export const TRAINED_ON = weights.trained_on;
