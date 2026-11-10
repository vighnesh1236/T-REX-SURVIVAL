import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function Runner({ skin, lane, action, running }) {
  const root = useRef();
  const legs = useRef([]);
  useFrame(({ clock }, dt) => {
    if (!root.current) return;
    const targetX = lane * 1.35;
    root.current.position.x = THREE.MathUtils.damp(root.current.position.x, targetX, 12, dt);
    const jump = action === 'jump' ? Math.max(0, Math.sin(clock.elapsedTime * 5.2)) * 1.25 : 0;
    const falling = action === 'fall';
    const caught = action === 'caught';
    const sliding = action === 'slide';
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, falling || caught ? 0.04 : jump - (sliding ? 0.3 : 0), falling || caught ? 6 : 10, dt);
    root.current.scale.y = THREE.MathUtils.damp(root.current.scale.y, sliding ? 0.67 : 1, 13, dt);
    root.current.position.z = THREE.MathUtils.damp(root.current.position.z, caught ? 0.42 : 0, caught ? 5 : 8, dt);
    root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, falling ? -1.12 : caught ? 1.3 : (targetX - root.current.position.x) * -0.22, falling || caught ? 5 : 8, dt);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, falling ? 0.38 : caught ? 0.7 : sliding ? -0.32 : 0, 9, dt);
    legs.current.forEach((leg, i) => {
      if (leg) leg.rotation.x = caught ? Math.sin(clock.elapsedTime * 15 + i * Math.PI) * 0.8 : running && action !== 'slide' ? Math.sin(clock.elapsedTime * 13 + i * Math.PI) * 0.65 : action === 'slide' ? -1.05 : falling ? -0.8 : 0;
    });
  });
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: skin?.color || '#d2a35d', roughness: 0.72 }), [skin]);
  return (
    <group ref={root} position={[0, 0, 0]}>
      <mesh position={[0, 1.27, 0]} material={material} castShadow>
        <capsuleGeometry args={[0.38, 0.62, 5, 10]} />
      </mesh>
      <mesh position={[0, 1.94, -0.02]} castShadow>
        <sphereGeometry args={[0.29, 12, 10]} />
        <meshStandardMaterial color="#d5aa80" roughness={0.85} />
      </mesh>
      <mesh position={[0, 2.12, -0.17]} castShadow>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color={material.color} roughness={0.8} />
      </mesh>
      {skin?.gender === 'female' && <>
        <mesh position={[0, 2.08, 0.1]} scale={[1.1, 0.9, 0.8]} castShadow>
          <sphereGeometry args={[0.28, 12, 10]} />
          <meshStandardMaterial color="#30251f" roughness={0.92} />
        </mesh>
        <mesh position={[0.08, 1.85, 0.26]} rotation={[0.22, 0, -0.08]} castShadow>
          <capsuleGeometry args={[0.09, 0.38, 4, 8]} />
          <meshStandardMaterial color="#30251f" roughness={0.92} />
        </mesh>
      </>}
      <mesh position={[-0.31, 1.31, -0.04]} rotation={[0, 0, -0.22]} castShadow>
        <capsuleGeometry args={[0.13, 0.55, 4, 8]} />
        <meshStandardMaterial color="#bd966f" roughness={0.85} />
      </mesh>
      <mesh position={[0.31, 1.31, -0.04]} rotation={[0, 0, 0.22]} castShadow>
        <capsuleGeometry args={[0.13, 0.55, 4, 8]} />
        <meshStandardMaterial color="#bd966f" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.26, 0.37]} castShadow>
        <boxGeometry args={[0.49, 0.55, 0.25]} />
        <meshStandardMaterial color="#70503a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <torusGeometry args={[0.3, 0.055, 6, 12]} />
        <meshStandardMaterial color="#c6a76a" metalness={0.45} roughness={0.52} />
      </mesh>
      {[-0.2, 0.2].map((x, i) => (
        <group key={x} ref={(el) => { legs.current[i] = el; }} position={[x, 0.72, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <capsuleGeometry args={[0.15, 0.52, 4, 8]} />
            <meshStandardMaterial color="#4c4033" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.6, -0.1]} castShadow>
            <boxGeometry args={[0.27, 0.14, 0.4]} />
            <meshStandardMaterial color="#382f25" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Dinosaur({ lane, active, caught }) {
  const chase = useRef();
  const body = useRef();
  const head = useRef();
  const jaw = useRef();
  const tail = useRef();
  const legs = useRef([]);
  const laneOffset = lane === 1 ? -0.9 : 0.9;
  const targetX = lane * 1.35 + laneOffset;
  useFrame(({ clock }, dt) => {
    if (chase.current) {
      chase.current.position.x = THREE.MathUtils.damp(chase.current.position.x, targetX, 5, dt);
      chase.current.position.z = THREE.MathUtils.damp(chase.current.position.z, caught ? 0.5 : 2.8, caught ? 3.8 : 2, dt);
      chase.current.scale.setScalar(THREE.MathUtils.damp(chase.current.scale.x, caught ? 1.12 : 1, caught ? 3 : 4, dt));
      chase.current.rotation.z = THREE.MathUtils.damp(chase.current.rotation.z, (targetX - chase.current.position.x) * -0.12, 4, dt);
    }
    if (body.current) {
      body.current.position.y = Math.sin(clock.elapsedTime * (caught ? 13 : active ? 9 : 3)) * (caught ? 0.12 : active ? 0.065 : 0.018);
      body.current.rotation.x = THREE.MathUtils.damp(body.current.rotation.x, caught ? Math.sin(clock.elapsedTime * 7) * 0.16 : active ? 0 : -0.12, 3, dt);
    }
    if (head.current) head.current.rotation.x = caught ? Math.sin(clock.elapsedTime * 7) * 0.2 : Math.sin(clock.elapsedTime * 2.4) * 0.04;
    if (jaw.current) jaw.current.rotation.x = caught ? Math.max(0, Math.sin(clock.elapsedTime * 12)) * 0.52 : active ? Math.max(0, Math.sin(clock.elapsedTime * 3.2)) * 0.38 : 0;
    if (tail.current) tail.current.rotation.y = Math.sin(clock.elapsedTime * 2.8) * (caught ? 0.34 : active ? 0.2 : 0.04);
    legs.current.forEach((leg, i) => {
      if (leg) leg.rotation.x = caught ? Math.sin(clock.elapsedTime * 12 + i * Math.PI) * 0.62 : active ? Math.sin(clock.elapsedTime * 9 + i * Math.PI) * 0.42 : 0;
    });
  });
  return (
    <group ref={chase} position={[targetX, 0, 2.8]}>
    <group ref={body} position={[0, -0.12, 0]} scale={1.04}>
      <mesh position={[0, 1.18, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.62, 1.45, 5, 10]} />
        <meshStandardMaterial color="#516b3d" roughness={0.76} />
      </mesh>
      <group ref={head} position={[0.18, 1.95, 0.53]} scale={[1.22, 1.16, 1.2]}>
      <mesh rotation={[-0.48, 0, -0.15]} castShadow>
        <capsuleGeometry args={[0.35, 0.7, 5, 10]} />
        <meshStandardMaterial color="#627f49" roughness={0.85} />
      </mesh>
      <mesh position={[0.02, -0.18, 0.49]} rotation={[0.05, 0, 0.08]} castShadow>
        <boxGeometry args={[0.48, 0.25, 0.66]} />
        <meshStandardMaterial color="#8f7045" roughness={0.8} />
      </mesh>
      <group ref={jaw} position={[0.04, -0.26, 0.48]}>
      <mesh position={[0, -0.14, 0.02]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.42, 0.14, 0.57]} />
        <meshStandardMaterial color="#594334" roughness={0.86} />
      </mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[side * 0.17, -0.16, 0.18]} rotation={[-0.12, 0, 0]}>
        <coneGeometry args={[0.06, 0.2, 5]} />
        <meshStandardMaterial color="#e8d8ae" roughness={0.45} />
      </mesh>)}
      </group>
      <mesh position={[0.2, 0.04, 0.57]}>
        <sphereGeometry args={[0.065, 10, 8]} />
        <meshStandardMaterial color="#ff593e" emissive="#ff321d" emissiveIntensity={3} />
      </mesh>
      <mesh position={[-0.2, 0.02, 0.56]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ff593e" emissive="#ff321d" emissiveIntensity={3} />
      </mesh>
      {[-1, 1].map((side) => <mesh key={`brow-${side}`} position={[side * 0.2, 0.14, 0.54]} rotation={[0.05, 0, side * -0.3]}>
        <boxGeometry args={[0.22, 0.09, 0.18]} />
        <meshStandardMaterial color="#3b5131" roughness={0.85} />
      </mesh>)}
      {[-0.13, 0.13].map((x) => <mesh key={x} position={[x, -0.08, 0.92]} rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[0.045, 7, 6]} />
        <meshStandardMaterial color="#302a20" roughness={0.8} />
      </mesh>)}
      </group>
      <group ref={tail} position={[0, 1.05, -0.48]}>
        <mesh position={[0, 0, -0.78]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.28, 1.18, 5, 9]} />
          <meshStandardMaterial color="#49623a" roughness={0.82} />
        </mesh>
        <mesh position={[0, 0, -1.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.27, 0.88, 8]} />
          <meshStandardMaterial color="#435a36" roughness={0.85} />
        </mesh>
      </group>
      {[-0.39, 0, 0.39].map((x, i) => (
        <mesh key={x} position={[x, 1.69, -0.12]} rotation={[0, 0, Math.PI]} castShadow>
          <coneGeometry args={[0.14 - i * 0.015, 0.36, 6]} />
          <meshStandardMaterial color="#70834a" roughness={0.9} />
        </mesh>
      ))}
      {[-0.3, -0.1, 0.1, 0.3].map((x) => (
        <mesh key={`tooth-${x}`} position={[x, 1.48, 0.91]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.055, 0.16, 5]} />
          <meshStandardMaterial color="#e9ddbd" roughness={0.4} />
        </mesh>
      ))}
      {[-0.43, 0.43].map((x, i) => (
        <group key={x} ref={(el) => { legs.current[i] = el; }} position={[x, 0.56, 0.12]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.22, 0.58, 4, 9]} />
            <meshStandardMaterial color="#425a35" roughness={0.92} />
          </mesh>
          <mesh position={[0, -0.38, -0.2]} castShadow>
            <boxGeometry args={[0.34, 0.16, 0.48]} />
            <meshStandardMaterial color="#3c5030" roughness={0.95} />
          </mesh>
        </group>
      ))}
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 1.46, 0.48]} rotation={[-0.2, 0, x < 0 ? 0.42 : -0.42]} castShadow>
          <capsuleGeometry args={[0.12, 0.36, 4, 8]} />
          <meshStandardMaterial color="#49643a" roughness={0.9} />
        </mesh>
      ))}
    </group>
    </group>
  );
}

