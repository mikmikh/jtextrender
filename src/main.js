import { addV, subV, crossProduct, mulS } from "./util/jmat.js";
import {
  JBoxGeometry,
  JMaterial,
  JMesh,
  JPlaneGeometry,
} from "./util/jmesh.js";
import { EventManager, KeyboardControls } from "./util/keyboard.js";
import { JCamera, JRenderer } from "./util/render.js";
import { textRenderGrid } from "./util/textRender.js";
import { loadTexture, loadWavefrontObjectInfo } from "./util/wavefront.js";

const vsize = [64, 64];
const fov = Math.PI / 2;
const zfar = 8;
const znear = 0.1;

const jrenderer = new JRenderer(vsize, fov, znear, zfar);
jrenderer.update();
jrenderer.light.position = [5, 0, -5];
jrenderer.light.ambient = 0.75;

const camera = new JCamera([0, 0, -2]);
camera.update();
console.log(camera);

const mesh = {
  position: [0, 0, 0],
  scale: [0.25, 0.25, 0.25],
  rotation: [0, 0, 0],
  geometry: { v: [], vt: [], vn: [], f: [] },
  material: {
    texture: {
      data: [
        [
          [255, 0, 0],
          [0, 255, 0],
        ],
        [
          [255, 255, 0],
          [255, 0, 255],
        ],
      ],
      size: [2, 2],
    },
    color: [255, 255, 255],
  },
};
const terrainMesh = new JMesh(new JPlaneGeometry(), new JMaterial([0, 255, 0]));
terrainMesh.position = [0, -1, 0];
terrainMesh.scale = [1, 1, 1];
const planeGeometry = new JPlaneGeometry();
const colorMaterial = new JMaterial([255, 0, 255]);
const boxGeometry = new JBoxGeometry();
const textureMaterial = new JMaterial([255, 255, 255], {
  data: [
    [
      [255, 0, 0],
      [0, 255, 0],
    ],
    [
      [255, 255, 0],
      [255, 0, 255],
    ],
  ],
  size: [2, 2],
});
const planeMesh = new JMesh(planeGeometry, colorMaterial);
planeMesh.position = [-2, -0.5, 1];
planeMesh.scale = [0.5, 0.5, 0.5];
const boxMesh = new JMesh(boxGeometry, textureMaterial);
boxMesh.position = [2, 1, 1];
boxMesh.scale = [0.5, 0.5, 0.5];

//          top
//    0,1,1-------1,1,1
//      / |      /|
//  0,1,0---1,1,0 |   / north
// west| 0,0,1_|__|1,0,1
//     |/      | /      -> east
//   0,0,0-----1,0,0
//       /  |
//   south  v
//        bottom

// ======================== CONTROLS ========================
const eventManager = new EventManager();
const keyboardControls = new KeyboardControls(eventManager);
keyboardControls.activate();

const controlMap = {
  w: "forward",
  s: "backward",
  d: "right",
  a: "left",
  q: "up",
  e: "down",
  arrowup: "lookup",
  arrowdown: "lookdown",
  arrowleft: "lookleft",
  arrowright: "lookright",
  shift: "shift",
};

function applyInputs(dt) {
  const controls = {};
  Object.keys(controlMap).forEach((key) => {
    if (keyboardControls.keyStates[key]) {
      controls[controlMap[key]] = true;
    }
  });
  applyControls(controls, dt);
}

Object.values(controlMap).forEach((control) => {
  const btn = document.getElementById(`btn-${control}`);
  if (!btn) {
    return;
  }
  btn.addEventListener("click", () => {
    applyControls({ [control]: true }, 0.2);
  });
  btn.addEventListener("touch", () => {
    applyControls({ [control]: true }, 0.2);
  });
});

function applyControls(controls, dt) {
  const up = [0, 1, 0];
  const right = crossProduct(up, camera.direction);
  let offset = [0, 0, 0];
  if (controls["forward"]) {
    offset = addV(offset, camera.direction);
  }
  if (controls["backward"]) {
    offset = subV(offset, camera.direction);
  }
  if (controls["right"]) {
    offset = addV(offset, right);
  }
  if (controls["left"]) {
    offset = subV(offset, right);
  }
  if (controls["up"]) {
    offset = addV(offset, up);
  }
  if (controls["down"]) {
    offset = subV(offset, up);
  }
  const speed = controls["shift"] ? 4 : 2;
  camera.position = addV(camera.position, mulS(offset, speed * dt));

  if (controls["lookup"]) {
    camera.pitch = camera.pitch + dt; // Math.min(camera.pitch + dt, Math.PI / 2 - 0.01);
  }
  if (controls["lookdown"]) {
    camera.pitch = camera.pitch - dt; // Math.max(camera.pitch - dt, -Math.PI / 2 + 0.01);
  }
  camera.pitch = Math.min(
    Math.PI / 2 - 0.01,
    Math.max(-Math.PI / 2 + 0.01, camera.pitch)
  );
  if (controls["lookleft"]) {
    camera.yaw += dt;
  }
  if (controls["lookright"]) {
    camera.yaw -= dt;
  }
}

// ======================== ANIMATE ========================

let prevTime = 0;
function animate(time) {
  time = time / 1000;
  const dt = time - prevTime;
  prevTime = time;

  camera.update();
  mesh.rotation[0] = time / 10;
  mesh.rotation[1] = time / 10;
  planeMesh.rotation[2] = time;
  planeMesh.position[2] = Math.sin(time);
  boxMesh.position[1] = Math.sin(time);
  const [vdata, vcolor] = jrenderer.render(
    [planeMesh, boxMesh, mesh, terrainMesh],
    camera
  );
  textRenderGrid(vdata, vsize, vcolor);

  applyInputs(dt);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

Promise.all([
  loadWavefrontObjectInfo("./data/box.obj"),
  loadTexture("./data/box.png", [64, 64]),
]).then(([objInfos, texture]) => {
  mesh.geometry = objInfos[0].geometry;
  mesh.material.texture = texture;
  console.log(mesh);
});
mesh.geometry = new JPlaneGeometry();

Promise.all([loadWavefrontObjectInfo("./data/terrain.obj")]).then(
  ([objInfos]) => {
    terrainMesh.geometry = objInfos[0].geometry;
  }
);

Promise.all([loadTexture("./data/example.png", [64, 64])]).then(([texture]) => {
  planeMesh.material.texture = texture;
});

const viewWrapperEl = document.getElementById("view-wrapper");
viewWrapperEl.addEventListener("click", async () => {
  console.log("click");
  await viewWrapperEl.requestPointerLock({
    unadjustedMovement: true,
  });
});

document.addEventListener("pointerlockchange", lockChangeAlert);

function lockChangeAlert() {
  if (document.pointerLockElement === viewWrapperEl) {
    console.log("The pointer lock status is now locked");
    document.addEventListener("mousemove", updatePosition);
  } else {
    console.log("The pointer lock status is now unlocked");
    document.removeEventListener("mousemove", updatePosition);
  }
}

function updatePosition(e) {
  camera.yaw -= e.movementX * 0.005;
  camera.pitch -= e.movementY* 0.005;

  camera.pitch = Math.min(
    Math.PI / 2 - 0.01,
    Math.max(-Math.PI / 2 + 0.01, camera.pitch)
  );
}
