import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { ArrowRight, Thermometer, Wind, Users, TreePine, Zap, Globe2 } from 'lucide-react';

/* ─── Dedicated full-screen Earth for the hero ─────────────────────────────── */
function HeroEarthMesh() {
    const earthRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);

    const [dayMap, bumpMap, specularMap] = useLoader(THREE.TextureLoader, [
        '/textures/earth-day.jpg',
        '/textures/earth-bump.png',
        '/textures/earth-specular.png',
    ]);

    useFrame((_, delta) => {
        if (earthRef.current) earthRef.current.rotation.y += delta * 0.07;
        if (glowRef.current) glowRef.current.rotation.y += delta * 0.03;
    });

    const atmosColor = useMemo(() => new THREE.Color(0x4fc3f7), []);
    const R = 2.6;

    return (
        <group rotation={[0.12, -0.6, 0]}>
            {/* Earth surface */}
            <mesh ref={earthRef}>
                <sphereGeometry args={[R, 128, 128]} />
                <meshPhongMaterial
                    map={dayMap}
                    bumpMap={bumpMap}
                    bumpScale={0.07}
                    specularMap={specularMap}
                    specular={new THREE.Color(0x334455)}
                    shininess={45}
                />
            </mesh>

            {/* Atmosphere inner shell */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[R * 1.018, 96, 96]} />
                <meshPhongMaterial
                    color={atmosColor}
                    transparent
                    opacity={0.10}
                    side={THREE.FrontSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Outer haze */}
            <mesh>
                <sphereGeometry args={[R * 1.12, 48, 48]} />
                <meshBasicMaterial
                    color={atmosColor}
                    transparent
                    opacity={0.04}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Limb rim */}
            <mesh>
                <sphereGeometry args={[R * 1.055, 48, 48]} />
                <meshBasicMaterial
                    color={atmosColor}
                    transparent
                    opacity={0.065}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

function HeroGlobe() {
    return (
        <Canvas
            camera={{ position: [0, 0, 7.0], fov: 36 }}
            gl={{ antialias: true, alpha: true }}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
            onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0);
            }}
        >
            <ambientLight intensity={0.35} />
            {/* Main sun from upper-right, brighter for daylit face */}
            <directionalLight position={[5, 2, 4]} intensity={2.6} color="#fff5e8" />
            {/* Cool fill */}
            <directionalLight position={[-3, -1, -3]} intensity={0.22} color="#4fc3f7" />
            {/* Back rim */}
            <pointLight position={[0, 5, -6]} intensity={0.35} color="#7e57c2" />

            {/* Dense layered stars to fill space around globe */}
            <Stars radius={12} depth={18} count={1500} factor={2} fade speed={0.2} saturation={0.3} />
            <Stars radius={50} depth={40} count={3000} factor={3.5} fade speed={0.2} saturation={0.1} />
            <Stars radius={120} depth={80} count={2000} factor={4} fade speed={0.3} />

            <HeroEarthMesh />

            {/* Auto-rotate + user can drag */}
            <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.5}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.5}
            />
        </Canvas>
    );
}

/* ─── Stats strip ────────────────────────────────────────────────────────────── */
const STATS = [
    { icon: Thermometer, label: 'Warming', value: '+1.2°C', color: 'text-red-400' },
    { icon: Wind, label: 'CO₂', value: '421 ppm', color: 'text-amber-400' },
    { icon: Users, label: 'Population', value: '8.1B', color: 'text-blue-400' },
    { icon: TreePine, label: 'Species at Risk', value: '1M+', color: 'text-green-400' },
    { icon: Zap, label: 'Sim Span', value: '1M yrs', color: 'text-purple-400' },
    { icon: Globe2, label: 'Ice Age Cycles', value: '10+', color: 'text-cyan-400' },
];

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="h-screen w-screen bg-background overflow-hidden flex flex-col">
            {/* ── Nav ── */}
            <nav className="relative z-20 flex items-center justify-between px-8 py-4 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="font-display text-sm font-semibold tracking-wide text-foreground">
                        Earth Twin
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/simulation')}
                    className="text-xs text-muted-foreground hover:text-foreground"
                >
                    Launch Simulator <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
            </nav>

            {/* ── Hero split ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: text content */}
                <div className="w-[46%] flex flex-col justify-center px-10 xl:px-16 shrink-0 z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4 font-semibold">
                            AI-Powered Planetary Simulation · 1,000,000 Year Span
                        </p>
                        <h1 className="font-display text-4xl xl:text-5xl font-bold text-foreground leading-[1.1] mb-5">
                            What happens to{' '}
                            <span className="text-primary">Earth</span> over the next{' '}
                            <span className="text-primary">million years?</span>
                        </h1>
                        <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-sm">
                            Adjust climate, economy, and policy — then watch ice ages cycle,
                            civilisations rise and fall, and Earth transform across deep time.
                        </p>

                        <Button
                            size="lg"
                            onClick={() => navigate('/simulation')}
                            className="font-display text-sm font-semibold tracking-wide px-8 py-5 glow-cyan rounded-full w-fit"
                        >
                            Start Simulation <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </motion.div>

                    {/* Stats grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.45 }}
                        className="grid grid-cols-3 gap-2 mt-10"
                    >
                        {STATS.map(({ icon: Icon, label, value, color }) => (
                            <div
                                key={label}
                                className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-3 text-center hover:border-border/70 hover:bg-card/70 transition-all duration-300"
                            >
                                <Icon className={`h-3.5 w-3.5 mx-auto mb-1.5 ${color} opacity-80`} />
                                <p className={`font-display text-base font-semibold ${color}`}>{value}</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider leading-tight">
                                    {label}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Right: full-height rotating Earth — overflows so no dark ring */}
                <motion.div
                    className="flex-1 relative overflow-visible"
                    style={{ marginRight: '-8%' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.2, delay: 0.1 }}
                >
                    {/* Subtle radial glow behind the globe */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(210_100%_62%/0.08)_0%,transparent_65%)] pointer-events-none z-0" />
                    <HeroGlobe />
                </motion.div>
            </div>
        </div>
    );
}
