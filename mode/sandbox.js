import {edges2, table} from './triangulation.js';

var scene = new THREE.Scene();
var camera =  new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

scene.background = new THREE.Color(0xA39A7E);

var clock = new THREE.Clock();

document.getElementById('back-btn').addEventListener('click', (e) => {
    console.log('click')
    window.location.href = '/'
})


var container = document.getElementById('container')
var blocker = document.getElementById('blocker')
container.appendChild(renderer.domElement);

var controls = new THREE.PointerLockControls(camera, container);
scene.add(controls.getObject());

getPointerLock();        

function getPointerLock() {
    document.onclick = function() {
        container.requestPointerLock();
    }
    document.addEventListener('pointerlockchange', lockChange, false);
}
function lockChange() {
    if (document.pointerLockElement === container) {
        blocker.style.display = "none";
        enablecontrols(true);
    } else {
        blocker.style.display = "";
        enablecontrols(false);
    }
}
function enablecontrols(enable) {
    controls.enabled = enable;
}

var camDir = new THREE.Vector3();
var keyDown = false;
// up, down, left, right
var keys = [false, false, false, false]
var grounded = false;
var prevGrounded = false;
var jumped = false;

document.addEventListener('keydown', (e) => {
    keyDown = true;
    switch(e.keyCode) {
        case 87: keys[0] = true; break;
        case 83: keys[1] = true; break;
        case 65: keys[2] = true; break;
        case 68: keys[3] = true; break;
        case 32: if (grounded || prevGrounded) jumped = true; break;
    }
})
document.addEventListener('keyup', (e) => {
    keyDown = false;
    switch(e.keyCode) {
        case 87: keys[0] = false; break;
        case 83: keys[1] = false; break;
        case 65: keys[2] = false; break;
        case 68: keys[3] = false; break;
    }
})

const surfaceLevel = -0.10;
const chunkSize = 10; // cubes
const chunkHeight = window.localStorage.getItem('sandboxHeight') ? parseInt(window.localStorage.getItem('sandboxHeight')) : 100;

var chunks = []
var loadedChunksX = []
var loadedChunksZ = []

const range = window.localStorage.getItem('sandboxRender') ? parseInt(window.localStorage.getItem('sandboxRender')) : 5;
camera.position.set(0, 100, 0);

noise.seed(Math.random());
// noise.seed(0.2123);

// Generate Chunks
for (let r = -range; r <= range; r++) {
    for (let c = -range; c <= range; c++) {
        generateChunk(c*chunkSize, 0, r*chunkSize)
    }
}


function generateChunk(xChunkOffset, yChunkOffset, zChunkOffset) {

loadedChunksX.push(xChunkOffset)
loadedChunksZ.push(zChunkOffset)
var noiseMap = []
var geoms = []

function getOffset(t) {
    return 0.001 * Math.pow(t, 3)
}

// Create Noise Map
let y = 0;
while(y <= chunkHeight) { // mapCubeHeight
    let level = []
    let z = 0;
    while (z <= chunkSize) { // mapCubeWidth
        let x = 0;
        while (x <= chunkSize) { // mapCubeLength

            let y2 = chunkHeight-y
            let offset = 0;
            if (y2 < 10)
                offset = getOffset(y2-10)
            else
                offset = (y2-10)/(chunkHeight-10) // mapCubeHeight

            const value = noise.perlin3((x+xChunkOffset)/50, (y+yChunkOffset)/50, (z+zChunkOffset)/50) + offset;

            level.push(value)
            x++;
        }
        z++;
    }
    noiseMap.push(level);
    y++;
}

// Create Mesh Triangles
var i = 0;
var uniqueCubes = new Array(256)
let j = noiseMap.length-1;
while (j > 1) {
    let k = noiseMap[j].length-1;
    while (k > chunkSize+1) {
        if (k % (chunkSize+1) !== 0) { // mapCubeLength
            var cubeIndex = 0;
            const mapj = noiseMap[j];
            const mapj1 = noiseMap[j-1];
            if (mapj[k] < surfaceLevel)
                cubeIndex += 1 << 0;

            if (mapj[k-1] < surfaceLevel)
                cubeIndex += 1 << 1;

            if (mapj[k-2-chunkSize] < surfaceLevel) // mapCubeLength
                cubeIndex += 1 << 2;

            if (mapj[k-1-chunkSize] < surfaceLevel) // mapCubeLength
                cubeIndex += 1 << 3;

            if (mapj1[k] < surfaceLevel)
                cubeIndex += 1 << 4;

            if (mapj1[k-1] < surfaceLevel)
                cubeIndex += 1 << 5;

            if (mapj1[k-2-chunkSize] < surfaceLevel) // mapCubeLength
                cubeIndex += 1 << 6;

            if (mapj1[k-1-chunkSize] < surfaceLevel) // mapCubeLength
                cubeIndex += 1 << 7;

            const xOffset = (i % (chunkSize)) - xChunkOffset; // mapCubeLength
            const yOffset = (Math.floor(i / (chunkSize*chunkSize))) - yChunkOffset; // mapCubeLength*mapCubeWidth
            const zOffset = (Math.floor((i % (chunkSize*chunkSize)) / chunkSize)) - zChunkOffset; // mapCubeLength*mapCubeWidth mapCubeLength
        
    if (cubeIndex !== 0 && cubeIndex !== 255) {
        if (uniqueCubes[cubeIndex] === undefined) {
            const vertices = table[cubeIndex];
    
            var cube = []
            var v = 0;
            while (vertices[v] !== -1) {
    
                    const vertex1 = edges2[vertices[v]];
                    const vertex2 = edges2[vertices[v+1]];
                    const vertex3 = edges2[vertices[v+2]];
    

                    var geom2 = new THREE.BufferGeometry();
                    var v3 = new Float32Array([
                        vertex1[0], vertex1[1], vertex1[2],
                        vertex2[0], vertex2[1], vertex2[2],
                        vertex3[0], vertex3[1], vertex3[2]
                    ])  
                    geom2.setAttribute('position', new THREE.BufferAttribute(v3, 3))
                    cube.push(geom2);
                    v += 3;
            }
            const mergeCube = THREE.BufferGeometryUtils.mergeBufferGeometries(cube);
            uniqueCubes[cubeIndex] = mergeCube
        }

            var geom = uniqueCubes[cubeIndex].clone();
            var pos = geom.attributes.position.array;
            var posLen = geom.attributes.position.array.length;
            for (var p = 0; p < posLen; p+=3) {
                pos[p] += xOffset
                pos[p+1] += yOffset
                pos[p+2] += zOffset
            }
            
            geom.attributes.position.needsUpdate = true

            geoms.push(geom);
        }
        i++;

          
        }

        k--;
    }

    j--;
}

var chunk = THREE.BufferGeometryUtils.mergeBufferGeometries(geoms)

chunk.computeVertexNormals();
var mesh = new THREE.Mesh(chunk, new THREE.MeshNormalMaterial({side:THREE.DoubleSide}));
chunks.push(mesh)

scene.add(mesh)
}

