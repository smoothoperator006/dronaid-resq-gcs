import { MODEL_META, TRAINED_ON } from "../utils/priorityModel.js";

export default function DataSources() {
  return (
    <footer className="footer">
      <details>
        <summary>Data sources &amp; what's simulated</summary>
        <table className="sources-table">
          <tbody>
            <tr><td>Map tiles</td><td>OpenStreetMap (tile.openstreetmap.org)</td></tr>
            <tr><td>Street geography</td><td>Real lanes/localities near Vishwanath Gali, Varanasi old city — used for a dense, realistic layout</td></tr>
            <tr><td>Earthquake, zones, sensor readings</td><td>Entirely fictional — created for this demo, not a real event</td></tr>
            <tr><td>Priority model</td><td>Linear regression trained on 300 synthetic samples (see /ml). Test R² {MODEL_META.test_r2}, MAE {MODEL_META.test_mae} points</td></tr>
            <tr><td>Training data</td><td>{TRAINED_ON}</td></tr>
          </tbody>
        </table>
      </details>
    </footer>
  );
}
