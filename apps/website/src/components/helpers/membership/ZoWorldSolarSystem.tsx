import { useWindowSize } from "@zo/utils/hooks";
import { Rubik } from "next/font/google";
import { memo, useEffect, useRef } from "react";
import * as THREE from "three";
import { BufferGeometry, Line, LineBasicMaterial, Vector3 } from "three";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/examples/jsm/renderers/CSS2DRenderer";
import { FounderCategory } from "./FounderMemberList";
import debounce from "lodash/debounce";

const rubik = Rubik({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export type PlanetData = {
  key: FounderCategory;
  modelUrl: string;
  angle: number;
  speed: number;
  delay: number;
  label: string;
};

interface SolarSystemProps {
  planetDetails: PlanetData[];
  onClick: (key: FounderCategory) => void;
}

const generatePlanetTexture = (size = 512) => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d")!;

  // Enhanced color palettes for more realistic planets
  const colorSchemes = [
    {
      base: ["#1a2634", "#2c4a6d"], // Deep oceanic
      detail: ["#1d577c", "#2980b9", "#154360"],
      atmosphere: ["#48c9b0", "#76d7c4"],
    },
    {
      base: ["#4a2910", "#8b4513"], // Terra/rocky
      detail: ["#cd853f", "#deb887", "#d2691e"],
      atmosphere: ["#f4d03f", "#f5b041"],
    },
    {
      base: ["#34495e", "#2c3e50"], // Gas giant
      detail: ["#e67e22", "#d35400", "#a04000"],
      atmosphere: ["#f1c40f", "#f39c12"],
    },
    {
      base: ["#590202", "#800000"], // Mars-like
      detail: ["#8b0000", "#b22222", "#cd5c5c"],
      atmosphere: ["#fa8072", "#e9967a"],
    },
  ];

  const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];

  // Create base gradient with atmospheric effect
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, scheme.base[0]);
  gradient.addColorStop(0.7, scheme.base[1]);
  gradient.addColorStop(0.85, scheme.atmosphere[0]);
  gradient.addColorStop(1, scheme.atmosphere[1]);

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  // Add surface details and features
  const imageData = context.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % size;
    const y = Math.floor(i / 4 / size);

    // Create realistic surface patterns
    const angle = Math.atan2(y - size / 2, x - size / 2);
    const distance = Math.sqrt(
      Math.pow(x - size / 2, 2) + Math.pow(y - size / 2, 2)
    );

    // Surface bands and storms
    const bands = Math.sin(y * 0.03) * 0.5;
    const storms = Math.sin(x * 0.05 + bands) * Math.cos(y * 0.05);

    // Atmospheric turbulence
    const turbulence = Math.sin(distance * 0.02) * Math.cos(angle * 6);

    // Surface features (craters, mountains, etc.)
    const features =
      Math.sin(x * 0.1) *
      Math.cos(y * 0.1) *
      Math.sin(distance * 0.08 + turbulence);

    // Combine all effects
    const detail = (bands + storms + features + turbulence + 2) / 4;

    // Apply color variations based on features
    if (distance < size / 2) {
      const detailColor =
        scheme.detail[Math.floor(detail * scheme.detail.length)];
      const color = new THREE.Color(detailColor);

      // Blend with base color
      const blend = Math.min(
        1,
        Math.max(0, (size / 2 - distance) / (size / 2))
      );
      data[i] = Math.min(
        255,
        (data[i] * (1 - blend) + color.r * 255 * blend) * (0.8 + detail * 0.4)
      );
      data[i + 1] = Math.min(
        255,
        (data[i + 1] * (1 - blend) + color.g * 255 * blend) *
          (0.8 + detail * 0.4)
      );
      data[i + 2] = Math.min(
        255,
        (data[i + 2] * (1 - blend) + color.b * 255 * blend) *
          (0.8 + detail * 0.4)
      );
    }

    // Add atmospheric glow at edges
    if (distance > (size / 2) * 0.8) {
      const atmosphereFactor =
        (distance - (size / 2) * 0.8) / ((size / 2) * 0.2);
      data[i] = Math.min(255, data[i] * (1 + atmosphereFactor * 0.5));
      data[i + 1] = Math.min(255, data[i + 1] * (1 + atmosphereFactor * 0.5));
      data[i + 2] = Math.min(255, data[i + 2] * (1 + atmosphereFactor * 0.5));
    }
  }

  context.putImageData(imageData, 0, 0);

  // Add subtle noise overlay for texture
  context.globalCompositeOperation = "overlay";
  context.fillStyle = "rgba(127, 127, 127, 0.1)";
  for (let i = 0; i < size / 4; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    context.fillRect(x, y, 1, 1);
  }

  return canvas;
};

