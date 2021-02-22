import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import renderCrossSection from "./render-cross-section";
import getThreeJSRenderer from "../get-threejs-renderer";

const HORIZONTAL_MARGIN = 200; // px
const VERTICAL_MARGIN = 80; // px
const SHADING_STRENGTH = 0.8;
const POINT_SIZE = 40; // px
const POINT_PADDING = 9; // px
const CAMERA_VERT_ANGLE = Math.PI * 0.483; // radians
const CAMERA_DEF_Z = 10000;

function getPointTexture (label) {
  const size = 64;
  const shadowBlur = size / 4;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  // Point
  ctx.arc(size / 2, size / 2, size / 2 - shadowBlur, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = shadowBlur;
  ctx.fill();
  // Label
  ctx.fillStyle = "#444";
  ctx.shadowBlur = 0;
  ctx.shadowColor = "rgba(0,0,0,0)";
  ctx.font = `${size * 0.3}px verdana, helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, size / 2, size / 2);
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const Renderer = getThreeJSRenderer();
const renderer = new Renderer({
  // Enable antialias only on non-high-dpi displays.
  antialias: window.devicePixelRatio < 2,
  alpha: true
});
renderer.setPixelRatio(window.devicePixelRatio);

export default class CrossSection3D {
  constructor (onCameraChange) {
    this.screenWidth = Infinity;

    this.basicSceneSetup();
    this.addCrossSectionWalls();
    this.addPoints();

    this.suppressCameraChangeEvent = false;
    this.controls.addEventListener("change", () => {
      if (!this.suppressCameraChangeEvent) {
        onCameraChange(this.getCameraAngle());
      }
    });

    // See shutterbug-support.js
    if (this.domElement.className.indexOf("canvas-3d") === -1) {
      this.domElement.className += " canvas-3d";
    }
    this.domElement.render = this.render.bind(this);

    this.requestAnimFrame = this.requestAnimFrame.bind(this);
    this.requestAnimFrame();
  }

  get domElement () {
    return renderer.domElement;
  }

  getCameraAngle () {
    // Ignore Y axis.
    const camPos = this.camera.position;
    const cameraAngle = Math.atan2(camPos.x, camPos.z) - Math.atan2(0, 1);
    return cameraAngle * 180 / Math.PI;
  }

  setCameraAngle (val) {
    this.suppressCameraChangeEvent = true;
    const angle = val * Math.PI / 180; // rad
    this.camera.position.x = 0;
    this.camera.position.z = CAMERA_DEF_Z;
    this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    this.controls.update();
    this.suppressCameraChangeEvent = false;
  }

  dispose () {
    window.cancelAnimationFrame(this.rafId);
    this.planeGeometry.dispose();
    this.frontWallTexture.dispose();
    this.frontWallMaterial.dispose();
    this.rightWallTexture.dispose();
    this.rightWallMaterial.dispose();
    this.backWallTexture.dispose();
    this.backWallMaterial.dispose();
    this.leftWallTexture.dispose();
    this.leftWallMaterial.dispose();
    this.topWallMaterial.dispose();
    this.point1Texture.dispose();
    this.point1Material.dispose();
    this.point2Texture.dispose();
    this.point2Material.dispose();
    this.point3Texture.dispose();
    this.point3Material.dispose();
    this.point4Texture.dispose();
    this.point4Material.dispose();
  }

  resize (width, height) {
    renderer.setSize(width, height);
    const w2 = width * 0.5;
    const h2 = height * 0.5;
    this.camera.left = -w2;
    this.camera.right = w2;
    this.camera.top = h2;
    this.camera.bottom = -h2;
    this.camera.updateProjectionMatrix();
  }

  setScreenWidth (value) {
    this.screenWidth = value;
  }

  setCrossSectionData (data, swapped) {
    renderCrossSection(this.frontWallCanvas, data.dataFront);
    this.frontWallTexture.needsUpdate = true;
    renderCrossSection(this.rightWallCanvas, data.dataRight);
    this.rightWallTexture.needsUpdate = true;
    renderCrossSection(this.backWallCanvas, data.dataBack);
    this.backWallTexture.needsUpdate = true;
    renderCrossSection(this.leftWallCanvas, data.dataLeft);
    this.leftWallTexture.needsUpdate = true;

    const width = this.frontWallCanvas.width;
    const height = this.frontWallCanvas.height;
    const depth = this.rightWallCanvas.width;

    this.frontWall.scale.set(width, height, 1);

    this.rightWall.scale.set(depth, height, 1);
    this.rightWall.position.set(0.5 * width, 0, -0.5 * depth);

    this.backWall.scale.set(width, height, 1);
    this.backWall.position.set(0, 0, -depth);

    this.leftWall.scale.set(depth, height, 1);
    this.leftWall.position.set(-0.5 * width, 0, -0.5 * depth);

    this.topWall.scale.set(width, depth, 1);
    this.topWall.position.set(0, 0.5 * height, -0.5 * depth);

    const frontLeftPoint = swapped ? this.point2 : this.point1;
    const frontRightPoint = swapped ? this.point1 : this.point2;
    const backRightPoint = swapped ? this.point4 : this.point3;
    const backLeftPoint = swapped ? this.point3 : this.point4;
    frontLeftPoint.position.set(-0.5 * width, 0.5 * height + POINT_PADDING, 0);
    frontRightPoint.position.set(0.5 * width, 0.5 * height + POINT_PADDING, 0);
    backRightPoint.position.set(0.5 * width, 0.5 * height + POINT_PADDING, -depth);
    backLeftPoint.position.set(-0.5 * width, 0.5 * height + POINT_PADDING, -depth);

    // Don't emit camera change event when controls' target is updated.
    // This event is meant to be emitted only when user actually rotates camera.
    this.suppressCameraChangeEvent = true;
    this.controls.target.set(0, 0, -0.5 * depth);
    this.controls.update();
    this.suppressCameraChangeEvent = false;

    this.resize(Math.min(this.screenWidth, width + HORIZONTAL_MARGIN), height + VERTICAL_MARGIN);
  }

  basicSceneSetup () {
    this.scene = new THREE.Scene();

    // Camera will be updated when the first data comes.
    this.camera = new THREE.OrthographicCamera(0, 0, 0, 0, 1, 20000);
    this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.5;
    this.controls.minZoom = 0.8;
    this.controls.maxZoom = 1.2;
    this.controls.minPolarAngle = CAMERA_VERT_ANGLE;
    this.controls.maxPolarAngle = CAMERA_VERT_ANGLE;

    const topLight = new THREE.DirectionalLight(0xffffff, 1);
    topLight.position.y = 10000;
    this.scene.add(topLight);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1 - SHADING_STRENGTH));

    this.dirLight = new THREE.DirectionalLight(0xffffff, SHADING_STRENGTH);
    this.scene.add(this.dirLight);
  }

  addCrossSectionWalls () {
    // Why (1, 1) dimensions? It will be scaled later when new data arrives.
    // Scaling is way easier and faster than recreating geometry each time.
    this.planeGeometry = new THREE.PlaneGeometry(1, 1);

    this.frontWallCanvas = document.createElement("canvas");
    this.frontWallTexture = new THREE.Texture(this.frontWallCanvas);
    this.frontWallTexture.minFilter = THREE.LinearFilter;
    this.frontWallMaterial = new THREE.MeshLambertMaterial({ map: this.frontWallTexture });
    this.frontWall = new THREE.Mesh(this.planeGeometry, this.frontWallMaterial);
    this.scene.add(this.frontWall);

    this.rightWallCanvas = document.createElement("canvas");
    this.rightWallTexture = new THREE.Texture(this.rightWallCanvas);
    this.rightWallTexture.minFilter = THREE.LinearFilter;
    this.rightWallMaterial = new THREE.MeshLambertMaterial({ map: this.rightWallTexture });
    this.rightWall = new THREE.Mesh(this.planeGeometry, this.rightWallMaterial);
    this.rightWall.rotation.y = Math.PI * 0.5;
    this.scene.add(this.rightWall);

    this.backWallCanvas = document.createElement("canvas");
    this.backWallTexture = new THREE.Texture(this.backWallCanvas);
    this.backWallTexture.minFilter = THREE.LinearFilter;
    this.backWallMaterial = new THREE.MeshLambertMaterial({ map: this.backWallTexture });
    this.backWall = new THREE.Mesh(this.planeGeometry, this.backWallMaterial);
    this.backWall.rotation.y = Math.PI;
    this.scene.add(this.backWall);

    this.leftWallCanvas = document.createElement("canvas");
    this.leftWallTexture = new THREE.Texture(this.leftWallCanvas);
    this.leftWallTexture.minFilter = THREE.LinearFilter;
    this.leftWallMaterial = new THREE.MeshLambertMaterial({ map: this.leftWallTexture });
    this.leftWall = new THREE.Mesh(this.planeGeometry, this.leftWallMaterial);
    this.leftWall.rotation.y = Math.PI * -0.5;
    this.scene.add(this.leftWall);

    this.topWallMaterial = new THREE.MeshLambertMaterial({ color: 0x4375be });
    this.topWall = new THREE.Mesh(this.planeGeometry, this.topWallMaterial);
    this.topWall.rotation.x = Math.PI * -0.5;
    this.scene.add(this.topWall);
  }

  addPoints () {
    this.point1Texture = getPointTexture("P1");
    this.point2Texture = getPointTexture("P2");
    this.point3Texture = getPointTexture("P3");
    this.point4Texture = getPointTexture("P4");
    this.point1Material = new THREE.SpriteMaterial({ map: this.point1Texture });
    this.point2Material = new THREE.SpriteMaterial({ map: this.point2Texture });
    this.point3Material = new THREE.SpriteMaterial({ map: this.point3Texture });
    this.point4Material = new THREE.SpriteMaterial({ map: this.point4Texture });
    this.point1 = new THREE.Sprite(this.point1Material);
    this.point2 = new THREE.Sprite(this.point2Material);
    this.point3 = new THREE.Sprite(this.point3Material);
    this.point4 = new THREE.Sprite(this.point4Material);
    this.point1.scale.set(POINT_SIZE, POINT_SIZE, 1);
    this.point2.scale.set(POINT_SIZE, POINT_SIZE, 1);
    this.point3.scale.set(POINT_SIZE, POINT_SIZE, 1);
    this.point4.scale.set(POINT_SIZE, POINT_SIZE, 1);
    this.scene.add(this.point1);
    this.scene.add(this.point2);
    this.scene.add(this.point3);
    this.scene.add(this.point4);
  }

  requestAnimFrame () {
    this.rafId = window.requestAnimationFrame(this.requestAnimFrame);
    this.render();
  }

  render () {
    this.dirLight.position.copy(this.camera.position);
    renderer.render(this.scene, this.camera);
  }
}
