import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { Era } from '@/lib/simulation';

interface EarthGlobeProps {
    temperature?: number;
    iceCoveragePercent?: number;
    era?: Era;
    interactive?: boolean;
    size?: 'sm' | 'lg';
}

// ── Atmosphere colours by state ───────────────────────────────────────────────
const ERA_ATMO_COLOR: Record<Era, THREE.Color> = {
    anthropocene: new THREE.Color(0x4fc3f7),
    'post-human': new THREE.Color(0x81d4fa),
    'deep-civilization': new THREE.Color(0xaeea00),
    geological: new THREE.Color(0x80deea),
};

function clampedLerp(c1: THREE.Color, c2: THREE.Color, t: number) {
    return c1.clone().lerp(c2, Math.min(1, Math.max(0, t)));
}

// ── Earth Mesh ────────────────────────────────────────────────────────────────
function EarthMesh({
    temperature = 1.2,
    iceCoveragePercent = 12,
    era = 'anthropocene',
    size = 'lg',
}: {
    temperature?: number;
    iceCoveragePercent?: number;
    era?: Era;
    size?: 'sm' | 'lg';
}) {
    const earthRef = useRef<THREE.Mesh>(null);
    const cloudsRef = useRef<THREE.Mesh>(null);
    const atmoRef = useRef<THREE.Mesh>(null);
    const iceRef = useRef<THREE.Mesh>(null);

    const radius = size === 'lg' ? 2.4 : 1.7;

    // Load real textures
    const [dayMap, bumpMap, specularMap] = useLoader(THREE.TextureLoader, [
        '/textures/earth-day.jpg',
        '/textures/earth-bump.png',
        '/textures/earth-specular.png',
    ]);

    // Derive visual states
    const normalized = useMemo(() => Math.min(1, Math.max(0, (temperature - 1.2) / 6)), [temperature]);
    const iceNorm = useMemo(() => iceCoveragePercent / 100, [iceCoveragePercent]);

    // Atmosphere colour: era base + heat tint
    const baseAtmoColor = ERA_ATMO_COLOR[era] ?? new THREE.Color(0x4fc3f7);
    const hotColor = new THREE.Color(0xef5350);
    const coldColor = new THREE.Color(0xb3e5fc);
    const atmosphereColor = useMemo(() => {
        if (iceNorm > 0.3) return clampedLerp(baseAtmoColor, coldColor, (iceNorm - 0.3) / 0.7);
        return clampedLerp(baseAtmoColor, hotColor, normalized);
    }, [normalized, iceNorm, baseAtmoColor]);

    // Ice opacity: more ice coverage → more opaque ice shell
    const iceOpacity = useMemo(() => Math.min(0.85, iceNorm * 1.2), [iceNorm]);
    const atmosphereOpacity = useMemo(() => 0.07 + normalized * 0.14 + iceNorm * 0.05, [normalized, iceNorm]);

    // Earth surface tint for extreme states
    const earthColor = useMemo(() => {
        if (iceNorm > 0.5) return new THREE.Color(0xddeeff); // ice world — blue-white
        if (normalized > 0.8) return new THREE.Color(0xff8a65); // extreme heat — reddish
        return new THREE.Color(0xffffff); // normal
    }, [normalized, iceNorm]);

    useFrame((_, delta) => {
        if (earthRef.current) earthRef.current.rotation.y += delta * 0.06;
        if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.09;
        if (atmoRef.current) atmoRef.current.rotation.y += delta * 0.03;
        if (iceRef.current) iceRef.current.rotation.y += delta * 0.02;
    });

    return (
        <group>
            {/* ── Earth surface ── */}
            <Sphere ref={earthRef} args={[radius, 128, 128]}>
                <meshPhongMaterial
                    map={dayMap}
                    bumpMap={bumpMap}
                    bumpScale={0.07}
                    specularMap={specularMap}
                    specular={new THREE.Color(0x444455)}
                    shininess={40}
                    color={earthColor}
                />
            </Sphere>

            {/* ── Ice cap shell (whole sphere tinted ice-white) ── */}
            {iceOpacity > 0.01 && (
                <Sphere ref={iceRef} args={[radius * 1.002, 64, 64]}>
                    <meshPhongMaterial
                        color={new THREE.Color(0xddeeff)}
                        transparent
                        opacity={iceOpacity * 0.45}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        shininess={120}
                        specular={new THREE.Color(0xffffff)}
                    />
                </Sphere>
            )}

            {/* ── Atmosphere inner glow ── */}
            <Sphere ref={atmoRef} args={[radius * 1.018, 96, 96]}>
                <meshPhongMaterial
                    color={atmosphereColor}
                    transparent
                    opacity={atmosphereOpacity}
                    side={THREE.FrontSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </Sphere>

            {/* ── Atmosphere outer haze ── */}
            <Sphere args={[radius * 1.10, 48, 48]}>
                <meshBasicMaterial
                    color={atmosphereColor}
                    transparent
                    opacity={0.035 + normalized * 0.055}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </Sphere>

            {/* ── Limb glow (rim) ── */}
            <Sphere args={[radius * 1.05, 48, 48]}>
                <meshBasicMaterial
                    color={atmosphereColor}
                    transparent
                    opacity={0.06 + normalized * 0.04}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </Sphere>
        </group>
    );
}

// ── Public Component ──────────────────────────────────────────────────────────
export default function EarthGlobe({
    temperature = 1.2,
    iceCoveragePercent = 12,
    era = 'anthropocene',
    interactive = true,
    size = 'lg',
}: EarthGlobeProps) {
    const canvasH = size === 'lg' ? 'h-[560px]' : 'h-[420px]';

    return (
        <div className={`${canvasH} w-full`}>
            <Canvas
                camera={{ position: [0, 0, size === 'lg' ? 5.8 : 4.8], fov: 42 }}
                gl={{ antialias: true, alpha: true }}
            >
                {/* Brighter key light from sun direction */}
                <ambientLight intensity={0.22} />
                <directionalLight
                    position={[6, 3, 5]}
                    intensity={2.2}
                    color="#fff8f0"
                    castShadow
                />
                {/* Fill light for dark side detail */}
                <directionalLight
                    position={[-4, -1, -4]}
                    intensity={0.18}
                    color="#4fc3f7"
                />
                {/* Subtle back-rim */}
                <pointLight position={[0, 5, -6]} intensity={0.25} color="#7e57c2" />

                <Stars radius={120} depth={80} count={2500} factor={4} fade speed={0.3} />

                <EarthMesh
                    temperature={temperature}
                    iceCoveragePercent={iceCoveragePercent}
                    era={era}
                    size={size}
                />

                {interactive && (
                    <OrbitControls
                        enableZoom={true}
                        minDistance={size === 'lg' ? 3.5 : 3}
                        maxDistance={size === 'lg' ? 10 : 8}
                        enablePan={false}
                        autoRotate
                        autoRotateSpeed={0.5}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 1.4}
                    />
                )}
            </Canvas>
        </div>
    );
}
