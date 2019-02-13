import * as THREE from 'three'

class FakeRenderer {
  constructor () {
    this.domElement = document.createElement('canvas')
  }

  getSize () {
    return {
      width: this.domElement.width,
      height: this.domElement.height
    }
  }

  setSize (width, height) {
    this.domElement.width = width
    this.domElement.height = height
  }

  render () {
    // noop
  }

  setPixelRatio () {
    // noop
  }
}

function isWebGLAvailable () {
  try {
    var canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
  } catch (e) {
    return false
  }
}

export default function getThreeJSRenderer () {
  return isWebGLAvailable() ? THREE.WebGLRenderer : FakeRenderer
}
