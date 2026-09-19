import { MapContainer, TileLayer, Marker, Rectangle, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { ZONES, NODES_FIXED, EPICENTER, ASSETS } from "../data/scenario.js";
import { colorForNodeStatus } from "../utils/colors.js";

const CENTER = [EPICENTER.lat, EPICENTER.lng];
const OPS_BASE = NODES_FIXED.find((n) => n.id === "ops-base");
const HOSPITAL = NODES_FIXED.find((n) => n.id === "hospital");

function zonePinIcon(zone, runtime, selected) {
  let color = "#9AA0A8"; // unsurveyed
  if (runtime.surveyed && !runtime.scored) color = "#1B2A4A"; // surveyed, awaiting model
  if (runtime.scored) color = colorForNodeStatus(runtime.tier);

  const html = `
    <div class="node-pin${selected ? " selected" : ""}" style="--pin-color:${color}; width:26px; height:26px;">
      <span>${zone.code}</span>
    </div>`;
  return L.divIcon({ html, className: "node-pin-wrap", iconSize: [26, 26], iconAnchor: [13, 13] });
}

function fixedPinIcon(node, size = 28) {
  const html = `
    <div class="node-pin fixed-pin" style="--pin-color:#1B2A4A; width:${size}px; height:${size}px;">
      <span>${node.code}</span>
    </div>`;
  return L.divIcon({ html, className: "node-pin-wrap", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

const ASSET_COLOR = {
  standby: "#9AA0A8",
  airborne: "#1B2A4A",
  enroute: "#B9821F",
  onsite: "#3F7D58",
  monitoring: "#7A5C1E",
  reserve: "#9AA0A8"
};

function assetIcon(asset, runtime) {
  const color = ASSET_COLOR[runtime.status] || "#9AA0A8";
  const shortCode = asset.id.replace("-", "");
  const html = `<div class="asset-pin" style="--pin-color:${color}"><span>${shortCode}</span></div>`;
  return L.divIcon({ html, className: "node-pin-wrap", iconSize: [22, 22], iconAnchor: [11, 11] });
}

function epicenterIcon() {
  const html = `<div class="epicenter-pin">&times;</div>`;
  return L.divIcon({ html, className: "node-pin-wrap", iconSize: [22, 22], iconAnchor: [11, 11] });
}

function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function MapView({ scenario }) {
  const { state, grid, select } = scenario;

  return (
    <div className="map-wrap">
      <MapContainer center={CENTER} zoom={16} scrollWheelZoom={true} className="leaflet-container-full">
        <ResizeFix />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {grid.cells.map((cell) => {
          const revealed = !!state.revealedCells[cell.id];
          return (
            <Rectangle
              key={cell.id}
              bounds={cell.bounds}
              pathOptions={{
                stroke: true,
                color: "#0F1317",
                weight: 0.5,
                opacity: revealed ? 0 : 0.25,
                fillColor: "#12161A",
                fillOpacity: revealed ? 0 : 0.5
              }}
              interactive={false}
            />
          );
        })}

        <Marker position={[EPICENTER.lat, EPICENTER.lng]} icon={epicenterIcon()} />
        <Marker position={[OPS_BASE.lat, OPS_BASE.lng]} icon={fixedPinIcon(OPS_BASE, 30)} />
        <Marker position={[HOSPITAL.lat, HOSPITAL.lng]} icon={fixedPinIcon(HOSPITAL, 24)} />

        {ZONES.map((zone) => (
          <Marker
            key={zone.id}
            position={[zone.lat, zone.lng]}
            icon={zonePinIcon(zone, state.zones[zone.id], state.selectedId === zone.id)}
            eventHandlers={{ click: () => select(zone.id) }}
          />
        ))}

        {ASSETS.map((asset) => (
          <Marker
            key={asset.id}
            position={[state.assets[asset.id].lat, state.assets[asset.id].lng]}
            icon={assetIcon(asset, state.assets[asset.id])}
          />
        ))}
      </MapContainer>

      <div className="map-legend">
        <span><i style={{ background: "#B3392C" }} />Critical</span>
        <span><i style={{ background: "#B9821F" }} />High</span>
        <span><i style={{ background: "#3F7D58" }} />Low</span>
        <span><i style={{ background: "#1B2A4A" }} />Surveyed</span>
        <span><i style={{ background: "#9AA0A8" }} />Unsurveyed</span>
      </div>
      <div className="map-attrib-note">Map data © OpenStreetMap contributors — fictional exercise, not a real event</div>
    </div>
  );
}
