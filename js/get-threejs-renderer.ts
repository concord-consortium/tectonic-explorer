import * as THREE from "three";

class FakeRenderer {
  domElement: any;
  constructor() {
    this.domElement = document.createElement("canvas");
  }

  getSize() {
    return {
      width: this.domElement.width,
      height: this.domElement.height
    };
  }

  setSize(width: any, height: any) {
    this.domElement.width = width;
    this.domElement.height = height;
  }

  render() {
    // noop
  }

  setPixelRatio() {
    // noop
  }
}

function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

export default function getThreeJSRenderer() {
  return isWebGLAvailable() ? THREE.WebGLRenderer : FakeRenderer;
}
