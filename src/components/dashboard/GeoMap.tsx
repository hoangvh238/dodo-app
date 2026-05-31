"use client";
import dynamic from "next/dynamic";
import type { GeoPoint } from "@/types/analytics";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#080812" }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading map…</p>
      </div>
    </div>
  ),
});

export default function GeoMap({ points }: { points: GeoPoint[] }) {
  return <MapInner points={points} />;
}
