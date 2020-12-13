var scene = new THREE.Scene();
var scene2 = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
camera.position.set( 0, 0, 300 );

var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setClearColor( 0x000000, 0 );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.domElement.style.position = 'absolute'; // required
renderer.domElement.style.top = 0;
renderer.domElement.style.zIndex = "1"; // required
document.querySelector('#webgl').appendChild( renderer.domElement );

var renderer2 = new THREE.CSS3DRenderer();
renderer2.setSize( window.innerWidth, window.innerHeight );
renderer2.domElement.style.position = 'absolute';
renderer2.domElement.style.top = 0;
document.querySelector('#css').appendChild( renderer2.domElement );

scene.background = new THREE.Color(0xDFDBD0);


var xOffset = 0;
var yOffset = 0;
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var intersects = []
var interactables = []

var parent = new THREE.Group();
scene.add(parent);

const boxGeo = new THREE.BoxGeometry(100, 100, 100);
const boxMat = new THREE.MeshPhongMaterial({color: 0x353942});
const box = new THREE.Mesh(boxGeo, boxMat);
parent.add(box)

function createButton(x, y, z, rot, width, height, name) {
    const buttonGeo = new THREE.BoxGeometry(width, height, 10);
    const buttonMat = new THREE.MeshPhongMaterial({color: 0xFFAB2E});
    const button = new THREE.Mesh(buttonGeo, buttonMat);
    button.name = name;
    button.position.set(x, y, z)
    button.rotation.set(0, rot, 0)
    parent.add(button)
    interactables.push(button);
}

function createText(font, text, size, x, y, z, rot) {
    var textGeo = new THREE.TextGeometry(text, {
        font: font,
        size: size,
        height: 1.5,
        curveSegments: 4,
    } );

    var textMesh = new THREE.Mesh(textGeo, new THREE.MeshToonMaterial({color:0xffffff}))
    textMesh.rotation.y = rot;

    if (x === -1) {
        textGeo.computeBoundingBox();
        const center = -(textGeo.boundingBox.max.x-textGeo.boundingBox.min.x)/2
        textMesh.position.set(center, y, z)
    } else if (z === -1) {
        textGeo.computeBoundingBox();
        const center = -(textGeo.boundingBox.max.x-textGeo.boundingBox.min.x)/2
        textMesh.position.set(x, y, center)
    } else if (z === -2) {
        textGeo.computeBoundingBox();
        const center = (textGeo.boundingBox.max.x-textGeo.boundingBox.min.x)/2
        textMesh.position.set(x, y, center)
    } else {
        textMesh.position.set(x, y, z)
    }
    parent.add(textMesh)
}

var loader = new THREE.FontLoader();
loader.load('/fonts/MuseoModerno_Regular.json', function (response) {
    createText(response, "Marching", 8, -1, 5, 50.1, 0);
    createText(response, "Cubes", 8, -1, -5, 50.1, 0);

    createText(response, "Flight", 6, -27, 32, 50.1, 0);
    createText(response, "Sandbox", 6, -10, -38, 50.1, 0);

    createText(response, "Flight", 8, -50.1, 32, -1, -Math.PI/2);
    createText(response, "Sandbox", 8, 50.1, 32, -2, Math.PI/2);

    createText(response, "Twitter\n@simplestudio02", 6, 40, 10, -50.1, Math.PI)
});

createButton(-35, 35, 50, 0, 10, 10, "flight");
createButton(35, -35, 50, 0, 10, 10, "sandbox");

createButton(-50, 35, 35, -Math.PI/2, 10, 10, "flight-back");
createButton(50, 35, 35, Math.PI/2, 10, 10, "sandbox-back");


createButton(-50, -35, 0, -Math.PI/2, 25, 10, "flight-play");
createButton(50, -35, 0, Math.PI/2, 25, 10, "sandbox-play");

createButton(0, -25, -50, Math.PI, 10, 10, "twitter-back");


var domObjects = []
var domMeshes = []
var flightRadius = 2;
var flightLength = 6;
var sandboxHeight = 100;
var sandboxRender = 5;

window.localStorage.setItem('flightRadius', flightRadius);
window.localStorage.setItem('flightLength', flightLength);
window.localStorage.setItem('sandboxHeight', sandboxHeight);
window.localStorage.setItem('sandboxRender', sandboxRender);

createInputs([{
    name: 'Radius',
    min: 1,
    max: 4,
    value: flightRadius,
    setVar: (value) => flightRadius = value
},
{
    name: 'Length',
    min: 1,
    max: 6,
    value: flightLength,
    setVar: (value) => flightLength = value,
}], -50.1, 0, 0, -Math.PI/2)

