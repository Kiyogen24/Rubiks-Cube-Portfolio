import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { app } from '../globals.js';

// Scène, caméra, rendu, contrôles de la caméra et lumières
export function createScene() {
  app.scene = new THREE.Scene();

  app.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  app.camera.position.set(5, 5, 7);
  app.camera.lookAt(0, 0, 0);

  app.renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    precision: 'highp',
    powerPreference: 'high-performance',
  });
  app.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // au-delà, coût élevé pour un gain invisible
  app.renderer.setSize(window.innerWidth, window.innerHeight);
  app.renderer.shadowMap.enabled = true;
  app.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Le canvas est placé dans la section du cube
  document.getElementById('cube-section').appendChild(app.renderer.domElement);
  app.renderer.domElement.style.position = 'absolute';

  app.controls = new OrbitControls(app.camera, app.renderer.domElement);
  app.controls.enableDamping = true;
  app.controls.dampingFactor = 0.05;
  app.controls.enablePan = false;
  app.controls.rotateSpeed = 0.5; // rotation ralentie pour un meilleur contrôle
  app.controls.minDistance = 5;
  app.controls.maxDistance = 15;

  app.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(10, 10, 10);
  app.scene.add(directionalLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-10, -10, -10);
  app.scene.add(fillLight);

  window.addEventListener('resize', () => {
    app.camera.aspect = window.innerWidth / window.innerHeight;
    app.camera.updateProjectionMatrix();
    app.renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// Fonctions appelées à chaque image, avant le rendu : callback(dt en secondes, temps en ms)
const frameCallbacks = [];

export function onFrame(callback) {
  frameCallbacks.push(callback);
}

export function startRenderLoop() {
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    frameCallbacks.forEach((callback) => callback(dt, now));
    app.controls.update();
    app.renderer.render(app.scene, app.camera);
  }
  requestAnimationFrame(frame);
}
