import { RoundedBoxGeometry } from './node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as THREE from '../portfolio-3d-cube-2/lib/three.js';

// element: a jQuery object containing the DOM element to use
// dimensions: the number of cubes per row/column (default 3)
// background: the scene background colour
function Rubik(element, dimensions, background) {

  dimensions = dimensions || 3;
  background = background || 0x303030;

  var width = element.innerWidth(),
      height = element.innerHeight();

  var debug = false;

  /*** three.js boilerplate ***/
  var scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000),
      renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setClearColor(background, 1.0);
  renderer.setSize(width, height);
  renderer.shadowMapEnabled = true;
  element.append(renderer.domElement);

  camera.position = new THREE.Vector3(-20, 20, 30);
  camera.lookAt(scene.position);
  THREE.Object3D._threexDomEvent.camera(camera);

  /*** Lights ***/
  scene.add(new THREE.AmbientLight(0xffffff));
  var spotlight = new THREE.SpotLight(0xffffff);
  spotlight.position.set(-20, 20, 30);
  spotlight.castShadow = true;
  scene.add(spotlight);

  /*** Camera controls ***/
  var orbitControl = new THREE.OrbitControls(camera, renderer.domElement);

  function enableCameraControl() {
    orbitControl.noRotate = false;
  }

  function disableCameraControl() {
    orbitControl.noRotate = true;
  }

  /*** Debug aids ***/  
  if(debug) {
    scene.add(new THREE.AxisHelper( 20 ));
  }

  /*** Click handling ***/

  //Do the given coordinates intersect with any cubes?
  var SCREEN_HEIGHT = window.innerHeight;
  var SCREEN_WIDTH = window.innerWidth;

  var raycaster = new THREE.Raycaster(),
      projector = new THREE.Projector();

  function isMouseOverCube(mouseX, mouseY) {
    var directionVector = new THREE.Vector3();

    //Normalise mouse x and y
    var x = ( mouseX / SCREEN_WIDTH ) * 2 - 1;
    var y = -( mouseY / SCREEN_HEIGHT ) * 2 + 1;

    directionVector.set(x, y, 1);

    projector.unprojectVector(directionVector, camera);
    directionVector.sub(camera.position);
    directionVector.normalize();
    raycaster.set(camera.position, directionVector);

    return raycaster.intersectObjects(allCubes, true).length > 0;
  }

  //Return the axis which has the greatest maginitude for the vector v
  function principalComponent(v) {
    var maxAxis = 'x',
        max = Math.abs(v.x);
    if(Math.abs(v.y) > max) {
      maxAxis = 'y';
      max = Math.abs(v.y);
    }
    if(Math.abs(v.z) > max) {
      maxAxis = 'z';
      max = Math.abs(v.z);
    }
    return maxAxis;
  }

  //For each mouse down, track the position of the cube that
  // we clicked (clickVector) and the face object that we clicked on 
  // (clickFace)
  var clickVector, clickFace;

  //Keep track of the last cube that the user's drag exited, so we can make
  // valid movements that end outside of the Rubik's cube
  var lastCube;

  var onCubeMouseDown = function(e, cube) {
    disableCameraControl();

    //Maybe add move check in here
    if(true || !isMoving) {
      clickVector = cube.rubikPosition.clone();
      
      var centroid = e.targetFace.centroid.clone();
      centroid.applyMatrix4(cube.matrixWorld);

      //Which face (of the overall cube) did we click on?
      if(nearlyEqual(Math.abs(centroid.x), maxExtent))
        clickFace = 'x';
      else if(nearlyEqual(Math.abs(centroid.y), maxExtent))
        clickFace = 'y';
      else if(nearlyEqual(Math.abs(centroid.z), maxExtent))
        clickFace = 'z';    
    }  
  };

  //Matrix of the axis that we should rotate for 
  // each face-drag action
  //    F a c e
  // D    X Y Z
  // r  X - Z Y
  // a  Y Z - X
  // g  Z Y X -
  var transitions = {
    'x': {'y': 'z', 'z': 'y'},
    'y': {'x': 'z', 'z': 'x'},
    'z': {'x': 'y', 'y': 'x'}
  }

  var onCubeMouseUp = function(e, cube) {

    if(clickVector) {
      //Use the actual mouse end coordinates for finer drag control
      var dragVector = new THREE.Vector3(e.clientX, e.clientY, 0);
      dragVector.sub(clickVector);

      //Don't move if the "drag" was too small, to allow for 
      // click-and-change-mind.
      if(dragVector.length() > cubeSize) {

        //Rotate with the most significant component of the drag vector
        // (excluding the current axis, because we can't rotate that way)
        var dragVectorOtherAxes = dragVector.clone();
        dragVectorOtherAxes[clickFace] = 0;

        var maxAxis = principalComponent(dragVectorOtherAxes);

        var rotateAxis = transitions[clickFace][maxAxis],
            direction = dragVector[maxAxis] >= 0 ? 1 : -1;
        
        //Reverse direction of some rotations for intuitive control
        if(clickFace == 'z' && rotateAxis == 'x' || 
           clickFace == 'x' && rotateAxis == 'z' ||
           clickFace == 'y' && rotateAxis == 'z')
          direction *= -1;

        if(clickFace == 'x' && clickVector.x > 0 ||
           clickFace == 'y' && clickVector.y < 0 ||
           clickFace == 'z' && clickVector.z < 0)
          direction *= -1;

        pushMove(cube, clickVector.clone(), rotateAxis, direction);
        startNextMove();
        enableCameraControl();
      } else {
        console.log("Drag me some more please!");
      }
    }
  };

  //If the mouse was released outside of the Rubik's cube, use the cube that the mouse 
  // was last over to determine which move to make
  var onCubeMouseOut = function(e, cube) {
    //TODO: there is a possibility that, at some rotations, we may catch unintentional
    // cubes on the way out. We should check that the selected cube is on the current
    // drag vector.
    lastCube = cube;
  }

  element.on('mouseup', function(e) {
    if(!isMouseOverCube(e.clientX, e.clientY)) {
      if(lastCube)
        onCubeMouseUp(e, lastCube);
    }
  });

  /*** Build 27 cubes ***/
  var colours = [0xC41E3A, 0x009E60, 0x0051BA, 0xFF5800, 0xFFD500, 0xFFFFFF],
      faceMaterials = colours.map(function(c) {
        return new THREE.MeshLambertMaterial({ color: c , ambient: c});
      }),
      blackMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 }),
      cubeMaterials = new THREE.MeshFaceMaterial(faceMaterials.concat([blackMaterial]));
    
      var cubeSize = 6,
      spacing = 0, // pas d'espacement entre les cubies
      increment = cubeSize + spacing,
      maxExtent = (cubeSize * dimensions + spacing * (dimensions - 1)) / 2, 
      allCubes = [];
  
  // Dans newCube, utilisez RoundedBoxGeometry à la place de CubeGeometry
  function newCube(x, y, z) {
    // Assurez-vous d'avoir importé RoundedBoxGeometry depuis, par exemple, three.js addons
    var cubeGeometry = new RoundedBoxGeometry(cubeSize, cubeSize, cubeSize, 5, 0.1);
    
    var cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
    cube.castShadow = true;
  
    cube.position.set(x, y, z);
    cube.rubikPosition = cube.position.clone();
  
    cube.on('mousedown', function(e) {
      onCubeMouseDown(e, cube);
    });
  
    cube.on('mouseup', function(e) {
      onCubeMouseUp(e, cube);
    });
  
    cube.on('mouseout', function(e) {
      onCubeMouseOut(e, cube);
    });
  
    scene.add(cube);
    allCubes.push(cube);
  }
  
  var positionOffset = (dimensions - 1) / 2;
  for(var i = 0; i < dimensions; i ++) {
    for(var j = 0; j < dimensions; j ++) {
      for(var k = 0; k < dimensions; k ++) {

        var x = (i - positionOffset) * increment,
            y = (j - positionOffset) * increment,
            z = (k - positionOffset) * increment;

        newCube(x, y, z);
      }
    }
  }

  /*** Manage transition states ***/

  //Encapsulate each transition into a "Move" object, and keep a stack of moves
  function Move(cube, vector, axis, direction) {
    this.cube = cube;
    this.vector = vector;
    this.axis = axis;
    this.direction = direction;
  }

  var moveEvents = $({});

  //Maintain a queue of moves so we can perform compound actions like shuffle and solve
  var moveQueue = [],
      completedMoveStack = [],
      currentMove;

  //Are we in the middle of a transition?
  var isMoving = false,
      moveAxis, moveN, moveDirection,
      rotationSpeed = 0.2;

  //http://stackoverflow.com/questions/20089098/three-js-adding-and-removing-children-of-rotated-objects
  var pivot = new THREE.Object3D(),
      activeGroup = [];

  function nearlyEqual(a, b, d) {
    d = d || 0.001;
    return Math.abs(a - b) <= d;
  }

  //Select the plane of cubes that aligns with clickVector
  // on the given axis
  function setActiveGroup(axis) {
    if(clickVector) {
      activeGroup = [];

      allCubes.forEach(function(cube) {
        if(nearlyEqual(cube.rubikPosition[axis], clickVector[axis])) { 
          activeGroup.push(cube);
        }
      });
    } else {
      console.log("Nothing to move!");
    }
  }

  var pushMove = function(cube, clickVector, axis, direction) {
    moveQueue.push(new Move(cube, clickVector, axis, direction));
  }

  var startNextMove = function() {
    var nextMove = moveQueue.pop();

    if(nextMove) {
      clickVector = nextMove.vector;
      
      var direction = nextMove.direction || 1,
          axis = nextMove.axis;

      if(clickVector) {

        if(!isMoving) {
          isMoving = true;
          moveAxis = axis;
          moveDirection = direction;

          setActiveGroup(axis);

          pivot.rotation.set(0,0,0);
          pivot.updateMatrixWorld();
          scene.add(pivot);

          activeGroup.forEach(function(e) {
            THREE.SceneUtils.attach(e, scene, pivot);
          });

          currentMove = nextMove;
        } else {
          console.log("Already moving!");
        }
      } else {
        console.log("Nothing to move!");
      }
    } else {
      moveEvents.trigger('deplete');
    }
  }

  function doMove() {
    //Move a quarter turn then stop
    if(pivot.rotation[moveAxis] >= Math.PI / 2) {
      //Compensate for overshoot. TODO: use a tweening library
      pivot.rotation[moveAxis] = Math.PI / 2;
      moveComplete();
    } else if(pivot.rotation[moveAxis] <= Math.PI / -2) {
      pivot.rotation[moveAxis] = Math.PI / -2;
      moveComplete()
    } else {
      pivot.rotation[moveAxis] += (moveDirection * rotationSpeed);
    }
  }

  var moveComplete = function() {
    isMoving = false;
    moveAxis, moveN, moveDirection = undefined;
    clickVector = undefined;

    pivot.updateMatrixWorld();
    scene.remove(pivot);
    activeGroup.forEach(function(cube) {
      cube.updateMatrixWorld();

      cube.rubikPosition = cube.position.clone();
      cube.rubikPosition.applyMatrix4(pivot.matrixWorld);

      THREE.SceneUtils.detach(cube, pivot, scene);
    });

    completedMoveStack.push(currentMove);

    moveEvents.trigger('complete');

    //Are there any more queued moves?
    startNextMove();
  }


  function render() {

    //States
    if(isMoving) {
      doMove();
    } 

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  /*** Util ***/
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  //Go!
  render();

  //Public API
  return {
    shuffle: function() {
      function randomAxis() {
        return ['x', 'y', 'z'][randomInt(0,2)];
      }

      function randomDirection() {
        var x = randomInt(0,1);
        if(x == 0) x = -1;
        return x;
      }

      function randomCube() {
        var i;
        do {
          i = randomInt(0, allCubes.length - 1);
        } while (Math.abs(allCubes[i].rubikPosition.x) < maxExtent &&
                 Math.abs(allCubes[i].rubikPosition.y) < maxExtent &&
                 Math.abs(allCubes[i].rubikPosition.z) < maxExtent);
        return allCubes[i];
      }

      var nMoves = randomInt(10, 40);
      var lastAxis;
      for(var i = 0; i < nMoves; i ++) {
        var axis;
        do {
          axis = randomAxis();
        } while (axis === lastAxis);
        lastAxis = axis;
        var cube = randomCube();
        pushMove(cube, cube.position.clone(), axis, randomDirection());
      }

      startNextMove();
    },

    //A naive solver - step backwards through all completed steps
    solve: function() {
      if(!isMoving) {
        completedMoveStack.forEach(function(move) {
          pushMove(move.cube, move.vector, move.axis, move.direction * -1);
        });

        //Don't remember the moves we're making whilst solving
        completedMoveStack = [];

        moveEvents.one('deplete', function() {
          completedMoveStack = [];
        });

        startNextMove();
      }
    },

    //Rewind the last move
    undo: function() {
      if(!isMoving) {
        var lastMove = completedMoveStack.pop();
        if(lastMove) {
          //clone
          var stackToRestore = completedMoveStack.slice(0);
          pushMove(lastMove.cube, lastMove.vector, lastMove.axis, lastMove.direction * -1);

          moveEvents.one('complete', function() {
            completedMoveStack = stackToRestore;
          });

          startNextMove();
        }
      }
    }
  }
}
