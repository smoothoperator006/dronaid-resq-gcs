/**
 * SCENARIO DATA — fictional exercise
 * -----------------------------------
 * This is a hypothetical training scenario, NOT a real event. It borrows
 * the real, tightly-packed lane geography of Varanasi's old city (near
 * Kashi Vishwanath temple) because that density is exactly the kind of
 * environment DronAid-ResQ is built for — narrow lanes vehicles can't
 * enter, dense population, short distances between very different
 * damage levels. Zone/lane names are real localities in that area; the
 * earthquake and every reading below is invented for this demo.
 *
 * All population/damage figures are synthetic. The priority score for
 * each zone is computed live in the browser by a small linear model
 * trained offline on a synthetic dataset (see /ml in the repo root) —
 * nothing here is a hand-typed "fake AI" number.
 */

export const EVENT = {
  name: "Exercise Kashi-1 (fictional)",
  place: "Old City lanes near Vishwanath Gali, Varanasi",
  fact: "Simulated M5.2 tremor. All damage readings, population figures and priority scores on this screen are synthetic — created for this demo, not a real incident."
};

export const EPICENTER = { lat: 25.3108, lng: 83.0100, name: "Epicenter (simulated)" };

export const NODES_FIXED = [
  {
    id: "ops-base",
    kind: "base",
    code: "OB",
    name: "Ops Base — Municipal Ground",
    lat: 25.30409,
    lng: 83.00935,
    note: "Staging point for the DronAid-ResQ swarm and the offline edge-compute unit, ~750m from the epicenter."
  },
  {
    id: "hospital",
    kind: "hospital",
    code: "H",
    name: "Kabir Chaura Hospital",
    lat: 25.31558,
    lng: 83.00630,
    note: "Nearest major government hospital, ~650m from the epicenter. Receiving point for casualties."
  }
];

/**
 * The 8 candidate relief zones. `distance_from_epicenter_m` and the raw
 * sensor features are what the priority model actually consumes —
 * everything else here is display-only.
 */
export const ZONES = [
  {
    id: "vishwanath-gali",
    name: "Vishwanath Gali Cluster",
    code: "VG",
    lat: 25.31150, lng: 83.01045,
    population: "~1,850 residents (est.)",
    needs: ["Search & rescue", "Medical"],
    note: "Narrowest lanes in the affected area — no vehicle has ever driven through here.",
    features: { structural_damage: 88, thermal_signal_count: 14, population_density: 480, road_access_score: 15, distance_from_epicenter_m: 90 }
  },
  {
    id: "bangali-tola",
    name: "Bangali Tola Ward",
    code: "BT",
    lat: 25.31197, lng: 83.01224,
    population: "~1,400 residents (est.)",
    needs: ["Search & rescue", "Shelter"],
    note: "Several multi-storey guesthouses in this block; upper floors reported unstable.",
    features: { structural_damage: 79, thermal_signal_count: 11, population_density: 410, road_access_score: 25, distance_from_epicenter_m: 260 }
  },
  {
    id: "kachauri-gali",
    name: "Kachauri Gali Housing",
    code: "KG",
    lat: 25.31021, lng: 83.01372,
    population: "~900 residents (est.)",
    needs: ["Medical", "Water"],
    note: "Mixed residential-commercial block, partial collapse reported at the lane's north end.",
    features: { structural_damage: 55, thermal_signal_count: 6, population_density: 300, road_access_score: 40, distance_from_epicenter_m: 380 }
  },
  {
    id: "chowk-crossing",
    name: "Chowk Crossing Block",
    code: "CC",
    lat: 25.30745, lng: 83.01214,
    population: "~700 residents (est.)",
    needs: ["Shelter"],
    note: "Wider crossing point, moderate damage — one of the few spots a handcart can still get through.",
    features: { structural_damage: 48, thermal_signal_count: 5, population_density: 260, road_access_score: 55, distance_from_epicenter_m: 430 }
  },
  {
    id: "godowlia",
    name: "Godowlia Market Row",
    code: "GM",
    lat: 25.30788, lng: 83.00943,
    population: "~1,100 residents (est.)",
    needs: ["Water", "Food"],
    note: "Market shopfronts damaged; residential floors above mostly intact.",
    features: { structural_damage: 40, thermal_signal_count: 3, population_density: 340, road_access_score: 60, distance_from_epicenter_m: 330 }
  },
  {
    id: "dashashwamedh",
    name: "Dashashwamedh Approach Lane",
    code: "DA",
    lat: 25.30849, lng: 83.00696,
    population: "~500 residents (est.)",
    needs: ["Food"],
    note: "Light structural damage. Foot access confirmed clear.",
    features: { structural_damage: 30, thermal_signal_count: 2, population_density: 220, road_access_score: 70, distance_from_epicenter_m: 400 }
  },
  {
    id: "lahori-tola",
    name: "Lahori Tola Courtyards",
    code: "LT",
    lat: 25.31135, lng: 83.00657,
    population: "~350 residents (est.)",
    needs: ["Monitoring"],
    note: "Minor cracking reported only. Low priority relative to the rest of the sector.",
    features: { structural_damage: 22, thermal_signal_count: 1, population_density: 180, road_access_score: 80, distance_from_epicenter_m: 350 }
  },
  {
    id: "thatheri-bazar",
    name: "Thatheri Bazar Block",
    code: "TB",
    lat: 25.31286, lng: 83.00808,
    population: "~260 residents (est.)",
    needs: ["Monitoring"],
    note: "Outer edge of the affected sector, no significant damage detected.",
    features: { structural_damage: 15, thermal_signal_count: 0, population_density: 150, road_access_score: 85, distance_from_epicenter_m: 300 }
  }
];

export const ASSETS = [
  { id: "SD-1", type: "scout", label: "Scout Drone", battery: 91 },
  { id: "SD-2", type: "scout", label: "Scout Drone", battery: 85 },
  { id: "PD-1", type: "payload", label: "Payload Drone", battery: 94 },
  { id: "PD-2", type: "payload", label: "Payload Drone", battery: 89 },
  { id: "GR-1", type: "rover", label: "Ground Rover", battery: 76 },
  { id: "GR-2", type: "rover", label: "Ground Rover", battery: 82 },
  { id: "GR-3", type: "rover", label: "Ground Rover", battery: 68 }
];

export function tierFor(score) {
  if (score >= 75) return "critical";
  if (score >= 45) return "high";
  return "low";
}

export const STEP_DEFS = [
  { step: "I", label: "Deploy swarm & map (SLAM sweep)" },
  { step: "II", label: "Collect & fuse field data" },
  { step: "III", label: "Run priority model (edge)" },
  { step: "IV", label: "Rank relief zones" },
  { step: "V", label: "Allocate missions" }
];
