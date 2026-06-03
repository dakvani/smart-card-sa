import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Cylinder, Torus, Environment, ContactShadows, Text, Ring } from "@react-three/drei";
import * as THREE from "three";
import { NFCProduct } from "./types";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Box, X, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { formatSAR } from "@/lib/currency";

interface Product3DViewerProps {
  product: NFCProduct;
  isOpen: boolean;
  onClose: () => void;
}

// NFC Business Card 3D Model
function BusinessCard({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group>
      <RoundedBox
        ref={meshRef}
        args={[3.4, 2.1, 0.08]}
        radius={0.1}
        smoothness={4}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
          envMapIntensity={1}
        />
      </RoundedBox>
      
      {/* NFC Chip */}
      <mesh position={[-0.8, 0.4, 0.05]}>
        <cylinderGeometry args={[0.2, 0.2, 0.02, 32]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* NFC Waves */}
      {[0.3, 0.45, 0.6].map((radius, i) => (
        <Ring
          key={i}
          args={[radius - 0.02, radius, 32]}
          position={[-0.8, 0.4, 0.06]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial color="#a0a0a0" transparent opacity={0.6 - i * 0.15} />
        </Ring>
      ))}
      
      {/* Card text placeholder */}
      <Text
        position={[0.2, -0.3, 0.05]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        NFC CARD
      </Text>
    </group>
  );
}

// NFC Sticker 3D Model
function Sticker({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <Cylinder args={[1.2, 1.2, 0.05, 64]}>
        <meshStandardMaterial
          color={color}
          metalness={0.2}
          roughness={0.3}
        />
      </Cylinder>
      
      {/* NFC Chip Center */}
      <Cylinder args={[0.25, 0.25, 0.06, 32]} position={[0, 0.01, 0]}>
        <meshStandardMaterial color="#d4d4d8" metalness={0.8} roughness={0.2} />
      </Cylinder>
      
      {/* Circular NFC pattern */}
      {[0.4, 0.6, 0.8].map((radius, i) => (
        <Torus
          key={i}
          args={[radius, 0.02, 16, 100]}
          position={[0, 0.03, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color="#e4e4e7" metalness={0.5} roughness={0.3} />
        </Torus>
      ))}
    </group>
  );
}

// NFC Wristband 3D Model
function WristBand({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.3, 0, 0]}>
      <Torus args={[1.3, 0.25, 16, 100]}>
        <meshStandardMaterial
          color={color}
          metalness={0.1}
          roughness={0.8}
        />
      </Torus>
      
      {/* NFC Tag section */}
      <mesh position={[1.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.2, 0.5, 8, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.4} roughness={0.6} />
      </mesh>
      
      {/* NFC indicator */}
      <mesh position={[1.35, 0, 0.2]} rotation={[0, 0, Math.PI / 2]}>
        <circleGeometry args={[0.08, 32]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// NFC Keychain 3D Model
function Keychain({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Key ring */}
      <Torus args={[0.3, 0.05, 16, 32]} position={[0, 1.4, 0]}>
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
      </Torus>
      
      {/* Connection piece */}
      <Cylinder args={[0.08, 0.08, 0.3, 16]} position={[0, 1.1, 0]}>
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
      </Cylinder>
      
      {/* Main tag body */}
      <RoundedBox args={[1.2, 1.6, 0.15]} radius={0.15} smoothness={4} position={[0, 0.1, 0]}>
        <meshStandardMaterial
          color={color}
          metalness={0.2}
          roughness={0.5}
        />
      </RoundedBox>
      
      {/* NFC chip */}
      <Cylinder args={[0.2, 0.2, 0.02, 32]} position={[0, 0.3, 0.09]}>
        <meshStandardMaterial color="#d4d4d8" metalness={0.8} roughness={0.2} />
      </Cylinder>
      
      {/* NFC waves on tag */}
      {[0.3, 0.4].map((radius, i) => (
        <Ring
          key={i}
          args={[radius - 0.02, radius, 32]}
          position={[0, 0.3, 0.1]}
        >
          <meshBasicMaterial color="#a0a0a0" transparent opacity={0.5 - i * 0.15} />
        </Ring>
      ))}
    </group>
  );
}

// NFC Review Card 3D Model
function ReviewCard({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group>
      <RoundedBox
        ref={meshRef}
        args={[3.4, 2.1, 0.08]}
        radius={0.1}
        smoothness={4}
      >
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
        />
      </RoundedBox>
      
      {/* Stars */}
      {[-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.4, 0.05]} rotation={[0, 0, Math.PI / 10]}>
          <cylinderGeometry args={[0.15, 0.15, 0.02, 5]} />
          <meshStandardMaterial 
            color={i < 4 ? "#fbbf24" : "#9ca3af"} 
            metalness={0.6} 
            roughness={0.3}
            emissive={i < 4 ? "#fbbf24" : "#000000"}
            emissiveIntensity={i < 4 ? 0.3 : 0}
          />
        </mesh>
      ))}
      
      {/* Review text placeholder */}
      <Text
        position={[0, -0.3, 0.05]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        TAP TO REVIEW
      </Text>
      
      {/* NFC indicator */}
      <mesh position={[1.3, -0.7, 0.05]}>
        <circleGeometry args={[0.12, 32]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// Scene component with lighting and controls
function Scene({ product }: { product: NFCProduct }) {
  const categoryColors: Record<string, string> = {
    card: "#8b5cf6",
    sticker: "#0ea5e9",
    band: "#22c55e",
    keychain: "#f97316",
    review: "#ec4899",
  };

  const color = categoryColors[product.category] || "#8b5cf6";

  const renderProduct = () => {
    switch (product.category) {
      case "card":
        return <BusinessCard color={color} />;
      case "sticker":
        return <Sticker color={color} />;
      case "band":
        return <WristBand color={color} />;
      case "keychain":
        return <Keychain color={color} />;
      case "review":
        return <ReviewCard color={color} />;
      default:
        return <BusinessCard color={color} />;
    }
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      <group position={[0, 0, 0]}>
        {renderProduct()}
      </group>
      
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
      />
      
      <Environment preset="city" />
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.5}
        autoRotate
        autoRotateSpeed={2}
      />
    </>
  );
}

// Loading fallback
function Loader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <span className="text-muted-foreground">Loading 3D Model...</span>
      </motion.div>
    </div>
  );
}

export function Product3DViewer({ product, isOpen, onClose }: Product3DViewerProps) {
  const [zoom, setZoom] = useState(5);

  const handleZoomIn = () => setZoom((prev) => Math.max(3, prev - 1));
  const handleZoomOut = () => setZoom((prev) => Math.min(10, prev + 1));
  const handleReset = () => setZoom(5);

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-4xl h-[80vh] p-0 overflow-hidden">
            <VisuallyHidden>
              <DialogTitle>3D View - {product.name}</DialogTitle>
              <DialogDescription>
                Interactive 3D model of {product.name}. Drag to rotate, scroll to zoom.
              </DialogDescription>
            </VisuallyHidden>
            
            <motion.div
              className="relative w-full h-full bg-gradient-to-br from-background via-muted/30 to-background"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-background/80 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Box className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">Drag to rotate • Scroll to zoom</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                  aria-label="Close 3D viewer"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* 3D Canvas */}
              <Suspense fallback={<Loader />}>
                <Canvas
                  camera={{ position: [0, 0, zoom], fov: 50 }}
                  className="w-full h-full touch-none"
                  dpr={[1, 2]}
                >
                  <Scene product={product} />
                </Canvas>
              </Suspense>

              {/* Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  className="rounded-full h-10 w-10"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="rounded-full h-10 w-10"
                  aria-label="Reset view"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  className="rounded-full h-10 w-10"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </div>

              {/* Product Info Badge */}
              <motion.div
                className="absolute bottom-4 right-4 z-10 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {formatSAR(product.basePrice)}
              </motion.div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