function Collectible({ type, paused }) {
  const root = useRef();
  const coin = type === 'coin';
  const key = type === 'key';
  const magnet = type === 'magnet';
  const color = coin ? '#f5be42' : key ? '#ffdf76' : magnet ? '#78e1dc' : type === 'shield' ? '#83baff' : type === 'boost' ? '#ff8559' : '#d2a8ff';
  useFrame(({ clock }, dt) => {
    if (!root.current || paused) return;
    root.current.rotation.y += dt * (coin ? 2.8 : 1.4);
    root.current.position.y = Math.sin(clock.elapsedTime * 3.2 + (root.current.position.z * 0.1)) * 0.08;
  });
  return (
    <group ref={root}>
      {(coin || key) && (
        <mesh rotation={coin ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
          {coin ? <cylinderGeometry args={[0.25, 0.25, 0.075, 24]} /> : <torusGeometry args={[0.13, 0.045, 8, 18]} />}
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} metalness={0.8} roughness={0.22} />
        </mesh>
      )}
      {coin && <mesh position={[0, 0, 0.044]}>
        <torusGeometry args={[0.17, 0.018, 6, 20]} />
        <meshStandardMaterial color="#fff0a5" emissive="#d89c27" emissiveIntensity={0.6} metalness={0.85} roughness={0.2} />
      </mesh>}
      {key && <>
        <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.4, 10]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.42, -0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.13, 0.09, 0.075]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.22} />
        </mesh>
        <mesh position={[0.31, 0.04, 0]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#fff2b0" emissive={color} emissiveIntensity={0.65} />
        </mesh>
      </>}
      {magnet && <>
        <mesh position={[-0.22, 0.2, 0]} rotation={[0, 0, -0.12]}>
          <capsuleGeometry args={[0.085, 0.35, 4, 10]} />
          <meshStandardMaterial color="#4d82e5" metalness={0.35} roughness={0.25} emissive="#234a9b" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0.22, 0.2, 0]} rotation={[0, 0, 0.12]}>
          <capsuleGeometry args={[0.085, 0.35, 4, 10]} />
          <meshStandardMaterial color="#e8574e" metalness={0.35} roughness={0.25} emissive="#a22e30" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0, 0.08, 0]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.22, 0.085, 9, 20, Math.PI]} />
          <meshStandardMaterial color="#b4bbc5" metalness={0.7} roughness={0.24} />
        </mesh>
      </>}
      {!coin && !key && !magnet && (
        <mesh>
          {type === 'shield' ? <octahedronGeometry args={[0.27, 1]} /> : <dodecahedronGeometry args={[0.25, 1]} />}
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} metalness={0.55} roughness={0.25} />
        </mesh>
      )}
    </group>
  );
}

