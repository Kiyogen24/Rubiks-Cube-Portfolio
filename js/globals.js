import * as THREE from 'three';

export const app = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    cubies: [],
    rubiksCube: null,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    lastCameraPosition: null,
    lastCameraRotation: null,
    isZoomed: false,
    isModalOpen: false,
    isDragging: false,
    menuOpen: false,
    cubeSize: 1,
    gap: 0.001,
    positions: [-1, 0, 1],
    
};