// Lighting
var ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

var raycaster = new THREE.Raycaster(camera.position, new THREE.Vector3(0, -1, 0));
const gravity = 5;
const speed = 30;
var yVel = 0;
const maxYVel = 100;
const jumpVel = 100;
var groundDelay = 0;

// Movement
function move(delta) {
    if (groundDelay > 0) {
        groundDelay--;
    } else {
        prevGrounded = grounded;
    }

    let moveX = 0;
    let moveZ = 0;

    const camDirX = Math.abs(camDir.x)/camDir.x;
    const camDirZ = Math.abs(camDir.z)/camDir.z;
    const camMoveX = camDir.x * speed * delta;
    const camMoveZ = camDir.z * speed * delta;

    if (keys[0]) {
        camera.position.x += camMoveX;
        camera.position.z += camMoveZ;
        moveX += camDirX;
        moveZ += camDirZ;
    }
    if (keys[1]) {
        camera.position.x -= camMoveX;
        camera.position.z -= camMoveZ;
        moveX -= camDirX;
        moveZ -= camDirZ;
    }
    if (keys[2]) {
        camera.position.x += camMoveZ;
        camera.position.z -= camMoveX;
        moveX += camDirZ;
        moveZ -= camDirX;
    }
    if (keys[3]) {
        camera.position.x -= camMoveZ;
        camera.position.z += camMoveX;
        moveX -= camDirZ;
        moveZ += camDirX;
    }

    if (jumped) {
        yVel -= jumpVel;
        camera.position.y -= yVel * delta
        jumped = false;
        grounded = false;
        prevGrounded = false;
    } else {
        try {
            const intersects = raycaster.intersectObjects(chunks);
            const distance = intersects[0].distance
            if (distance <= 10) {
                camera.position.y += 10-distance
                grounded = true;
                yVel = 0;
            } else {
                const fall = yVel * delta;
                if (distance-fall < 10) {
                    camera.position.y -= distance-10
                } else {
                    camera.position.y -= fall
                }
                grounded = false;
                if (yVel < maxYVel)
                    yVel += gravity;
                else
                    yVel = maxYVel;
            }
        } catch (error) {
            
        }
    }

    if (prevGrounded && !grounded) {
        prevGrounded = true;
        groundDelay = 10;
    }

    // Chunk Rendering
    var chunksX = [-Math.floor(camera.position.x/chunkSize)*chunkSize]
    var chunksZ = [-Math.floor(camera.position.z/chunkSize)*chunkSize]

    const xRange = -Math.floor((camera.position.x/chunkSize+range))*chunkSize;
    const xRangeBack = -Math.floor((camera.position.x/chunkSize-range))*chunkSize;
    const zRange = -Math.floor((camera.position.z/chunkSize+range))*chunkSize;
    const zRangeBack = -Math.floor((camera.position.z/chunkSize-range))*chunkSize;
    for (let k = -range; k <= range; k++) {
        const deltaZ = -Math.floor((camera.position.z/chunkSize+k))*chunkSize;
        const deltaX = -Math.floor((camera.position.x/chunkSize+k))*chunkSize;

        if (moveX > 0) {
            chunksX.push(xRange)
            chunksZ.push(deltaZ)
        } else if (moveX < 0) {
            chunksX.push(xRangeBack)
            chunksZ.push(deltaZ)
        }

        if (moveZ > 0) {
            chunksX.push(deltaX)
            chunksZ.push(zRange)
        } else if (moveZ < 0) {
            chunksX.push(deltaX)
            chunksZ.push(zRangeBack)
        }

    }
    
    const loadIndex = loadedChunksX.length-1;
    for (let i = loadIndex; i >= 0; i--) {
        if (chunksX.length) {
            for (let c = chunksX.length; c >= 0; c--) {
                if (loadedChunksX[i] === chunksX[c] && loadedChunksZ[i] === chunksZ[c]) {
                    chunksX.splice(c, 1);
                    chunksZ.splice(c, 1);
                }
            }
        } else {
            break;
        }
    }
    if(chunksX.length) {
        for (let i = 0; i < chunksX.length; i++) {
            generateChunk(chunksX[i], 0, chunksZ[i])
        }
    }

}


// Animate
var animate = function () {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    move(delta);

    camera.getWorldDirection(camDir);
;
    renderer.render(scene, camera);
};

animate();

// Resize
window.addEventListener('resize', function() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});