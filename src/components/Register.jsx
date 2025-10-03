import { useState, useRef, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float, OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import apiauth from "../apiauth";
import "react-toastify/dist/ReactToastify.css";

// Animated 3D Background Sphere
function AnimatedSphere() {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 100, 100]} scale={2.5}>
        <MeshDistortMaterial
          color="#e50914"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

// Particle System
function Particles() {
  const particlesRef = useRef();
  const particleCount = 1000;

  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 20;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ff4d4d"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Floating Rings
function FloatingRings() {
  const ring1 = useRef();
  const ring2 = useRef();

  useFrame((state) => {
    if (ring1.current) {
      ring1.current.rotation.x = state.clock.getElapsedTime() * 0.5;
      ring1.current.rotation.z = state.clock.getElapsedTime() * 0.3;
    }
    if (ring2.current) {
      ring2.current.rotation.x = -state.clock.getElapsedTime() * 0.4;
      ring2.current.rotation.y = state.clock.getElapsedTime() * 0.6;
    }
  });

  return (
    <>
      <mesh ref={ring1} position={[-3, 0, -2]}>
        <torusGeometry args={[1.5, 0.1, 16, 100]} />
        <meshStandardMaterial color="#e50914" emissive="#e50914" emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={ring2} position={[3, 0, -2]}>
        <torusGeometry args={[1.2, 0.08, 16, 100]} />
        <meshStandardMaterial color="#ff4d4d" emissive="#ff4d4d" emissiveIntensity={0.5} />
      </mesh>
    </>
  );
}

const Register = () => {
    const [Username, setUsername] = useState("");
    const [Password, setPassword] = useState("");
    const [role, setrole] = useState("");
    const [Email, setemail] = useState("");
    const navigate = useNavigate();

    const handleregister = async (e) => {
        e.preventDefault();

        try {
            // Simulated API call - replace with your actual apiauth
            const res = await apiauth.post('/register', { Username, Password, Email, role });
            
            toast.success(`User: ${Username} created`);

            setTimeout(() => {
                navigate("/");
            }, 2000);
        }
        catch (err) {
            if (Username === "" || Password === "") {
                toast.error("Input field(s) cannot be empty");
            } else {
                toast.error(`User: ${Username} already exists`);
            }
            console.error(err);
        }
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            {/* 3D Background Canvas */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0
            }}>
                <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} color="#e50914" />
                    <AnimatedSphere />
                    <Particles />
                    <FloatingRings />
                    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
                </Canvas>
            </div>

            {/* Form Container */}
            <motion.div 
                className="App-div"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    transformStyle: 'preserve-3d'
                }}
            >
                <motion.h1
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    🚀 Register
                </motion.h1>
                
                <form onSubmit={handleregister}>
                    <motion.label
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <b>Username:</b>
                        <input 
                            type="text" 
                            name="Username" 
                            placeholder="Enter Username"
                            value={Username} 
                            onChange={(e) => setUsername(e.target.value)} 
                        />
                    </motion.label>

                    <motion.label
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <b>Password:</b>
                        <input 
                            type="password" 
                            name="Password" 
                            placeholder="Enter Password" 
                            value={Password} 
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                    </motion.label>

                    <motion.label
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <b>Role:</b>
                        <select name="role" onChange={(e) => { setrole(e.target.value); }}>
                            <option className="option" value="">User (default)</option>
                        </select>
                    </motion.label>

                    <motion.label
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <b>Email:</b>
                        <input 
                            type="email" 
                            name="Email" 
                            placeholder="Enter Email"
                            value={Email} 
                            onChange={(e) => setemail(e.target.value)} 
                        />
                    </motion.label>

                    <motion.button 
                        type="submit"
                        whileHover={{ scale: 1.05, rotateZ: 2 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        Register
                    </motion.button>
                </form>
                <ToastContainer />
            </motion.div>
        </div>
    );
};

export default Register;