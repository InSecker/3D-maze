import "./style.css";
import * as THREE from "three";
import * as CANNON from "cannon";

const win = document.querySelector(".win") as HTMLParagraphElement;
let hardcore = false;

const computeHardcore = () => {
    hardcore = !hardcore;
    if (hardcore) {
        // disable sides
        sides.forEach((side) => {
            world.remove(side.body);
            scene.remove(side.mesh);
        });
    } else {
        // enable sides
        sides.forEach((side) => {
            world.addBody(side.body);
            scene.add(side.mesh);
        });
    }
};

document.addEventListener("click", () => {
    computeHardcore();
});

let canShake = true;

if (window.DeviceMotionEvent) {
    window.addEventListener(
        "devicemotion",
        (event) => {
            if (
                event.acceleration !== null &&
                event.acceleration.x !== null &&
                event.acceleration.y !== null &&
                event.acceleration.z !== null
            ) {
                if (
                    Math.abs(event.acceleration.x) +
                        Math.abs(event.acceleration.y) +
                        Math.abs(event.acceleration.z) >
                        60 &&
                    canShake
                ) {
                    computeHardcore();
                    canShake = false;
                    setTimeout(() => {
                        canShake = true;
                    }, 1000);
                }
            }
        },
        true
    );
}

const sizes = {
    width: document.body.clientWidth,
    height: document.body.clientHeight,
};

let x = 0;
let y = 0;

if (window.DeviceOrientationEvent) {
    window.addEventListener(
        "deviceorientation",
        (event) => {
            if (
                event.alpha !== null &&
                event.beta !== null &&
                event.gamma !== null
            ) {
                y = Math.floor(event.gamma * 100) / 100;
                x = Math.floor(event.beta * 100) / 100;
            }
        },
        true
    );
}

if (window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("mousemove", (event) => {
        y = (event.clientX / window.innerWidth) * 60 - 30;
        x = (event.clientY / window.innerHeight) * 60 - 30;
    });
}

// init

const world = new CANNON.World();
world.gravity.set(0, 0, -9);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// BALL

const shape = new CANNON.Sphere(0.03);
const body = new CANNON.Body({
    mass: 10,
});
body.addShape(shape);
body.position.set(-0.22, 0.22, 0.2);
world.addBody(body);

const ballMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.03),
    new THREE.MeshPhongMaterial({
        color: 0xffffff,
    })
);
ballMesh.castShadow = true;
ballMesh.receiveShadow = true;

// FLOOR

const rectShape = new CANNON.Box(new CANNON.Vec3(0.3, 0.3, 0.05));
const rectBody = new CANNON.Body({
    mass: 0,
});
rectBody.addShape(rectShape);
rectBody.position.set(0, 0, 0);
world.addBody(rectBody);

const rectMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.6, 0.1),
    new THREE.MeshPhongMaterial({
        color: 0xaaaaaa,
    })
);
rectMesh.receiveShadow = true;

// WALLS
const createWall = (width: number, height: number, x: number, y: number) => {
    const group = new THREE.Group();
    const shape = new CANNON.Box(new CANNON.Vec3(width, height, 0.2));
    const body = new CANNON.Body({
        mass: 0,
    });
    body.addShape(shape);
    body.position.set(x, y, 0);
    world.addBody(body);

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width * 2, height * 2, 0.1 * 2),
        new THREE.MeshPhongMaterial({
            color: 0x0f1188,
        })
    );
    mesh.receiveShadow = true;
    scene.add(group);

    group.add(mesh);

    mesh.position.copy(
        new THREE.Vector3(body.position.x, body.position.y, body.position.z)
    );
    mesh.quaternion.copy(
        new THREE.Quaternion(
            body.quaternion.x,
            body.quaternion.y,
            body.quaternion.z,
            body.quaternion.w
        )
    );
    return { body, mesh: group };
};

// CREATE CAMERA

const camera = new THREE.PerspectiveCamera(
    70,
    sizes.width / sizes.height,
    0.01,
    10
);
camera.position.z = 1;

const scene = new THREE.Scene();
scene.add(rectMesh, ballMesh);
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 0, 2);
light.castShadow = true;
scene.add(light);
light.target = ballMesh;

// WALLS

// SIDES
const sides = [
    createWall(0.01, 0.3, 0.3, 0),
    createWall(0.01, 0.3, -0.3, 0),
    createWall(0.3, 0.01, 0, 0.3),
    createWall(0.3, 0.01, 0, -0.3),
];

createWall(0.01, 0.15, 0.2, -0.15);
createWall(0.01, 0.15, 0.1, 0.15);

createWall(0.01, 0.05, 0.1, -0.15);
createWall(0.01, 0.05, 0.2, 0.15);
createWall(0.05, 0.01, 0.15, -0.15);

createWall(0.15, 0.01, -0.15, 0.2);
createWall(0.15, 0.01, -0.05, 0.1);

createWall(0.01, 0.15, -0.2, -0.15);
createWall(0.01, 0.15, -0.1, -0.05);
createWall(0.01, 0.15, 0, -0.15);

//createWall(0.15, 0.01, 0.15, -0.1);

const finish = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.08),
    new THREE.MeshBasicMaterial({
        color: 0x55ff66,
        opacity: 0.5,
        transparent: true,
    })
);
finish.position.set(0.25, -0.24, 0.05);
scene.add(finish);

const canvas = document.querySelector(".app");
const renderer = new THREE.WebGLRenderer({
    canvas: canvas as HTMLCanvasElement,
    antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setAnimationLoop(animation);
document.body.appendChild(renderer.domElement);

// animation
let time = 0;
function animation(timeElapsed: number) {
    world.step((timeElapsed - time) / 1000);
    time = timeElapsed;

    if (body.position.z < -0.5) {
        body.position = new CANNON.Vec3(-0.22, 0.22, 0.2);
        body.velocity = new CANNON.Vec3(0, 0, 0);
    }

    if (
        body.position.x > finish.position.x &&
        body.position.x <
            finish.position.x + finish.geometry.parameters.width &&
        body.position.y > finish.position.y &&
        body.position.y <
            finish.position.y + finish.geometry.parameters.height &&
        !win.classList.contains("show")
    ) {
        win.classList.add("show");
        setTimeout(() => {
            win.classList.remove("show");
            body.position = new CANNON.Vec3(-0.22, 0.22, 0.2);
            body.velocity = new CANNON.Vec3(0, 0, 0);
        }, 2000);
    }

    body.velocity.set(y / 20, -x / 20, body.velocity.z);

    ballMesh.position.copy(
        new THREE.Vector3(body.position.x, body.position.y, body.position.z)
    );
    ballMesh.quaternion.copy(
        new THREE.Quaternion(
            body.quaternion.x,
            body.quaternion.y,
            body.quaternion.z,
            body.quaternion.w
        )
    );

    renderer.render(scene, camera);
}
