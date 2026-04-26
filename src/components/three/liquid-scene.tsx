"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function LiquidScene() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.z = 5.8;

    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!context) {
      drawCanvasFallback(canvas, host.clientWidth, host.clientHeight);
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      context,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(host.clientWidth, host.clientHeight);

    const geometry = new THREE.IcosahedronGeometry(1.9, 18);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.22,
      metalness: 0.02,
      transmission: 0.72,
      thickness: 0.8,
      transparent: true,
      opacity: 0.42,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(2.7, -0.2, 0);
    scene.add(mesh);

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = lowPower ? 64 : 160;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particlesGeometry,
      new THREE.PointsMaterial({
        color: 0x111111,
        size: 0.018,
        transparent: true,
        opacity: 0.22,
      }),
    );
    scene.add(particles);

    scene.add(new THREE.AmbientLight(0xffffff, 2.4));
    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(-2, 4, 5);
    scene.add(key);

    let frame = 0;
    let active = true;
    const animate = () => {
      if (!active) return;
      frame += 0.006;
      mesh.rotation.x = Math.sin(frame) * 0.14;
      mesh.rotation.y += 0.002;
      mesh.position.y = Math.sin(frame * 1.8) * 0.16;
      particles.rotation.y -= 0.0008;
      renderer.render(scene, camera);
      if (reducedMotion) return;
      requestAnimationFrame(animate);
    };

    const resize = () => {
      if (!host) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };

    window.addEventListener("resize", resize);
    animate();

    return () => {
      active = false;
      window.removeEventListener("resize", resize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      particlesGeometry.dispose();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-80"
      aria-hidden
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

function drawCanvasFallback(canvas: HTMLCanvasElement, width: number, height: number) {
  const pixelRatio = Math.min(window.devicePixelRatio, 1.6);
  canvas.width = Math.max(1, Math.floor(width * pixelRatio));
  canvas.height = Math.max(1, Math.floor(height * pixelRatio));

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.scale(pixelRatio, pixelRatio);
  const gradient = ctx.createRadialGradient(
    width * 0.78,
    height * 0.2,
    20,
    width * 0.78,
    height * 0.2,
    width * 0.48,
  );
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.45, "rgba(230,230,226,0.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(0,0,0,0.18)";

  for (let i = 0; i < 42; i += 1) {
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