createInputs([{
    name: 'Height',
    min: 10,
    max: 200,
    value: sandboxHeight,
    setVar: (value) => sandboxHeight = value
},
{
    name: 'Render',
    min: 1,
    max: 10,
    value: sandboxRender,
    setVar: (value) => sandboxRender = value,
}], 50.1, 0, 0, Math.PI/2)

function createInputs(inputs, x, y, z, rot) {
    var inputContainer = document.createElement('div');
    inputContainer.className = 'input-container'

    for (var i = 0; i < inputs.length; i++) {
        const input = inputs[i];

        var rangeContainer = document.createElement('div');
        rangeContainer.className = 'range-container';
        rangeContainer.textContent = input.name
        var slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'slider'
        slider.min = input.min;
        slider.max = input.max;
        slider.value = input.value;
        var rangeValue = document.createElement('div');
        rangeValue.id = input.name;
        rangeValue.className = 'range-value';
        rangeValue.textContent = input.value;
        slider.addEventListener('input', (e) => {
            document.querySelector('#'+input.name).textContent = e.target.value
            input.setVar(parseInt(e.target.value))
        })
        rangeContainer.appendChild(slider);
        rangeContainer.appendChild(rangeValue);
        inputContainer.appendChild(rangeContainer);
    }

    var material = new THREE.MeshBasicMaterial({
        opacity	: 0,
        color	: 0x4C525F,
        blending: THREE.NoBlending,
        side	: THREE.DoubleSide,
    });
    var geometry = new THREE.PlaneGeometry(100, 50);
    var domMesh = new THREE.Mesh(geometry, material);
    domMesh.position.set(x, y, z);
    domMesh.rotation.set(0, rot, 0);
    parent.add(domMesh)
    
    var domObject = new THREE.CSS3DObject(inputContainer);
    domObject.position.copy(domMesh.position);
    domObject.rotation.copy(domMesh.rotation);
    scene2.add(domObject);

    domObjects.push(domObject);
    domMeshes.push(domMesh);
}



var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.7);
directionalLight.position.set(10, 10, 10);
scene.add( directionalLight );

var ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight)


var start = parent.rotation.y;
var time = 1;
var rotDir = 0;
var yRotationOffset = 0;

// Animate
var animate = function () {
    requestAnimationFrame(animate);

    if (time < 1) {
        parent.rotation.y = lerp(start, start+(Math.PI/2)*rotDir, time)
        time += 0.1;
        yRotationOffset = start+(Math.PI/2)*rotDir
    } else {
        start = yRotationOffset
    }

    if (time >= 1) {
        parent.rotation.y = yRotationOffset + xOffset/(window.innerWidth*5);
        parent.rotation.x = yOffset/(window.innerHeight*5);
    }

    for (var i = 0; i < domObjects.length; i++) {
        domObjects[i].rotation.copy(new THREE.Euler().setFromQuaternion(domMeshes[i].getWorldQuaternion()))
        domObjects[i].position.copy(domMeshes[i].getWorldPosition())
    }

	raycaster.setFromCamera(mouse, camera);

	intersects = raycaster.intersectObjects(interactables);

    scene.updateMatrixWorld()

    renderer.render(scene, camera);
    renderer2.render(scene2, camera);
};

animate();

function lerp(start, end, t) {
    return start * (1-t) + end * t;
}

window.addEventListener('mousemove', (e) => {
    xOffset = e.clientX - window.innerWidth/2;
    yOffset = e.clientY - window.innerHeight/2;

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
})

window.addEventListener('click', (e) => {
    if (intersects.length) {
        switch(intersects[0].object.name) {
            case 'twitter-back': rotDir = 2; time = 0; break;
            case 'flight': rotDir = 1; time = 0; break;
            case 'sandbox': rotDir = -1; time = 0; break;
            case 'flight-back': rotDir = -1; time = 0; break;
            case 'sandbox-back': rotDir = 1; time = 0; break;
            case 'flight-play': 
                window.localStorage.setItem('flightRadius', flightRadius)
                window.localStorage.setItem('flightLength', flightLength)
                window.location.href='/mode/flight.html'; 
                break;
            case 'sandbox-play': 
                window.localStorage.setItem('sandboxHeight', sandboxHeight)
                window.localStorage.setItem('sandboxRender', sandboxRender)
                window.location.href='/mode/sandbox.html'; 
                break;
        }
    }
})

var mouseDown = null
window.addEventListener('mousedown', (e) => {
    if (intersects.length) {
        mouseDown = intersects[0]
        mouseDown.object.scale.z = 0.5;
    }
})

window.addEventListener('mouseup', (e) => {
    if (mouseDown) {
        mouseDown.object.scale.z = 1;
        mouseDown = null;
    }
})

document.addEventListener( 'mousewheel', (e) => {
    camera.position.z -= e.wheelDeltaY * 0.05;
});

window.addEventListener('resize', function() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    renderer.setSize(width, height);
    renderer2.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