const createLabelTexture = (text: string, size = 512) => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d")!;

  // Set background to transparent
  context.clearRect(0, 0, size, size);

  // Set text properties with larger, bolder font
  context.font = `bold 64px ${rubik.style.fontFamily}`; // Increased font size
  context.fillStyle = "#121212";
  context.textAlign = "center";
  context.textBaseline = "middle";

  // Add text shadow for better contrast
  context.shadowColor = "black";
  context.shadowBlur = 4;
  context.shadowOffsetX = 2;
  context.shadowOffsetY = 2;

  // Draw text multiple times for stronger effect
  for (let i = 0; i < 3; i++) {
    context.fillText(text, size / 2, size / 2);
  }

  return new THREE.CanvasTexture(canvas);
};

const SolarSystem: React.FC<SolarSystemProps> = ({
  planetDetails,
  onClick,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useWindowSize();

  const mobileFactor = 0.5;
  const ORBIT_RADIUS_X = isMobile ? 9 * mobileFactor : 9; // Horizontal radius
  const ORBIT_RADIUS_Z = isMobile ? 12 * mobileFactor : 12; // Vertical radius
  const PLANET_SEGMENTS = 32; // Lower number = more optimization
  const BASE_PLANET_SIZE = 5;
  const PLANET_SCALE = isMobile ? 0.15 : 0.2;
  const SUN_SCALE = isMobile ? 2.2 * mobileFactor : 2.2;

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1224 / 552, 0.1, 1000);

    // Initialize renderer with proper context attributes
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: false,
      preserveDrawingBuffer: true
    });

    // Add error handling for WebGL context
    try {
      renderer.setSize(1224, 552);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      currentMount.appendChild(renderer.domElement);
    } catch (error) {
      console.error('WebGL Error:', error);
      // Fallback or error message could be added here
      return;
    }

    // Check if context is lost
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      console.error('WebGL context lost');
    });

    // Handle context restoration
    renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
      // Re-initialize necessary resources here
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    camera.position.z = 25;

    // Create meridians (vertical lines)
    const meridianGeometry = new THREE.BufferGeometry();
    const meridianPoints: number[] = [];
    const meridianCount = 12;

    for (let i = 0; i < meridianCount; i++) {
      const phi = (i / meridianCount) * Math.PI * 2;
      for (let j = 0; j <= 32; j++) {
        const theta = (j / 32) * Math.PI;
        const x = Math.sin(theta) * Math.cos(phi);
        const y = Math.cos(theta);
        const z = Math.sin(theta) * Math.sin(phi);
        meridianPoints.push(x, y, z);
      }
    }

    meridianGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(meridianPoints, 3)
    );
    const meridianMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });
    const meridians = new THREE.LineSegments(
      meridianGeometry,
      meridianMaterial
    );
    meridians.scale.set(SUN_SCALE, SUN_SCALE, SUN_SCALE);
    scene.add(meridians);

    // Create text label
    const sunLabelDiv = document.createElement("div");
    sunLabelDiv.className = `sun-label ${rubik.className}`;
    sunLabelDiv.textContent = "Zo World";
    sunLabelDiv.style.color = "white";
    sunLabelDiv.style.fontSize = "16px";
    sunLabelDiv.style.fontWeight = "bold";
    sunLabelDiv.style.pointerEvents = "none";
    sunLabelDiv.style.width = "fit-content";
    sunLabelDiv.style.textAlign = "center";

    const sunLabel = new CSS2DObject(sunLabelDiv);
    sunLabel.position.set(0, isMobile ? -30 : 0, 0);
    scene.add(sunLabel);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(1224, 552);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";
    if (currentMount) {
      currentMount.appendChild(labelRenderer.domElement);
    }

    const lineMaterial = new LineBasicMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.3,
      linewidth: 1,
    });

    const planets: {
      planet: THREE.Mesh;
      initialAngle: number;
      speed: number;
      delay: number;
      startTime: number;
      line?: Line;
    }[] = [];

    const handleMouseMove = (event: MouseEvent) => {
      const rect = currentMount!.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (!isMobile) {
        // Add slight camera movement based on mouse position
        const targetX = mouse.x * 1.5;
        const targetY = mouse.y * 1.5;
        camera.position.x += (targetX - camera.position.x) * 1.8;
        camera.position.y += (targetY - camera.position.y) * 1.8;
        camera.lookAt(scene.position);
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children);

      let isHovering = false;

      for (const intersect of intersects) {
        if (
          intersect.object instanceof THREE.Mesh &&
          intersect.object.userData.label
        ) {
          isHovering = true;
          break;
        }
      }

      if (isHovering) {
        currentMount?.classList.add("cursor-pointer");
      } else {
        currentMount?.classList.remove("cursor-pointer");
      }
    };

    // Define the debounced click handler within the effect scope
    const handleClick = debounce((event: MouseEvent) => {
      if (!currentMount) return;

      const rect = currentMount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      const meshIntersect = intersects.find(
        (intersect) =>
          intersect.object instanceof THREE.Mesh &&
          intersect.object.userData.key
      );

      if (meshIntersect) {
        event.preventDefault();
        event.stopPropagation();
        onClick(meshIntersect.object.userData.key);
      }
    }, 200);

    const loadPlanets = () => {
      planetDetails.forEach((details, index) => {
        const planetGeometry = new THREE.SphereGeometry(
          BASE_PLANET_SIZE,
          PLANET_SEGMENTS,
          PLANET_SEGMENTS
        );

        // Generate texture
        const textureCanvas = generatePlanetTexture(512);
        const texture = new THREE.CanvasTexture(textureCanvas);

        const labelTexture = createLabelTexture(details.label, 512);

        const planetMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.2,
          roughness: 0.8,
          bumpMap: texture,
          bumpScale: 0.05,
          emissiveMap: labelTexture,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: 2.0, // Increased intensity
        });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.scale.set(PLANET_SCALE, PLANET_SCALE, PLANET_SCALE);

        const angle = (2 * Math.PI * index) / planetDetails.length;
        planet.position.x = Math.cos(angle) * ORBIT_RADIUS_X;
        planet.position.z = Math.sin(angle) * ORBIT_RADIUS_Z;

        // // Add random rotation
        // planet.rotation.x = Math.random() * Math.PI;
        // planet.rotation.y = Math.random() * Math.PI;

        const points = [
          new Vector3(0, 0, 0),
          new Vector3(planet.position.x, planet.position.y, planet.position.z),
        ];
        const lineGeometry = new BufferGeometry().setFromPoints(points);
        const line = new Line(lineGeometry, lineMaterial);
        scene.add(line);
        scene.add(planet);

        const labelDiv = document.createElement("div");
        labelDiv.className = `planet-label ${rubik.className}`;
        labelDiv.textContent = details.label;
        labelDiv.style.color = "white";
        labelDiv.style.fontSize = isMobile ? "10px" : "14px";
        labelDiv.style.pointerEvents = "none";
        labelDiv.style.width = "fit-content";
        labelDiv.style.textAlign = "center";

        const labelObject = new CSS2DObject(labelDiv);
        labelObject.position.set(0, -15, 0); // 20px below the planet
        planet.add(labelObject);

        planet.userData.label = details.label;
        planet.userData.key = details.key;
        planet.userData.originalScale = PLANET_SCALE;

        planets.push({
          planet,
          initialAngle: angle,
          speed: 0.00005, // Further reduced speed
          delay: details.delay,
          startTime: performance.now(),
          line,
        });
      });

      // Add click event listener
      currentMount?.addEventListener("click", handleClick);
      currentMount?.addEventListener("mousemove", handleMouseMove);

      animate(performance.now());
    };

    const animate = (currentTime: number) => {
      requestAnimationFrame(animate);

      planets.forEach(
        ({ planet, initialAngle, speed, delay, startTime, line }) => {
          if (currentTime - startTime > delay * 1000) {
            const time = (currentTime - startTime) * speed;
            const angle = time + initialAngle;
            planet.position.x = Math.cos(angle) * ORBIT_RADIUS_X;
            planet.position.z = Math.sin(angle) * ORBIT_RADIUS_Z;

            if (line) {
              const lineGeometry = line.geometry;
              const positions = new Float32Array([
                0,
                0,
                0,
                planet.position.x,
                planet.position.y,
                planet.position.z,
              ]);
              lineGeometry.setAttribute(
                "position",
                new THREE.BufferAttribute(positions, 3)
              );
              lineGeometry.attributes.position.needsUpdate = true;
            }
          }
        }
      );

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };

    loadPlanets();

    scene.rotation.x = 10;
    scene.rotation.y = 2;
    scene.rotation.z = 0;

    const handleResize = () => {
      const sceneOffset = isMobile ? 24 : 0;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth - sceneOffset, window.innerHeight);
      labelRenderer.setSize(
        window.innerWidth - sceneOffset,
        isMobile ? window.innerWidth : window.innerHeight
      );
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
        currentMount.removeChild(labelRenderer.domElement);
        currentMount.removeEventListener("click", handleClick);
        currentMount.removeEventListener("mousemove", handleMouseMove);
      }

      planets.forEach((planet) => {
        if (planet.line) {
          scene.remove(planet.line);
          planet.line.geometry.dispose();
        }
      });

      // Proper cleanup
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
    };
  }, [
    ORBIT_RADIUS_X,
    ORBIT_RADIUS_Z,
    PLANET_SCALE,
    SUN_SCALE,
    isMobile,
    onClick,
    planetDetails,
  ]);

  return (
    <div
      ref={mountRef}
      style={{
        height: isMobile ? "340px" : "552px",
        width: isMobile ? "340px" : "1224px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    />
  );
};
export default memo(SolarSystem);
