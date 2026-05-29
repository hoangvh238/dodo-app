"use client";
import dynamic from "next/dynamic";
import type { GeoPoint } from "@/types/analytics";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-bg-card">
      <p className="text-slate-400 text-sm animate-pulse">Loading map…</p>
    </div>
  ),
});

interface Props {
  points: GeoPoint[];
}

export default function GeoMap({ points }: Props) {
  return <MapInner points={points} />;
}
