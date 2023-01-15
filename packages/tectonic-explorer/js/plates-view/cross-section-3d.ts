import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import renderCrossSection, { getIntersectionWithTestPoint, ICrossSectionOptions, IIntersectionData } from "./render-cross-section";
import getThreeJSRenderer from "../get-threejs-renderer";
import { ICrossSectionOutput } from "../plates-model/model-output";
import { ICrossSectionWall, IDataSample, MAX_CAMERA_ZOOM, MIN_CAMERA_ZOOM } from "../types";

export const CROSS_SECTION_CANVAS_ID = "cross-section-canvas";

interface IDataSamples {
  front: IDataSample[];
  back: IDataSample[];
  left: IDataSample[];
  right: IDataSample[];
}

const HORIZONTAL_MARGIN = 200; // px
const VERTICAL_MARGIN = 80; // px
const SHADING_STRENGTH = 0.8;
const POINT_SIZE = 40; // px
const POINT_PADDING = 9; // px
const CAMERA_VERT_ANGLE = Math.PI * 0.483; // radians
const CAMERA_DEF_Z = 10000;

function getPointTexture(label: string) {
  const size = 128;
  const shadowBlur = size / 4;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  // Point
  ctx.arc(size / 2, size / 2, size / 2 - shadowBlur, 0, 2 * Math.PI);
  ctx.fillStyle = "#434343";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = shadowBlur;
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 6;
  ctx.stroke();
  // Label
  ctx.fillStyle = "#fff";
  ctx.shadowBlur = 0;
  ctx.shadowColor = "rgba(0,0,0,0)";
  ctx.font = `${size * 0.35}px verdana, helvetica, sans-serif`;
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
  camera: THREE.OrthographicCamera;
  controls: any;
  dirLight: any;
  backWall: THREE.Mesh;
  backWallCanvas: any;
  backWallMaterial: any;
  backWallTexture: any;
  frontWall: THREE.Mesh;
  frontWallCanvas: any;
  frontWallMaterial: any;
  frontWallTexture: any;
  leftWall: THREE.Mesh;
  leftWallCanvas: any;
  leftWallMaterial: any;
  leftWallTexture: any;
  rightWall: THREE.Mesh;
  rightWallCanvas: any;
  rightWallMaterial: any;
  rightWallTexture: any;
  topWall: THREE.Mesh;
  topWallMaterial: any;
  planeGeometry: any;
  point1: any;
  point1Material: any;
  point1Texture: any;
  point2: any;
  point2Material: any;
  point2Texture: any;
  point3: any;
  point3Material: any;
  point3Texture: any;
  point4: any;
  point4Material: any;
  point4Texture: any;
  rafId: any;
  scene: any;
  screenWidth: any;
  suppressCameraChangeEvent: any;
  data: ICrossSectionOutput;
  dataSamples: IDataSamples;
  options: ICrossSectionOptions;
  swapped: boolean;

  constructor(onCameraChange: (angle: number, zoom: number) => void) {
    this.screenWidth = Infinity;

    this.basicSceneSetup();
    this.addCrossSectionWalls();
    this.addPoints();

    this.suppressCameraChangeEvent = false;
    this.controls.addEventListener("change", () => {
      if (!this.suppressCameraChangeEvent) {
        onCameraChange(this.getCameraAngle(), this.getCameraZoom());
      }
    });

    // See shutterbug-support.js
    if (this.domElement.className.indexOf("canvas-3d") === -1) {
      this.domElement.className += " canvas-3d";
    }
    this.domElement.id = CROSS_SECTION_CANVAS_ID;
    (this.domElement as any).render = this.render.bind(this);

    this.requestAnimFrame = this.requestAnimFrame.bind(this);
    this.requestAnimFrame();
  }

  get domElement() {
    return renderer.domElement;
  }

  getCameraAngle() {
    // Ignore Y axis.
    const camPos = this.camera.position;
    const cameraAngle = Math.atan2(camPos.x, camPos.z) - Math.atan2(0, 1);
    return cameraAngle * 180 / Math.PI;
  }

  getCameraZoom() {
    return this.camera.zoom;
  }

  setCameraAngleAndZoom(val: number, zoom: number) {
    this.suppressCameraChangeEvent = true;
    const angle = val * Math.PI / 180; // rad
    this.camera.position.x = 0;
    this.camera.position.z = CAMERA_DEF_Z;
    this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    this.camera.zoom = zoom;
    this.camera.updateProjectionMatrix();
    this.controls.update();
    this.suppressCameraChangeEvent = false;
  }

  setCameraLocked(val: boolean) {
    this.controls.enableRotate = !val;
  }

  dispose() {
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

  resize(width: any, height: any) {
    renderer.setSize(width, height);
    const w2 = width * 0.5;
    const h2 = height * 0.5;
    this.camera.left = -w2;
    this.camera.right = w2;
    this.camera.top = h2;
    this.camera.bottom = -h2;
    this.camera.updateProjectionMatrix();
  }

  setScreenWidth(value: any) {
    this.screenWidth = value;
  }

  setCrossSectionData(data: ICrossSectionOutput, dataSamples: IDataSamples, swapped: boolean, options: ICrossSectionOptions) {
    this.data = data;
    this.dataSamples = dataSamples;
    this.swapped = swapped;
    this.options = options;

    // Since THREE.JS v135 textures cannot be resized. They need to be disposed and recreated.
    this.createTextures();

    renderCrossSection(this.frontWallCanvas, data.dataFront, dataSamples.front, options);
    this.frontWallTexture.needsUpdate = true;
    renderCrossSection(this.rightWallCanvas, data.dataRight, dataSamples.right, options);
    this.rightWallTexture.needsUpdate = true;
    renderCrossSection(this.backWallCanvas, data.dataBack, dataSamples.back, options);
    this.backWallTexture.needsUpdate = true;
    renderCrossSection(this.leftWallCanvas, data.dataLeft, dataSamples.left, options);
    this.leftWallTexture.needsUpdate = true;

    // Note that front wall width is slightly different than the back wall, as cross-section is drawn on a spherical
    // surface. That's why 3D cross-section is not a perfect cube. It's a 3D trapezoid. The current implementation
    // is a workaround that is still using a perfect cube. That's why walls don't fit perfectly. However, this is
    // still better than using wrong dimensions and perfect cube, as it was affecting position of data sample pins
    // and making rock sampling working incorrectly on the back wall.
    // TODO: reimplement all the walls to use BufferGeometry with custom vertex positions that create a trapezoid.
    const frontWidth = this.frontWallCanvas.width;
    const rightWidth = this.rightWallCanvas.width;
    const backWidth = this.backWallCanvas.width;
    const leftWidth = this.leftWallCanvas.width;
    // height is always the same for all the walls.
    const height = this.frontWallCanvas.height;

    this.frontWall.scale.set(frontWidth, height, 1);

    this.rightWall.scale.set(rightWidth, height, 1);
    this.rightWall.position.set(0.5 * (0.5 * (frontWidth + backWidth)), 0, -0.5 * rightWidth);

    this.backWall.scale.set(backWidth, height, 1);
    this.backWall.position.set(0, 0, -0.5 * (rightWidth + leftWidth));

    this.leftWall.scale.set(leftWidth, height, 1);
    this.leftWall.position.set(-0.5 * (0.5 * (frontWidth + backWidth)), 0, -0.5 * leftWidth);

    this.topWall.scale.set(0.5 * (frontWidth + backWidth), 0.5 * (rightWidth + leftWidth), 1);
    this.topWall.position.set(0, 0.5 * height, -0.5 * (0.5 * (rightWidth + leftWidth)));

    const frontLeftPoint = swapped ? this.point2 : this.point1;
    const frontRightPoint = swapped ? this.point1 : this.point2;
    const backRightPoint = swapped ? this.point4 : this.point3;
    const backLeftPoint = swapped ? this.point3 : this.point4;
    frontLeftPoint.position.set(-0.5 * frontWidth, 0.5 * height + POINT_PADDING, 0);
    frontRightPoint.position.set(0.5 * frontWidth, 0.5 * height + POINT_PADDING, 0);
    backRightPoint.position.set(0.5 * backWidth, 0.5 * height + POINT_PADDING, -rightWidth);
    backLeftPoint.position.set(-0.5 * backWidth, 0.5 * height + POINT_PADDING, -leftWidth);

    // Don't emit camera change event when controls' target is updated.
    // This event is meant to be emitted only when user actually rotates camera.
    this.suppressCameraChangeEvent = true;
    this.controls.target.set(0, 0, -0.5 * (0.5 * (rightWidth + leftWidth)));
    this.controls.update();
    this.suppressCameraChangeEvent = false;

    this.resize(Math.min(this.screenWidth, frontWidth + HORIZONTAL_MARGIN), height + VERTICAL_MARGIN);
  }

  getIntersectionData(wall: ICrossSectionWall, testPoint: THREE.Vector2): IIntersectionData | null {
    switch (wall) {
    case "top":
      return { label: "Sky" };
    case "front":
      return getIntersectionWithTestPoint(this.frontWallCanvas, this.data.dataFront, this.dataSamples.front, this.options, testPoint);
    case "left":
      return getIntersectionWithTestPoint(this.leftWallCanvas, this.data.dataLeft, this.dataSamples.left, this.options, testPoint);
    case "right":
      return getIntersectionWithTestPoint(this.rightWallCanvas, this.data.dataRight, this.dataSamples.right, this.options, testPoint);
    case "back":
      return getIntersectionWithTestPoint(this.backWallCanvas, this.data.dataBack, this.dataSamples.back, this.options, testPoint);
    }
  }

  basicSceneSetup() {
    this.scene = new THREE.Scene();

    // Camera will be updated when the first data comes.
    this.camera = new THREE.OrthographicCamera(0, 0, 0, 0, 1, 20000);
    this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.5;
    this.controls.minZoom = MIN_CAMERA_ZOOM;
    this.controls.maxZoom = MAX_CAMERA_ZOOM;
    this.controls.minPolarAngle = CAMERA_VERT_ANGLE;
    this.controls.maxPolarAngle = CAMERA_VERT_ANGLE;

    const topLight = new THREE.DirectionalLight(0xffffff, 1);
    topLight.position.y = 10000;
    this.scene.add(topLight);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1 - SHADING_STRENGTH));

    this.dirLight = new THREE.DirectionalLight(0xffffff, SHADING_STRENGTH);
    this.scene.add(this.dirLight);
  }

  addCrossSectionWalls() {
    // Why (1, 1) dimensions? It will be scaled later when new data arrives.
    // Scaling is way easier and faster than recreating geometry each time.
    this.planeGeometry = new THREE.PlaneGeometry(1, 1);

    this.frontWallCanvas = document.createElement("canvas");
    this.frontWallMaterial = new THREE.MeshLambertMaterial();
    this.frontWall = new THREE.Mesh(this.planeGeometry, this.frontWallMaterial);
    this.scene.add(this.frontWall);

    this.rightWallCanvas = document.createElement("canvas");
    this.rightWallMaterial = new THREE.MeshLambertMaterial();
    this.rightWall = new THREE.Mesh(this.planeGeometry, this.rightWallMaterial);
    this.rightWall.rotation.y = Math.PI * 0.5;
    this.scene.add(this.rightWall);

    this.backWallCanvas = document.createElement("canvas");
    this.backWallMaterial = new THREE.MeshLambertMaterial();
    this.backWall = new THREE.Mesh(this.planeGeometry, this.backWallMaterial);
    this.backWall.rotation.y = Math.PI;
    this.scene.add(this.backWall);

    this.leftWallCanvas = document.createElement("canvas");
    this.leftWallMaterial = new THREE.MeshLambertMaterial();
    this.leftWall = new THREE.Mesh(this.planeGeometry, this.leftWallMaterial);
    this.leftWall.rotation.y = Math.PI * -0.5;
    this.scene.add(this.leftWall);

    this.topWallMaterial = new THREE.MeshLambertMaterial({ color: 0x4375be });
    this.topWall = new THREE.Mesh(this.planeGeometry, this.topWallMaterial);
    this.topWall.rotation.x = Math.PI * -0.5;
    this.scene.add(this.topWall);
  }

  createTextures() {
    if (this.frontWallTexture) {
      this.frontWallTexture.dispose();
    }
    this.frontWallTexture = new THREE.Texture(this.frontWallCanvas);
    this.frontWallTexture.minFilter = THREE.LinearFilter;
    this.frontWallMaterial.map = this.frontWallTexture;

    if (this.rightWallTexture) {
      this.rightWallTexture.dispose();
    }
    this.rightWallTexture = new THREE.Texture(this.rightWallCanvas);
    this.rightWallTexture.minFilter = THREE.LinearFilter;
    this.rightWallMaterial.map = this.rightWallTexture;

    if (this.backWallTexture) {
      this.backWallTexture.dispose();
    }
    this.backWallTexture = new THREE.Texture(this.backWallCanvas);
    this.backWallTexture.minFilter = THREE.LinearFilter;
    this.backWallMaterial.map = this.backWallTexture;

    if (this.leftWallTexture) {
      this.leftWallTexture.dispose();
    }
    this.leftWallTexture = new THREE.Texture(this.leftWallCanvas);
    this.leftWallTexture.minFilter = THREE.LinearFilter;
    this.leftWallMaterial.map = this.leftWallTexture;
  }

  addPoints() {
    this.point1Texture = getPointTexture("A");
    this.point2Texture = getPointTexture("B");
    this.point3Texture = getPointTexture("C");
    this.point4Texture = getPointTexture("D");
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

  requestAnimFrame() {
    this.rafId = window.requestAnimationFrame(this.requestAnimFrame);
    this.render();
  }

  render() {
    this.dirLight.position.copy(this.camera.position);
    renderer.render(this.scene, this.camera);
  }
}