function CameraRig({ menu }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(menu ? 3.8 : 0, menu ? 4.2 : 4.6, menu ? 12 : 10.2);
    camera.lookAt(menu ? 1.2 : 0, menu ? 1.1 : 1.25, menu ? -4 : -5.2);
    camera.updateProjectionMatrix();
  }, [camera, menu]);
  return null;
}

function Jungle({ distance, entities, lane, action, skin, paused, quake, menu, speed }) {
  const road = useRef();
  const torchRefs = useRef([]);
  const treeRefs = useRef([]);
  const trees = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    z: -(i * 7 + 18), x: i % 2 ? -6.4 - (i % 4) * 0.7 : 6.4 + (i % 4) * 0.7, size: 0.62 + (i % 4) * 0.08,
  })), []);
  useFrame(({ clock }, dt) => {
    const worldSpeed = paused ? 0 : (menu ? 7 : speed);
    if (road.current) {
      road.current.children.forEach((tile) => {
        tile.position.z += dt * worldSpeed;
        if (tile.position.z > 8) tile.position.z -= 112;
      });
    }
    treeRefs.current.forEach((tree) => {
      if (!tree) return;
      tree.position.z += dt * worldSpeed;
      if (tree.position.z > 10) tree.position.z -= 210;
    });
    torchRefs.current.forEach((torch, i) => {
      if (torch) torch.scale.y = 0.8 + Math.sin(clock.elapsedTime * 8 + i) * 0.14;
    });
  });
  return (
    <>
      <CameraRig menu={menu} />
      <color attach="background" args={['#bb7953']} />
      <fog attach="fog" args={['#bd8560', 27, 105]} />
      <ambientLight intensity={1.55} color="#f4d0a0" />
      <hemisphereLight args={['#f5c990', '#283b2e', 1.5]} />
      <directionalLight position={[-8, 16, -12]} intensity={3.1} color="#ffe0ad" castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0, 5, -12]} color="#ffb267" intensity={18} distance={35} />
      <mesh>
        <sphereGeometry args={[500, 32, 24]} />
        <shaderMaterial
          side={THREE.BackSide}
          depthWrite={false}
          vertexShader={`varying float vHeight; void main() { vHeight = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          fragmentShader={`varying float vHeight; void main() { vec3 low = vec3(0.35, 0.30, 0.22); vec3 horizon = vec3(0.78, 0.46, 0.31); vec3 high = vec3(0.18, 0.28, 0.29); float band = smoothstep(-0.44, 0.02, vHeight); vec3 sky = mix(low, horizon, band); sky = mix(sky, high, smoothstep(0.08, 0.78, vHeight)); gl_FragColor = vec4(sky, 1.0); }`}
        />
      </mesh>
      <mesh position={[0, 13, -95]}>
        <sphereGeometry args={[3.5, 24, 16]} />
        <meshBasicMaterial color="#ffe0a2" />
      </mesh>
      {[-17, 17].map((x, i) => (
        <group key={`ridge-${x}`} position={[x, 0, -92]}>
          <mesh position={[0, 8 + i * 2, 0]} rotation={[0, 0, i ? -0.12 : 0.12]}>
            <coneGeometry args={[16, 24, 6]} />
            <meshStandardMaterial color={i ? '#6c6550' : '#777056'} roughness={1} flatShading />
          </mesh>
          <mesh position={[i ? -7 : 7, 5, 8]} rotation={[0, 0, i ? 0.13 : -0.13]}>
            <coneGeometry args={[11, 17, 6]} />
            <meshStandardMaterial color={i ? '#827056' : '#685e4a'} roughness={1} flatShading />
          </mesh>
        </group>
      ))}
      <group position={[0, 0, -40]}>
        <mesh position={[0, 1.6, 0]} receiveShadow>
          <boxGeometry args={[12, 3.2, 1.3]} />
          <meshStandardMaterial color="#716044" roughness={0.94} />
        </mesh>
        <mesh position={[0, 3.45, 0]}>
          <boxGeometry args={[13.2, 0.55, 1.8]} />
          <meshStandardMaterial color="#8d704b" roughness={0.9} />
        </mesh>
        {[-4.8, -2.4, 0, 2.4, 4.8].map((x) => (
          <mesh key={x} position={[x, 2.65, 0.06]} castShadow>
            <boxGeometry args={[0.38, 2.2, 0.72]} />
            <meshStandardMaterial color="#b0986e" roughness={0.87} />
          </mesh>
        ))}
        <mesh position={[0, 4.05, -0.05]}>
          <boxGeometry args={[9.8, 0.5, 1.1]} />
          <meshStandardMaterial color="#9b7c51" roughness={0.9} />
        </mesh>
      </group>
      <mesh position={[0, -0.24, -45]} receiveShadow>
        <boxGeometry args={[120, 0.4, 150]} />
        <meshStandardMaterial color="#3e5035" roughness={1} />
      </mesh>
      <group ref={road}>
        {Array.from({ length: 14 }, (_, i) => (
          <group key={i} position={[0, -0.01, -i * 8]}>
            <mesh receiveShadow>
              <boxGeometry args={[4.35, 0.16, 8]} />
              <meshStandardMaterial color={i % 2 ? '#64513b' : '#70593e'} roughness={0.97} />
            </mesh>
            {[0, 1].map((n) => (
              <mesh key={n} position={[-0.68 + n * 1.36, 0.09, 0]}>
                <boxGeometry args={[0.025, 0.025, 8]} />
                <meshBasicMaterial color="#cfaa6d" transparent opacity={0.28} />
              </mesh>
            ))}
            {[-2.06, 2.06].map((x) => (
              <mesh key={x} position={[x, 0.12, 0]}>
                <boxGeometry args={[0.11, 0.12, 8]} />
                <meshStandardMaterial color="#c5a06a" roughness={0.7} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      {trees.map((tree, i) => (
        <group key={i} ref={(el) => { treeRefs.current[i] = el; }} position={[tree.x, 0, tree.z]} scale={tree.size}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.38, 3.7, 9]} />
            <meshStandardMaterial color="#443d2b" roughness={1} />
          </mesh>
          {[[0, 3.3, 0, 1.45], [-0.62, 2.95, 0.1, 1.02], [0.58, 3.12, -0.12, 1.12], [0.05, 4, 0.07, 0.92]].map(([x, y, z, size], j) => (
            <mesh key={j} position={[x, y, z]} castShadow>
              <icosahedronGeometry args={[size, 1]} />
              <meshStandardMaterial color={j % 2 ? '#435d3d' : i % 3 ? '#354d39' : '#526044'} roughness={0.94} flatShading />
            </mesh>
          ))}
          {i % 3 === 0 && <mesh position={[0.75, 2.25, 0.03]} rotation={[0.25, 0, -0.45]}><cylinderGeometry args={[0.018, 0.025, 2.4, 6]} /><meshStandardMaterial color="#73805a" /></mesh>}
        </group>
      ))}
      {Array.from({ length: 18 }, (_, i) => {
        const side = i % 2 ? -1 : 1;
        const z = -i * 8 - 7;
        return (
          <group key={`fern-${i}`} position={[side * (3.4 + (i % 3) * 0.4), -0.01, z]} rotation={[0, side * 0.25, 0]} scale={0.62 + (i % 3) * 0.1}>
            {[0, 1, 2].map((leaf) => (
              <mesh key={leaf} position={[(leaf - 1) * 0.28, 0.22, 0.05]} rotation={[0.15, 0, (leaf - 1) * 0.47]}>
                <coneGeometry args={[0.2, 0.82, 5]} />
                <meshStandardMaterial color={leaf % 2 ? '#526c41' : '#71824a'} roughness={0.95} flatShading />
              </mesh>
            ))}
          </group>
        );
      })}
      {[-2.15, 2.15].map((x, i) => (
        <group key={x} position={[x, 0, -13]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <boxGeometry args={[0.42, 3, 0.48]} />
            <meshStandardMaterial color="#8a7651" roughness={0.9} />
          </mesh>
          <mesh ref={(el) => { torchRefs.current[i] = el; }} position={[0, 3.25, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="#ffa34d" />
          </mesh>
        </group>
      ))}
      {!menu && <Runner skin={skin} lane={lane} action={action} running={!paused && action !== 'fall' && action !== 'caught'} />}
      {!menu && <Dinosaur lane={lane} active={!paused && action !== 'fall' && action !== 'caught'} caught={action === 'caught'} />}
      {menu && <group position={[4.5, 0, 0]} scale={0.78}><Runner skin={skin} lane={0} action="run" running /></group>}
      {entities.map((entity) => {
        const z = -(entity.at - distance);
        if (entity.type === 'coin' || entity.type === 'key' || entity.type === 'magnet' || entity.type === 'shield' || entity.type === 'multiplier' || entity.type === 'boost' || entity.type === 'invincible') {
          return (
            <group key={entity.id} position={[entity.lane * 1.35, entity.type === 'coin' ? 1.05 : 0.95, z]}>
              <Collectible type={entity.type} paused={paused} />
            </group>
          );
        }
        return <group key={entity.id} position={[entity.lane * 1.35, 0, z]}>
          {entity.type === 'barrier' && <>
            <mesh position={[0, 0.42, 0]} castShadow><boxGeometry args={[1.1, 0.28, 0.22]} /><meshStandardMaterial color="#805333" roughness={0.85} /></mesh>
            {[-0.38, 0.38].map((x) => <mesh key={x} position={[x, 0.2, 0]} castShadow><boxGeometry args={[0.13, 0.48, 0.18]} /><meshStandardMaterial color="#9d7043" roughness={0.9} /></mesh>)}
          </>}
          {entity.type === 'branch' && <>
            <mesh position={[0, 1.55, 0]} castShadow><boxGeometry args={[1.48, 0.34, 0.3]} /><meshStandardMaterial color="#61442e" roughness={0.9} /></mesh>
            {[-0.62, 0.62].map((x) => <mesh key={x} position={[x, 1.08, 0]} rotation={[0, 0, x < 0 ? -0.12 : 0.12]} castShadow><cylinderGeometry args={[0.045, 0.075, 1.15, 7]} /><meshStandardMaterial color="#51402a" roughness={0.96} /></mesh>)}
            <mesh position={[0, 1.33, 0.17]}><boxGeometry args={[1.18, 0.035, 0.025]} /><meshStandardMaterial color="#a47d4e" roughness={0.8} /></mesh>
          </>}
          {entity.type === 'rock' && <mesh position={[0, 0.38, 0]} castShadow><dodecahedronGeometry args={[0.52, 1]} /><meshStandardMaterial color="#77766a" roughness={0.96} flatShading /></mesh>}
          {entity.type === 'fire' && <>
            <mesh position={[0, 0.24, 0]} castShadow><cylinderGeometry args={[0.42, 0.46, 0.24, 8]} /><meshStandardMaterial color="#44362c" roughness={0.95} /></mesh>
            <mesh position={[0, 0.7, 0]} castShadow><coneGeometry args={[0.34, 0.95, 7]} /><meshStandardMaterial color="#ef7138" emissive="#b53618" emissiveIntensity={0.7} roughness={0.5} /></mesh>
            <pointLight position={[0, 0.7, 0]} color="#ff6d2e" intensity={1.6} distance={3} />
          </>}
          {entity.type === 'tree' && <mesh position={[0, 0.52, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><capsuleGeometry args={[0.28, 1.15, 5, 9]} /><meshStandardMaterial color="#55422c" roughness={0.94} /></mesh>}
          {entity.type === 'log' && <>
            <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><capsuleGeometry args={[0.14, 1.05, 4, 8]} /><meshStandardMaterial color="#744b2f" roughness={0.92} /></mesh>
            <mesh position={[0, 0.82, 0]} castShadow><boxGeometry args={[1.15, 0.1, 0.12]} /><meshStandardMaterial color="#987044" roughness={0.9} /></mesh>
          </>}
          {entity.type === 'pillar' && <>
            <mesh position={[0, 0.58, 0]} castShadow><cylinderGeometry args={[0.28, 0.34, 1.1, 8]} /><meshStandardMaterial color="#968364" roughness={0.86} /></mesh>
            <mesh position={[0, 1.15, 0]} castShadow><boxGeometry args={[0.74, 0.18, 0.74]} /><meshStandardMaterial color="#b19a71" roughness={0.85} /></mesh>
          </>}
          {entity.type === 'spikes' && [-0.32, 0, 0.32].map((x) => <mesh key={x} position={[x, 0.35, 0]} castShadow><coneGeometry args={[0.19, 0.7, 6]} /><meshStandardMaterial color="#b5ac96" metalness={0.25} roughness={0.55} /></mesh>)}
          {entity.type === 'gap' && <>
            <mesh position={[0, 0.01, 0]}><boxGeometry args={[1.35, 0.035, 1.35]} /><meshStandardMaterial color="#1a1916" roughness={1} /></mesh>
            {[-0.72, 0.72].map((x) => <mesh key={x} position={[x, 0.05, 0]}><boxGeometry args={[0.12, 0.1, 1.55]} /><meshStandardMaterial color="#d19a4f" emissive="#9c5e22" emissiveIntensity={0.35} /></mesh>)}
          </>}
        </group>;
      })}
      {quake > 0 && <pointLight position={[0, 7, -4]} color="#ffcf8d" intensity={quake * 4} distance={16} />}
    </>
  );
}

export default function GameWorld(props) {
  return (
    <Canvas shadows camera={{ position: [0, 4.2, 10], fov: 43 }} dpr={[1, 1.6]}>
      <Jungle {...props} />
    </Canvas>
  );
}
