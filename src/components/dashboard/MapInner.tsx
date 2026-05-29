"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoPoint } from "@/types/analytics";

interface Props {
  points: GeoPoint[];
}

const MAX_RADIUS = 28;
const MIN_RADIUS = 6;

function markerRadius(count: number, max: number) {
  return MIN_RADIUS + ((count / max) * (MAX_RADIUS - MIN_RADIUS));
}

function markerColor(count: number, max: number) {
  const pct = count / max;
  if (pct > 0.7) return "#EF4444";
  if (pct > 0.4) return "#F59E0B";
  return "#3B82F6";
}

type LeafletContainer = HTMLDivElement & { _leaflet_id?: number };

export default function MapInner({ points }: Props) {
  const containerRef = useRef<LeafletContainer>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any stale Leaflet instance left on this DOM node (Strict Mode / HMR)
    delete container._leaflet_id;

    const maxCount = points[0]?.count ?? 1;

    const map = L.map(container, {
      center: [20, 10],
      zoom: 2,
      minZoom: 2,
      maxZoom: 8,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
      }
    ).addTo(map);

    points.forEach((pt) => {
      const c = markerColor(pt.count, maxCount);
      L.circleMarker([pt.lat, pt.lon], {
        radius: markerRadius(pt.count, maxCount),
        color: c,
        fillColor: c,
        fillOpacity: 0.65,
        weight: 1,
        opacity: 0.9,
      })
        .bindTooltip(
          `<span style="font-size:12px;font-weight:500">${pt.city}, ${pt.country}</span>` +
          `<br><span style="font-size:11px;color:#94a3b8">${pt.count} session${pt.count > 1 ? "s" : ""}</span>`,
          { sticky: true }
        )
        .addTo(map);
    });

    return () => {
      map.remove();
    };
  }, [points]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", background: "#1e293b" }}
      className="z-0"
    />
  );
}
