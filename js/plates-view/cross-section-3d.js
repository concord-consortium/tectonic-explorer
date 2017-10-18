import * as THREE from 'three'
import 'three/examples/js/controls/OrbitControls'
import renderCrossSection from './render-cross-section'

const HORIZONTAL_MARGIN = 200
const VERTICAL_MARGIN = 70

export default class CrossSection3D {
  constructor () {
    this.renderer = new THREE.WebGLRenderer({
      // Enable antialias only on non-high-dpi displays.
      antialias: window.devicePixelRatio < 2,
      alpha: true
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.render = this.render.bind(this)

    this.basicSceneSetup()
    this.addCrossSectionWalls()

    this.render()
  }

  get domElement () {
    return this.renderer.domElement
  }

  resize (width, height) {
    this.renderer.setSize(width, height)
    const w2 = width * 0.5
    const h2 = height * 0.5
    this.camera.left = -w2
    this.camera.right = w2
    this.camera.top = h2
    this.camera.bottom = -h2
    this.camera.updateProjectionMatrix()
  }

  setCrossSectionData (data) {
    renderCrossSection(this.frontWallCanvas, data.dataFront)
    this.frontWallTexture.needsUpdate = true
    renderCrossSection(this.rightWallCanvas, data.dataRight)
    this.rightWallTexture.needsUpdate = true
    renderCrossSection(this.backWallCanvas, data.dataBack)
    this.backWallTexture.needsUpdate = true
    renderCrossSection(this.leftWallCanvas, data.dataLeft)
    this.leftWallTexture.needsUpdate = true

    const width = this.frontWallCanvas.width
    const height = this.frontWallCanvas.height
    const depth = this.rightWallCanvas.width

    this.frontWall.scale.set(width, height)

    this.rightWall.scale.set(depth, height)
    this.rightWall.position.set(0.5 * width, 0, -0.5 * depth)

    this.backWall.scale.set(width, height)
    this.backWall.position.set(0, 0, -depth)

    this.leftWall.scale.set(depth, height)
    this.leftWall.position.set(-0.5 * width, 0, -0.5 * depth)

    this.topWall.scale.set(width, depth)
    this.topWall.position.set(0, 0.5 * height, -0.5 * depth)

    this.controls.target.set(0, 0, -0.5 * depth)

    this.resize(width + HORIZONTAL_MARGIN, height + VERTICAL_MARGIN)
  }

  basicSceneSetup () {
    this.scene = new THREE.Scene()

    // Camera will be updated when the first data comes.
    this.camera = new THREE.OrthographicCamera(0, 0, 0, 0, 1, 20000)
    // It's orthographic camera, so z distance doesn't matter much. Just make sure it's further than max size
    // of the cross section box and still within near and far planes defined above.
    this.camera.position.z = 10000
    this.camera.position.x = 500
    this.scene.add(this.camera)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enablePan = false
    this.controls.rotateSpeed = 0.5
    this.controls.zoomSpeed = 0.5
    this.controls.minZoom = 0.8
    this.controls.maxZoom = 1.2
    this.controls.minPolarAngle = Math.PI * 0.49 // radians
    this.controls.maxPolarAngle = Math.PI * 0.49 // radians
  }

  addCrossSectionWalls () {
    // Why 1,1? It will be scaled later when new data arrives.
    // Scaling is way easier and faster than recreating geometry each time.
    this.planeGeometry = new THREE.PlaneGeometry(1, 1)

    this.frontWallCanvas = document.createElement('canvas')
    this.frontWallTexture = new THREE.Texture(this.frontWallCanvas)
    this.frontWallTexture.minFilter = THREE.LinearFilter
    this.frontWallMaterial = new THREE.MeshBasicMaterial({map: this.frontWallTexture})
    this.frontWall = new THREE.Mesh(this.planeGeometry, this.frontWallMaterial)
    this.scene.add(this.frontWall)

    this.rightWallCanvas = document.createElement('canvas')
    this.rightWallTexture = new THREE.Texture(this.rightWallCanvas)
    this.rightWallTexture.minFilter = THREE.LinearFilter
    this.rightWallMaterial = new THREE.MeshBasicMaterial({map: this.rightWallTexture})
    this.rightWall = new THREE.Mesh(this.planeGeometry, this.rightWallMaterial)
    this.rightWall.rotation.y = Math.PI * 0.5
    this.scene.add(this.rightWall)

    this.backWallCanvas = document.createElement('canvas')
    this.backWallTexture = new THREE.Texture(this.backWallCanvas)
    this.backWallTexture.minFilter = THREE.LinearFilter
    this.backWallMaterial = new THREE.MeshBasicMaterial({map: this.backWallTexture})
    this.backWall = new THREE.Mesh(this.planeGeometry, this.backWallMaterial)
    this.backWall.rotation.y = Math.PI
    this.scene.add(this.backWall)

    this.leftWallCanvas = document.createElement('canvas')
    this.leftWallTexture = new THREE.Texture(this.leftWallCanvas)
    this.leftWallTexture.minFilter = THREE.LinearFilter
    this.leftWallMaterial = new THREE.MeshBasicMaterial({map: this.leftWallTexture})
    this.leftWall = new THREE.Mesh(this.planeGeometry, this.leftWallMaterial)
    this.leftWall.rotation.y = Math.PI * -0.5
    this.scene.add(this.leftWall)

    this.topWallMaterial = new THREE.MeshBasicMaterial({color: 0x4375be})
    this.topWall = new THREE.Mesh(this.planeGeometry, this.topWallMaterial)
    this.topWall.rotation.x = Math.PI * -0.5
    this.scene.add(this.topWall)
  }

  render () {
    window.requestAnimationFrame(this.render)
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }
}
