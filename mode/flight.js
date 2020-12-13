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


var controls = new THREE.FlyControls( camera, renderer.domElement );

controls.movementSpeed = 80;
controls.domElement = renderer.domElement;
controls.rollSpeed = Math.PI / 4;
controls.autoForward = false;
controls.dragToLook = false;


var container = document.getElementById('container')
container.appendChild(renderer.domElement);

const surfaceLevel = -0.1;
const chunkSize = 50; // cubes

const mapWidth = window.localStorage.getItem('flightRadius') ? parseInt(window.localStorage.getItem('flightRadius')) : 2;
const mapLength = window.localStorage.getItem('flightLength') ? parseInt(window.localStorage.getItem('flightLength')) : 4;
const mapHeight = mapWidth;

const mapCubeWidth = mapWidth * chunkSize; // cubes
const mapCubeLength = mapLength * chunkSize; // cubes
const mapCubeHeight = mapHeight * chunkSize; // cubes

var chunks = []

var geometry = new THREE.BoxGeometry(mapCubeLength, mapCubeHeight, mapCubeWidth);
var geo = new THREE.EdgesGeometry(geometry); // or WireframeGeometry( geometry )
var mat = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 2});
var wireframe = new THREE.LineSegments(geo, mat);
wireframe.position.x = -mapCubeLength/2 + chunkSize;
wireframe.position.z = -mapCubeWidth/2 + chunkSize;
wireframe.position.y = -mapCubeHeight/2 + chunkSize;
scene.add(wireframe);

var box = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial({color: 0x346294, side:THREE.BackSide}))
box.position.x = -mapCubeLength/2 + chunkSize;
box.position.z = -mapCubeWidth/2 + chunkSize;
box.position.y = -mapCubeHeight/2 + chunkSize;
// scene.add(box)

camera.position.set(3*chunkSize, 0, 0)
camera.lookAt(new THREE.Vector3(0, 0, 0))

noise.seed(Math.random());
// noise.seed(0.2123);

for (let y = 0; y < mapHeight; y++) {
    for (let z = 0; z < mapWidth; z++) {
        for (let x = 0; x < mapLength; x++) {
            generateChunk(x*chunkSize, y*chunkSize, z*chunkSize)
        }
    }
}

function generateChunk(xChunkOffset, yChunkOffset, zChunkOffset) {
var noiseMap = []
var geoms = []

let y = 0;
while(y <= chunkSize) { // mapCubeHeight
    let level = []
    let z = 0;
    while (z <= chunkSize) { // mapCubeWidth
        let x = 0;
        while (x <= chunkSize) { // mapCubeLength

            var value = noise.perlin3((x+xChunkOffset)/50, (y+yChunkOffset)/50, (z+zChunkOffset)/50);
            level.push(value)
            x++;
        }

        z++;
    }
    
    noiseMap.push(level);
    y++;
}


// console.log("GENERATE WORLD")
var i = 0;
var uniqueCubes = new Array(256)

// const heightLength = noiseMap.length-1;
// const levelLength = (mapCubeLength+1)*(mapCubeWidth+1)-mapCubeLength;
const heightLength = noiseMap.length-1;
// const levelLength = map[j].length-mapCubeLength;
const levelLength = (mapCubeLength+1)*(mapCubeWidth+1)-mapCubeLength;

let j = noiseMap.length-1;
while (j > 0) {
    
    // const levelLength = noiseMap[j].length-chunkSize-1; //mapCubeLength
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

            // cubes.push(cubeIndex)


            const xOffset = (i % (chunkSize)) - xChunkOffset; // mapCubeLength
            const yOffset = (Math.floor(i / (chunkSize*chunkSize))) - yChunkOffset; // mapCubeLength*mapCubeWidth
            const zOffset = (Math.floor((i % (chunkSize*chunkSize)) / chunkSize)) - zChunkOffset; // mapCubeLength*mapCubeWidth mapCubeLength
        
            // console.log("OFFSET", xOffset, yOffset, zOffset)
    // const triangleIndex = cubeIndex
    if (cubeIndex !== 0 && cubeIndex !== 255) {

        if (uniqueCubes[cubeIndex] === undefined) {
            // console.log("UNIQUE", cubeIndex)
            const vertices = table[cubeIndex];
    
            // const yOffset = Math.floor(i / (mapCubeLength*mapCubeWidth));
            // const xOffset = i % mapCubeLength;
            // const zOffset = Math.floor((i % (mapCubeLength*mapCubeWidth)) / mapCubeLength)
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
                    // console.log("GEOM", geom2)
                    // uniqueCubes[cubeIndex] = geom2;
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

// Animate
var animate = function () {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    controls.update(delta);
    renderer.render(scene, camera);
};

animate();

window.addEventListener('resize', function() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});