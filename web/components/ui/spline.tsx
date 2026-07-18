"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <SplineLoader />
});

function SplineLoader() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[300px]">
      <span className="loader w-10 h-10 border-4 border-[#A855F7]/20 border-t-[#A855F7] rounded-full animate-spin"></span>
    </div>
  );
}

interface SplineSceneProps {
  scene: string;
  className?: string;
  onLoad?: (spline: any) => void;
}

export function SplineScene({ scene, className, onLoad }: SplineSceneProps) {
  return (
    <div className={className}>
      <Suspense fallback={<SplineLoader />}>
        <Spline scene={scene} onLoad={onLoad} />
      </Suspense>
    </div>
  );
}
