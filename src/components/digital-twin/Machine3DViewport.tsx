"use client";

import React, {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type {
  DigitalTwinMachineProfile,
  DigitalTwinSubAssembly,
  SeverityLevel,
} from "@/types/telemetry";
import { StatusBadge } from "@/components/ui/IndustrialPrimitives";

interface Machine3DViewportProps {
  machine: DigitalTwinMachineProfile;
  selectedSubAssemblyId: string | null;
  onSelectSubAssembly: (id: string | null) => void;
}

interface CameraOrbitState {
  azimuth: number; // radians
  polar: number; // radians
  distance: number; // units
}

const DEFAULT_CAMERA_ORBIT: CameraOrbitState = {
  azimuth: 0.62,
  polar: 1.12,
  distance: 6.4,
};

const STATUS_HEX: Record<SeverityLevel, string> = {
  nominal: "#10B981",
  warning: "#F59E0B",
  critical: "#EF4444",
};

/**
 * Error boundary to catch any runtime WebGL context creation or shader errors
 * and fall back to the accessible 2D technical blueprint view.
 */
class WebGLErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Updates the Three.js perspective camera smoothly toward the target spherical coordinates.
 */
function CameraRigController({
  orbit,
  reducedMotion,
}: {
  orbit: CameraOrbitState;
  reducedMotion: boolean;
}) {
  const { camera } = useThree();
  const currentVec = useRef(new THREE.Vector3(3.8, 2.6, 4.6));

  useFrame((_, delta) => {
    const sinPolar = Math.sin(orbit.polar);
    const targetX = orbit.distance * sinPolar * Math.sin(orbit.azimuth);
    const targetY = orbit.distance * Math.cos(orbit.polar);
    const targetZ = orbit.distance * sinPolar * Math.cos(orbit.azimuth);

    const targetVec = new THREE.Vector3(targetX, targetY, targetZ);
    if (reducedMotion) {
      currentVec.current.copy(targetVec);
    } else {
      currentVec.current.lerp(targetVec, Math.min(1, delta * 9));
    }

    camera.position.copy(currentVec.current);
    camera.lookAt(0, 0.05, 0);
  });

  return null;
}

/**
 * 3D Industrial Rotating Motor / Turbine-Generator Assembly Mesh
 */
function IndustrialRotatingMachineMesh({
  machine,
  selectedSubAssemblyId,
  onSelectSubAssembly,
  wireframe,
  exploded,
  animateRotation,
}: {
  machine: DigitalTwinMachineProfile;
  selectedSubAssemblyId: string | null;
  onSelectSubAssembly: (id: string | null) => void;
  wireframe: boolean;
  exploded: boolean;
  animateRotation: boolean;
}) {
  const rotorGroupRef = useRef<THREE.Group>(null);
  const deGroupRef = useRef<THREE.Group>(null);
  const ndeGroupRef = useRef<THREE.Group>(null);

  // Map sub-assembly statuses
  const statusMap = useMemo(() => {
    const map: Record<string, SeverityLevel> = {
      "de-bearing": "nominal",
      "stator-core": "nominal",
      "rotor-shaft": "nominal",
      "nde-bearing": "nominal",
    };
    for (const sub of machine.subAssemblies) {
      map[sub.id] = sub.status;
    }
    return map;
  }, [machine.subAssemblies]);

  // Precompute cooling fin angles (18 radial fins around stator)
  const finAngles = useMemo(
    () => Array.from({ length: 18 }, (_, i) => (i / 18) * Math.PI * 2),
    []
  );

  // Precompute flange bolt angles (12 bolts)
  const boltAngles = useMemo(
    () => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2),
    []
  );

  // Precompute rotor impeller blades (10 blades)
  const bladeAngles = useMemo(
    () => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2),
    []
  );

  useFrame((_, delta) => {
    // Rotate shaft & impeller proportional to machine RPM
    if (rotorGroupRef.current && animateRotation && machine.rpm > 0) {
      const normalizedSpeed = Math.min(8.5, Math.max(1.2, machine.rpm / 1200));
      rotorGroupRef.current.rotation.x += delta * normalizedSpeed;
    }

    // Smooth axial offset when Exploded View is toggled
    const targetOffset = exploded ? 0.65 : 0;
    if (deGroupRef.current) {
      deGroupRef.current.position.x = THREE.MathUtils.lerp(
        deGroupRef.current.position.x,
        targetOffset,
        Math.min(1, delta * 8)
      );
    }
    if (ndeGroupRef.current) {
      ndeGroupRef.current.position.x = THREE.MathUtils.lerp(
        ndeGroupRef.current.position.x,
        -targetOffset,
        Math.min(1, delta * 8)
      );
    }
  });

  const deSelected = selectedSubAssemblyId === "de-bearing";
  const statorSelected = selectedSubAssemblyId === "stator-core";
  const rotorSelected = selectedSubAssemblyId === "rotor-shaft";
  const ndeSelected = selectedSubAssemblyId === "nde-bearing";

  return (
    <group position={[0, -0.1, 0]}>
      {/* ============================================================
          1. HEAVY INDUSTRIAL BASEPLATE & MOUNTING SKIDS
         ============================================================ */}
      <group position={[0, -1.18, 0]}>
        {/* Main machined bedplate */}
        <mesh receiveShadow castShadow position={[0, 0, 0]}>
          <boxGeometry args={[4.4, 0.18, 2.35]} />
          <meshStandardMaterial
            color="#475569"
            metalness={0.5}
            roughness={0.45}
            wireframe={wireframe}
          />
        </mesh>

        {/* Front & Rear Structural Skid Rails */}
        {[-0.88, 0.88].map((zPos, i) => (
          <mesh key={i} receiveShadow castShadow position={[0, 0.14, zPos]}>
            <boxGeometry args={[3.9, 0.14, 0.32]} />
            <meshStandardMaterial
              color="#64748b"
              metalness={0.55}
              roughness={0.38}
              wireframe={wireframe}
            />
          </mesh>
        ))}

        {/* 4 Stator Pedestal Mounting Feet + Anchor Bolts */}
        {[
          [-0.95, -0.78],
          [0.95, -0.78],
          [-0.95, 0.78],
          [0.95, 0.78],
        ].map(([xPos, zPos], idx) => (
          <group key={idx} position={[xPos, 0.32, zPos]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.52, 0.32, 0.36]} />
              <meshStandardMaterial
                color="#5a6b82"
                metalness={0.52}
                roughness={0.4}
                wireframe={wireframe}
              />
            </mesh>
            <mesh position={[0, 0.19, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.08, 6]} />
              <meshStandardMaterial
                color="#cbd5e1"
                metalness={0.7}
                roughness={0.25}
                wireframe={wireframe}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* ============================================================
          2. STATOR FRAME, RADIAL COOLING FINS & HV TERMINAL BOX (ASM-02)
         ============================================================ */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelectSubAssembly(statorSelected ? null : "stator-core");
        }}
      >
        {/* Main Cylindrical Stator Barrel */}
        <mesh
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.96, 0.96, 2.25, 36]} />
          <meshStandardMaterial
            color={statorSelected ? "#7dd3fc" : "#5b6d86"}
            metalness={0.55}
            roughness={0.36}
            emissive={STATUS_HEX[statusMap["stator-core"]]}
            emissiveIntensity={
              statorSelected
                ? 0.22
                : statusMap["stator-core"] !== "nominal"
                ? 0.1
                : 0.02
            }
            wireframe={wireframe}
          />
        </mesh>

        {/* 18 Circumferential Radial Cooling Fins */}
        {finAngles.map((angle, idx) => (
          <group key={idx} rotation={[angle, 0, 0]}>
            <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.92, 0.16, 0.038]} />
              <meshStandardMaterial
                color="#6e829c"
                metalness={0.58}
                roughness={0.34}
                wireframe={wireframe}
              />
            </mesh>
          </group>
        ))}

        {/* Stator Front & Rear Structural Collar Flanges */}
        {[-1.08, 1.08].map((xPos, idx) => (
          <group key={idx} position={[xPos, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
              <cylinderGeometry args={[1.09, 1.09, 0.14, 36]} />
              <meshStandardMaterial
                color="#7c8ea6"
                metalness={0.6}
                roughness={0.32}
                wireframe={wireframe}
              />
            </mesh>
            {/* Status Telemetry Ring on Stator Flange */}
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[1.095, 0.018, 12, 48]} />
              <meshStandardMaterial
                color={STATUS_HEX[statusMap["stator-core"]]}
                emissive={STATUS_HEX[statusMap["stator-core"]]}
                emissiveIntensity={0.65}
              />
            </mesh>
          </group>
        ))}

        {/* Top High-Voltage Terminal Junction Box & Armored Conduit */}
        <group position={[0.15, 1.18, 0.55]} rotation={[0.35, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.68, 0.42, 0.52]} />
            <meshStandardMaterial
              color="#4f6078"
              metalness={0.5}
              roughness={0.4}
              wireframe={wireframe}
            />
          </mesh>
          {/* Junction Box Cover Plate */}
          <mesh position={[0, 0.23, 0]} castShadow>
            <boxGeometry args={[0.72, 0.05, 0.56]} />
            <meshStandardMaterial
              color="#8596ad"
              metalness={0.62}
              roughness={0.3}
              wireframe={wireframe}
            />
          </mesh>
          {/* Cyan Telemetry Status Beacon on Junction Box */}
          <mesh position={[0.24, 0.28, 0.16]}>
            <cylinderGeometry args={[0.04, 0.04, 0.06, 16]} />
            <meshStandardMaterial
              color="#00E5FF"
              emissive="#00E5FF"
              emissiveIntensity={0.9}
            />
          </mesh>
        </group>

        {/* Top Lifting Eye-Lug */}
        <mesh position={[-0.25, 1.24, 0]} rotation={[0, 0, 0]} castShadow>
          <torusGeometry args={[0.14, 0.04, 12, 24]} />
          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.65}
            roughness={0.3}
            wireframe={wireframe}
          />
        </mesh>
      </group>

      {/* ============================================================
          3. DRIVE-END (DE) BEARING HOUSING & SENSOR POD (ASM-01)
         ============================================================ */}
      <group
        ref={deGroupRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSubAssembly(deSelected ? null : "de-bearing");
        }}
      >
        {/* DE Cast End-Bell Shield */}
        <mesh
          position={[1.32, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.78, 0.96, 0.36, 32]} />
          <meshStandardMaterial
            color={deSelected ? "#7dd3fc" : "#687b94"}
            metalness={0.58}
            roughness={0.34}
            emissive={STATUS_HEX[statusMap["de-bearing"]]}
            emissiveIntensity={
              deSelected
                ? 0.28
                : statusMap["de-bearing"] === "critical"
                ? 0.22
                : statusMap["de-bearing"] === "warning"
                ? 0.14
                : 0.03
            }
            wireframe={wireframe}
          />
        </mesh>

        {/* DE Outer Bearing Cartridge Cap */}
        <mesh
          position={[1.62, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.48, 0.56, 0.28, 28]} />
          <meshStandardMaterial
            color="#8596ad"
            metalness={0.64}
            roughness={0.28}
            wireframe={wireframe}
          />
        </mesh>

        {/* DE Bearing Status Indicator Ring */}
        <mesh position={[1.52, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.62, 0.026, 14, 40]} />
          <meshStandardMaterial
            color={STATUS_HEX[statusMap["de-bearing"]]}
            emissive={STATUS_HEX[statusMap["de-bearing"]]}
            emissiveIntensity={0.85}
          />
        </mesh>

        {/* Circumferential Bolt Heads on DE Bearing Housing */}
        {boltAngles.map((angle, idx) => (
          <mesh
            key={idx}
            position={[
              1.48,
              Math.cos(angle) * 0.72,
              Math.sin(angle) * 0.72,
            ]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.032, 0.032, 0.06, 6]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.7}
              roughness={0.25}
            />
          </mesh>
        ))}

        {/* Triaxial Vibration & RTD Sensor Pod mounted on DE Bearing */}
        <group position={[1.62, 0.54, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.18, 0.22, 0.18]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial
              color={STATUS_HEX[statusMap["de-bearing"]]}
              emissive={STATUS_HEX[statusMap["de-bearing"]]}
              emissiveIntensity={1.0}
            />
          </mesh>
        </group>
      </group>

      {/* ============================================================
          4. ROTATING MAIN SHAFT, DISC COUPLING & ROTOR STAGE (ASM-03)
         ============================================================ */}
      <group
        ref={rotorGroupRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSubAssembly(rotorSelected ? null : "rotor-shaft");
        }}
      >
        {/* Main Forged Steel Drive Shaft extending through DE */}
        <mesh
          position={[0.45, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.24, 0.24, 3.85, 28]} />
          <meshStandardMaterial
            color={rotorSelected ? "#bae6fd" : "#b8c7d9"}
            metalness={0.68}
            roughness={0.24}
            emissive={STATUS_HEX[statusMap["rotor-shaft"]]}
            emissiveIntensity={rotorSelected ? 0.25 : 0.04}
            wireframe={wireframe}
          />
        </mesh>

        {/* Machined Shaft Keyway Bar (makes shaft rotation clearly visible) */}
        <mesh position={[2.05, 0.24, 0]} castShadow>
          <boxGeometry args={[0.62, 0.06, 0.07]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00E5FF"
            emissiveIntensity={0.55}
          />
        </mesh>

        {/* Drive-End Flanged Flexible Disc Coupling */}
        <group position={[2.28, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.46, 0.46, 0.16, 28]} />
            <meshStandardMaterial
              color="#94a3b8"
              metalness={0.65}
              roughness={0.28}
              wireframe={wireframe}
            />
          </mesh>
          {/* Coupling Hub */}
          <mesh position={[0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.32, 0.38, 0.22, 24]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.7}
              roughness={0.22}
              wireframe={wireframe}
            />
          </mesh>
          {/* Radial Blades / Ribs on Coupling */}
          {bladeAngles.map((angle, idx) => (
            <group key={idx} rotation={[angle, 0, 0]}>
              <mesh position={[0, 0.34, 0]}>
                <boxGeometry args={[0.18, 0.18, 0.04]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  metalness={0.6}
                  roughness={0.3}
                />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* ============================================================
          5. NON-DRIVE-END (NDE) THRUST BEARING & COOLING COWL (ASM-04)
         ============================================================ */}
      <group
        ref={ndeGroupRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSubAssembly(ndeSelected ? null : "nde-bearing");
        }}
      >
        {/* NDE Bearing Housing Shield */}
        <mesh
          position={[-1.32, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.92, 0.78, 0.38, 32]} />
          <meshStandardMaterial
            color={ndeSelected ? "#7dd3fc" : "#64748b"}
            metalness={0.56}
            roughness={0.36}
            emissive={STATUS_HEX[statusMap["nde-bearing"]]}
            emissiveIntensity={ndeSelected ? 0.25 : 0.03}
            wireframe={wireframe}
          />
        </mesh>

        {/* NDE Fan Shroud / Rear Acoustic Cowl */}
        <mesh
          position={[-1.68, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.74, 0.84, 0.42, 28]} />
          <meshStandardMaterial
            color="#52637a"
            metalness={0.54}
            roughness={0.4}
            wireframe={wireframe}
          />
        </mesh>

        {/* NDE Status Telemetry Ring */}
        <mesh position={[-1.5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.8, 0.022, 12, 40]} />
          <meshStandardMaterial
            color={STATUS_HEX[statusMap["nde-bearing"]]}
            emissive={STATUS_HEX[statusMap["nde-bearing"]]}
            emissiveIntensity={0.75}
          />
        </mesh>

        {/* NDE Sensor Pod */}
        <group position={[-1.48, 0.82, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.16, 0.18, 0.16]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial
              color={STATUS_HEX[statusMap["nde-bearing"]]}
              emissive={STATUS_HEX[statusMap["nde-bearing"]]}
              emissiveIntensity={0.95}
            />
          </mesh>
        </group>
      </group>

      {/* ============================================================
          6. CALIBRATED REFERENCE FLOOR GRID
         ============================================================ */}
      <gridHelper
        args={[11, 22, "#00E5FF", "#1E293B"]}
        position={[0, -1.28, 0]}
      />
    </group>
  );
}

/**
 * Accessible 2D Technical Blueprint Fallback when WebGL is unavailable or toggled off.
 */
function TechnicalSchematicFallback({
  machine,
  selectedSubAssemblyId,
  onSelectSubAssembly,
  reasonLabel,
}: {
  machine: DigitalTwinMachineProfile;
  selectedSubAssemblyId: string | null;
  onSelectSubAssembly: (id: string | null) => void;
  reasonLabel: string;
}) {
  return (
    <div
      role="region"
      aria-label={`2D Technical Schematic Fallback for ${machine.machineName}`}
      className="relative flex flex-col justify-between rounded bg-[#070B12] border border-[#1E293B] p-4 min-h-[380px]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] pb-2.5">
        <div className="flex items-center gap-2 font-mono text-xs text-[#00E5FF]">
          <span>[2D CAD SCHEMATIC FALLBACK]</span>
          <span className="text-[#94A3B8]">— {reasonLabel}</span>
        </div>
        <span className="font-mono text-[11px] text-[#94A3B8]">
          ALL SUB-ASSEMBLIES & TELEMETRY REMAIN ACCESSIBLE
        </span>
      </div>

      {/* Interactive SVG Blueprint of the Industrial Rotating Machine */}
      <div className="my-4 flex items-center justify-center overflow-x-auto">
        <svg
          viewBox="0 0 720 240"
          className="w-full max-w-[680px] h-auto select-none"
          role="img"
          aria-label={`2D cross-section schematic of ${machine.machineName}`}
        >
          {/* Background Grid Lines */}
          <g stroke="#1E293B" strokeWidth="1">
            <line x1="20" y1="120" x2="700" y2="120" strokeDasharray="6 4" />
            <line x1="360" y1="20" x2="360" y2="220" strokeDasharray="4 4" />
          </g>

          {/* ASM-04: NDE Bearing & Shroud (Left) */}
          <g
            className="cursor-pointer"
            onClick={() =>
              onSelectSubAssembly(
                selectedSubAssemblyId === "nde-bearing" ? null : "nde-bearing"
              )
            }
          >
            <rect
              x="95"
              y="64"
              width="95"
              height="112"
              rx="4"
              fill="#131C2E"
              stroke={
                selectedSubAssemblyId === "nde-bearing" ? "#00E5FF" : "#64748B"
              }
              strokeWidth="2"
            />
            <text
              x="142"
              y="115"
              textAnchor="middle"
              className="fill-[#F1F5F9] font-mono text-[10px]"
            >
              ASM-04
            </text>
            <text
              x="142"
              y="130"
              textAnchor="middle"
              className="fill-[#94A3B8] font-mono text-[9px]"
            >
              NDE BEARING
            </text>
          </g>

          {/* ASM-02: Main Stator Housing (Center) */}
          <g
            className="cursor-pointer"
            onClick={() =>
              onSelectSubAssembly(
                selectedSubAssemblyId === "stator-core" ? null : "stator-core"
              )
            }
          >
            <rect
              x="195"
              y="42"
              width="250"
              height="156"
              rx="6"
              fill="#0D131F"
              stroke={
                selectedSubAssemblyId === "stator-core" ? "#00E5FF" : "#38BDF8"
              }
              strokeWidth="2"
            />
            {/* Cooling Fin Lines */}
            {[62, 82, 102, 138, 158, 178].map((yPos) => (
              <line
                key={yPos}
                x1="210"
                y1={yPos}
                x2="430"
                y2={yPos}
                stroke="#1E293B"
                strokeWidth="2"
              />
            ))}
            <text
              x="320"
              y="115"
              textAnchor="middle"
              className="fill-[#F1F5F9] font-mono text-[11px] font-semibold"
            >
              ASM-02 // STATOR CORE
            </text>
            <text
              x="320"
              y="132"
              textAnchor="middle"
              className="fill-[#00E5FF] font-mono text-[10px]"
            >
              {machine.machineId}
            </text>
          </g>

          {/* ASM-01: DE Bearing Housing (Right) */}
          <g
            className="cursor-pointer"
            onClick={() =>
              onSelectSubAssembly(
                selectedSubAssemblyId === "de-bearing" ? null : "de-bearing"
              )
            }
          >
            <rect
              x="450"
              y="64"
              width="95"
              height="112"
              rx="4"
              fill="#131C2E"
              stroke={
                machine.operatingStatus === "critical"
                  ? "#EF4444"
                  : machine.operatingStatus === "warning"
                  ? "#F59E0B"
                  : "#10B981"
              }
              strokeWidth="2.5"
            />
            <text
              x="497"
              y="115"
              textAnchor="middle"
              className="fill-[#F1F5F9] font-mono text-[10px]"
            >
              ASM-01
            </text>
            <text
              x="497"
              y="130"
              textAnchor="middle"
              className="fill-[#F59E0B] font-mono text-[9px]"
            >
              DE BEARING
            </text>
          </g>

          {/* ASM-03: Rotor Shaft & Coupling (Far Right) */}
          <g
            className="cursor-pointer"
            onClick={() =>
              onSelectSubAssembly(
                selectedSubAssemblyId === "rotor-shaft" ? null : "rotor-shaft"
              )
            }
          >
            <rect
              x="548"
              y="98"
              width="92"
              height="44"
              rx="3"
              fill="#1E293B"
              stroke={
                selectedSubAssemblyId === "rotor-shaft" ? "#00E5FF" : "#94A3B8"
              }
              strokeWidth="2"
            />
            <text
              x="594"
              y="124"
              textAnchor="middle"
              className="fill-[#00E5FF] font-mono text-[10px]"
            >
              ASM-03 ROTOR
            </text>
          </g>

          {/* Baseplate */}
          <rect
            x="80"
            y="202"
            width="500"
            height="18"
            rx="2"
            fill="#1E293B"
            stroke="#475569"
          />
        </svg>
      </div>

      {/* Sub-Assembly Selection Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1E293B]">
        {machine.subAssemblies.map((sub: DigitalTwinSubAssembly) => {
          const isSelected = selectedSubAssemblyId === sub.id;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() =>
                onSelectSubAssembly(isSelected ? null : sub.id)
              }
              aria-pressed={isSelected}
              className={`rounded p-2 text-left font-mono text-[11px] border transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                isSelected
                  ? "bg-[#131C2E] border-[#00E5FF] text-[#F1F5F9]"
                  : "bg-[#0D131F] border-[#1E293B] text-[#94A3B8] hover:text-[#F1F5F9]"
              }`}
            >
              <div className="text-[10px] text-[#00E5FF]">{sub.code}</div>
              <div className="truncate font-sans text-xs font-medium text-[#F1F5F9]">
                {sub.name}
              </div>
              <div className="mt-1 text-[10px] tabular-nums">
                {sub.temperatureC.toFixed(1)}°C • {sub.vibrationRms.toFixed(1)} mm/s
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Machine3DViewport({
  machine,
  selectedSubAssemblyId,
  onSelectSubAssembly,
}: Machine3DViewportProps) {
  const [orbit, setOrbit] = useState<CameraOrbitState>(DEFAULT_CAMERA_ORBIT);
  const [wireframe, setWireframe] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  );
  const [webglAvailable] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        testCanvas.getContext("webgl2") ||
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl");
      return Boolean(gl);
    } catch {
      return false;
    }
  });
  const [forceFallbackMode, setForceFallbackMode] = useState(false);

  // Pointer drag state for smooth mouse/touch orbit rotation
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleMotionChange);
    return () => mediaQuery.removeEventListener("change", handleMotionChange);
  }, []);

  const handleResetView = () => {
    setOrbit(DEFAULT_CAMERA_ORBIT);
    setWireframe(false);
    setExploded(false);
    onSelectSubAssembly(null);
  };

  const adjustZoom = (deltaDistance: number) => {
    setOrbit((prev) => ({
      ...prev,
      distance: Math.min(10.5, Math.max(3.6, prev.distance + deltaDistance)),
    }));
  };

  const adjustRotation = (deltaAzimuth: number, deltaPolar = 0) => {
    setOrbit((prev) => ({
      ...prev,
      azimuth: prev.azimuth + deltaAzimuth,
      polar: Math.min(1.48, Math.max(0.35, prev.polar + deltaPolar)),
    }));
  };

  const selectedSub =
    machine.subAssemblies.find((s) => s.id === selectedSubAssemblyId) ?? null;

  const showFallback = !webglAvailable || forceFallbackMode;

  return (
    <div className="space-y-3">
      {/* Top Viewport Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-[#070B12] border border-[#1E293B] px-3 py-2">
        {/* Camera Preset & Rotation Controls */}
        <div
          role="toolbar"
          aria-label="3D Digital Twin Camera and Mesh Controls"
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            onClick={handleResetView}
            className="rounded bg-[#131C2E] border border-[#00E5FF]/50 px-2.5 py-1 font-mono text-[11px] font-medium text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#070B12] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
          >
            RESET VIEW
          </button>

          <button
            type="button"
            onClick={() => adjustRotation(-0.35, 0)}
            aria-label="Rotate model left"
            className="rounded bg-[#0D131F] border border-[#1E293B] px-2 py-1 font-mono text-[11px] text-[#94A3B8] hover:border-[#00E5FF]/50 hover:text-[#F1F5F9] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
          >
            ⟲ ROT L
          </button>

          <button
            type="button"
            onClick={() => adjustRotation(0.35, 0)}
            aria-label="Rotate model right"
            className="rounded bg-[#0D131F] border border-[#1E293B] px-2 py-1 font-mono text-[11px] text-[#94A3B8] hover:border-[#00E5FF]/50 hover:text-[#F1F5F9] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
          >
            ROT R ⟳
          </button>

          <button
            type="button"
            onClick={() => adjustZoom(-0.75)}
            aria-label="Zoom in"
            className="rounded bg-[#0D131F] border border-[#1E293B] px-2 py-1 font-mono text-[11px] text-[#94A3B8] hover:border-[#00E5FF]/50 hover:text-[#F1F5F9] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
          >
            + ZOOM IN
          </button>

          <button
            type="button"
            onClick={() => adjustZoom(0.75)}
            aria-label="Zoom out"
            className="rounded bg-[#0D131F] border border-[#1E293B] px-2 py-1 font-mono text-[11px] text-[#94A3B8] hover:border-[#00E5FF]/50 hover:text-[#F1F5F9] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
          >
            − ZOOM OUT
          </button>

          <button
            type="button"
            onClick={() => setExploded((prev) => !prev)}
            aria-pressed={exploded}
            className={`rounded border px-2.5 py-1 font-mono text-[11px] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
              exploded
                ? "bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF] font-semibold"
                : "bg-[#0D131F] border-[#1E293B] text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            {exploded ? "COLLAPSE MESH" : "EXPLODE ASSEMBLY"}
          </button>

          <button
            type="button"
            onClick={() => setWireframe((prev) => !prev)}
            aria-pressed={wireframe}
            className={`rounded border px-2.5 py-1 font-mono text-[11px] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
              wireframe
                ? "bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF] font-semibold"
                : "bg-[#0D131F] border-[#1E293B] text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            WIREFRAME
          </button>

          <button
            type="button"
            onClick={() => setRotationPaused((prev) => !prev)}
            aria-pressed={rotationPaused}
            className="rounded bg-[#0D131F] border border-[#1E293B] px-2.5 py-1 font-mono text-[11px] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
          >
            {rotationPaused || prefersReducedMotion
              ? "▶ RESUME ROTOR"
              : "⏸ PAUSE ROTOR"}
          </button>
        </div>

        {/* Toggle 3D WebGL vs 2D Schematic Fallback */}
        <button
          type="button"
          onClick={() => setForceFallbackMode((prev) => !prev)}
          aria-pressed={forceFallbackMode}
          className="rounded bg-[#0D131F] border border-[#1E293B] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] hover:border-[#00E5FF]/50 hover:text-[#F1F5F9] focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
        >
          {forceFallbackMode ? "SWITCH TO 3D WEBGL" : "2D FALLBACK MODE"}
        </button>
      </div>

      {/* Main 3D Canvas or Graceful Fallback */}
      {showFallback ? (
        <TechnicalSchematicFallback
          machine={machine}
          selectedSubAssemblyId={selectedSubAssemblyId}
          onSelectSubAssembly={onSelectSubAssembly}
          reasonLabel={
            !webglAvailable
              ? "WebGL Context Unavailable on Device"
              : "User Enabled 2D Blueprint Fallback"
          }
        />
      ) : (
        <WebGLErrorBoundary
          fallback={
            <TechnicalSchematicFallback
              machine={machine}
              selectedSubAssemblyId={selectedSubAssemblyId}
              onSelectSubAssembly={onSelectSubAssembly}
              reasonLabel="WebGL Render Fallback Active"
            />
          }
        >
          <div
            role="application"
            tabIndex={0}
            aria-label={`Interactive 3D Digital Twin of ${machine.machineName}. Use arrow keys or mouse drag to rotate, plus and minus keys or scroll wheel to zoom, R to reset view, or use the toolbar controls above.`}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                adjustRotation(-0.25, 0);
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                adjustRotation(0.25, 0);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                adjustRotation(0, -0.15);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                adjustRotation(0, 0.15);
              } else if (e.key === "+" || e.key === "=") {
                e.preventDefault();
                adjustZoom(-0.5);
              } else if (e.key === "-" || e.key === "_") {
                e.preventDefault();
                adjustZoom(0.5);
              } else if (e.key === "r" || e.key === "R" || e.key === "0") {
                e.preventDefault();
                handleResetView();
              }
            }}
            onPointerDown={(e) => {
              isDraggingRef.current = true;
              lastPointerRef.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerMove={(e) => {
              if (!isDraggingRef.current) return;
              const dx = e.clientX - lastPointerRef.current.x;
              const dy = e.clientY - lastPointerRef.current.y;
              lastPointerRef.current = { x: e.clientX, y: e.clientY };
              setOrbit((prev) => ({
                ...prev,
                azimuth: prev.azimuth - dx * 0.0085,
                polar: Math.min(1.48, Math.max(0.35, prev.polar - dy * 0.0065)),
              }));
            }}
            onPointerUp={() => {
              isDraggingRef.current = false;
            }}
            onPointerLeave={() => {
              isDraggingRef.current = false;
            }}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? 0.42 : -0.42;
              adjustZoom(delta);
            }}
            className="relative h-[340px] sm:h-[420px] lg:h-[440px] w-full overflow-hidden rounded-md bg-gradient-to-b from-[#0B1220] via-[#09101C] to-[#070B12] border border-[#1E293B] cursor-grab active:cursor-grabbing select-none focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
          >
            {/* Responsive Top HUD Overlay */}
            <div className="pointer-events-none absolute top-2.5 inset-x-2.5 z-10 flex flex-wrap items-start justify-between gap-2">
              <div className="rounded bg-[#070B12]/85 backdrop-blur-xs border border-[#1E293B] px-2.5 py-1.5 font-mono text-[11px] space-y-0.5 max-w-full">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#00E5FF] shrink-0" />
                  <span className="font-semibold text-[#F1F5F9] truncate">
                    {machine.machineId} {"//"} 3D STRUCTURAL TWIN
                  </span>
                </div>
                <div className="text-[#94A3B8] tabular-nums text-[10px] sm:text-[11px]">
                  ROTOR: {machine.rpm.toLocaleString()} RPM • TEMP:{" "}
                  {machine.temperatureC.toFixed(1)} °C • VIB:{" "}
                  {machine.vibrationRms.toFixed(1)} mm/s
                </div>
                <div className="hidden sm:block text-[10px] text-[#94A3B8]">
                  DRAG OR ARROW KEYS TO ROTATE • SCROLL TO ZOOM • CLICK ZONE TO INSPECT
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <StatusBadge
                  tone={
                    machine.operatingStatus === "operational"
                      ? "nominal"
                      : machine.operatingStatus === "warning"
                      ? "warning"
                      : machine.operatingStatus === "critical"
                      ? "critical"
                      : "cyan"
                  }
                  pulse={machine.operatingStatus === "critical"}
                  label={`${machine.operatingStatus.toUpperCase()} • ${machine.healthScore.toFixed(
                    1
                  )}% HLTH`}
                />
                <span className="hidden sm:inline-block rounded bg-[#070B12]/85 border border-[#1E293B] px-2 py-0.5 font-mono text-[10px] text-[#94A3B8]">
                  FIXTURE PREVIEW • ACES FILMIC
                </span>
              </div>
            </div>

            {/* React Three Fiber 3D Scene */}
            <Canvas
              shadows
              dpr={[1, 2]}
              camera={{ position: [3.8, 2.6, 4.6], fov: 40, near: 0.1, far: 100 }}
              gl={{
                antialias: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.15,
                outputColorSpace: THREE.SRGBColorSpace,
              }}
            >
              {/* Calibrated Industrial Lighting Rig */}
              <ambientLight intensity={0.8} color="#dce8f7" />
              <hemisphereLight
                args={["#e2f1ff", "#1e293b", 0.6]}
                position={[0, 10, 0]}
              />
              <directionalLight
                position={[6, 8, 6]}
                intensity={2.0}
                color="#ffffff"
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />
              <directionalLight
                position={[-6, 5, -5]}
                intensity={1.2}
                color="#38bdf8"
              />
              <directionalLight
                position={[-5, 2, 6]}
                intensity={0.8}
                color="#cbd5e1"
              />
              <pointLight
                position={[0, -2.2, 3]}
                intensity={0.45}
                color="#94a3b8"
              />

              <CameraRigController
                orbit={orbit}
                reducedMotion={prefersReducedMotion}
              />

              <IndustrialRotatingMachineMesh
                machine={machine}
                selectedSubAssemblyId={selectedSubAssemblyId}
                onSelectSubAssembly={onSelectSubAssembly}
                wireframe={wireframe}
                exploded={exploded}
                animateRotation={!rotationPaused && !prefersReducedMotion}
              />
            </Canvas>

            {/* Bottom Sub-Assembly Selector Pills */}
            <div className="absolute bottom-3 inset-x-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded bg-[#070B12]/90 backdrop-blur-xs border border-[#1E293B] px-3 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B] mr-1">
                  ZONES:
                </span>
                {machine.subAssemblies.map((sub) => {
                  const active = selectedSubAssemblyId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSubAssembly(active ? null : sub.id);
                      }}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[11px] border transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                        active
                          ? "bg-[#131C2E] border-[#00E5FF] text-[#F1F5F9]"
                          : "bg-[#0D131F] border-[#1E293B] text-[#94A3B8] hover:text-[#F1F5F9]"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          sub.status === "critical"
                            ? "bg-[#EF4444]"
                            : sub.status === "warning"
                            ? "bg-[#F59E0B]"
                            : "bg-[#10B981]"
                        }`}
                      />
                      <span>{sub.code}</span>
                    </button>
                  );
                })}
              </div>

              {selectedSub && (
                <div className="font-mono text-[11px] text-[#00E5FF] tabular-nums">
                  {selectedSub.name}: {selectedSub.temperatureC.toFixed(1)}°C •{" "}
                  {selectedSub.vibrationRms.toFixed(1)} mm/s
                </div>
              )}
            </div>
          </div>
        </WebGLErrorBoundary>
      )}
    </div>
  );
}
