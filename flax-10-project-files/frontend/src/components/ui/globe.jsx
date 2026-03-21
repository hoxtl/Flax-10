<<<<<<< HEAD
/**
 * Decorative globe component.
 */

import { GlobeStarfield } from "./globe/GlobeStarfield";
import { globeStyle, keyframes } from "./globe/globeData";

export default function Globe() {
  return (
    <>
      <style>{keyframes}</style>
      <div className="flex items-center justify-center h-screen">
        <div className="relative" style={globeStyle}>
          <GlobeStarfield />
=======
import React from "react";

export default function Globe() {
  const globeStyle = {
    width: "235px",
    height: "235px",
    borderRadius: "9999px",
    overflow: "hidden",
    boxShadow:
      "0 0 20px rgba(255,255,255,0.2),-5px 0 8px #c3f4ff inset,15px 2px 25px #000 inset,-24px -2px 34px #c3f4ff99 inset,250px 0 44px #00000066 inset,150px 0 38px #000000aa inset",
    backgroundImage: "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/globe.jpeg')",
    backgroundSize: "cover",
    backgroundPosition: "left",
    animation: "earthRotate 30s linear infinite",
  };

  return (
    <>
      <style>
        {`
          @keyframes earthRotate {
            0% { background-position: 0 0; }
            100% { background-position: 400px 0; }
          }
          @keyframes twinkling { 0%,100% { opacity:0.1; } 50% { opacity:1; } }
          @keyframes twinkling-slow { 0%,100% { opacity:0.1; } 50% { opacity:1; } }
          @keyframes twinkling-long { 0%,100% { opacity:0.1; } 50% { opacity:1; } }
          @keyframes twinkling-fast { 0%,100% { opacity:0.1; } 50% { opacity:1; } }
        `}
      </style>
      <div className="flex items-center justify-center h-screen">
        <div
          className="relative"
          style={globeStyle}
        >
          <div
            className="absolute left-[-20px] w-1 h-1 bg-white rounded-full"
            style={{ animation: "twinkling 3s infinite" }}
          />
          <div
            className="absolute left-[-40px] top-[30px] w-1 h-1 bg-white rounded-full"
            style={{ animation: "twinkling-slow 2s infinite" }}
          />
          <div
            className="absolute left-[350px] top-[90px] w-1 h-1 bg-white rounded-full"
            style={{ animation: "twinkling-long 4s infinite" }}
          />
          <div
            className="absolute left-[200px] top-[290px] w-1 h-1 bg-white rounded-full"
            style={{ animation: "twinkling 3s infinite" }}
          />
          <div
            className="absolute left-[50px] top-[270px] w-1 h-1 bg-white rounded-full"
            style={{ animation: "twinkling-fast 1.5s infinite" }}
          />
          <div
            className="absolute left-[250px] top-[-50px] w-1 h-1 bg-white rounded-full"
            style={{ animation: "twinkling-long 4s infinite" }}
          />
          <div
            className="absolute left-[290px] top-[60px] w-1 h-1 bg-white rounded-full"
            style={{ animation: "twinkling-slow 2s infinite" }}
          />
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        </div>
      </div>
    </>
  );
}
