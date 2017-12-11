import * as THREE from 'three'

export function getURLParam (name) {
  const url = location.href
  name = name.replace(/[[]]/g, '\\$&')
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`)
  const results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return true
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}

// Returns ImageData object containing data of the image defined by imgSrc argument.
export function getImageData (imgSrc, callback) {
  function imageLoaded (event) {
    const img = event.target
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, img.width, img.height)
    const data = ctx.getImageData(0, 0, img.width, img.height)
    callback(data)
  }

  // Load image first.
  const img = document.createElement('img')
  img.src = imgSrc
  if (img.complete) {
    imageLoaded({ target: img })
  } else {
    img.addEventListener('load', imageLoaded)
    img.addEventListener('error', () => {
      throw new Error(`Cannot load image ${imgSrc}`)
    })
  }
}

const SERIALIZABLE_THREE_TYPES = [ 'Vector2', 'Vector3', 'Quaternion', 'Matrix3', 'Matrix4' ]

// Useful for serialization.
export function serialize (object) {
  const result = {}
  const propsList = object.serializableProps || Object.keys(object)
  propsList.forEach(propName => {
    const prop = object[propName]
    if (prop === null) {
      result[propName] = null
    } else if (typeof prop !== 'object') {
      // Simple case, basic value like number, boolean or string.
      result[propName] = prop
    } else {
      let threeType = false
      SERIALIZABLE_THREE_TYPES.forEach(type => {
        if (prop instanceof THREE[type]) {
          result[propName] = { threeType: type, array: prop.toArray() }
          threeType = true
        }
      })
      if (!threeType) {
        // Regular object.
        result[propName] = serialize(prop)
      }
    }
  })
  return result
}

// Useful for deserialization.
export function deserialize (object, props) {
  const propsList = object.serializableProps || Object.keys(props)
  propsList.forEach(propName => {
    const prop = props[propName]
    if (prop === null) {
      object[propName] = null
    } else if (typeof prop !== 'object') {
      object[propName] = prop
    } else if (prop.threeType && prop.array) {
      object[propName] = (new THREE[prop.threeType]()).fromArray(prop.array)
    } else {
      // Regular object
      object[propName] = deserialize({}, prop)
    }
  })
  return object
}

// x, y, and z needs be in [0, 1] range.
// Obviously, some precision will be lost (every value will be mapped to 8 bits / one of the 255 values).
export function normalizedVec3ToFloat (x, y, z) {
  return (x * 255) | ((y * 255) << 8) | ((z * 255) << 16)
}

export function floatToNormalizedVec3 (float) {
  return {
    x: (float & 0xFF) / 255,
    y: ((float >> 8) & 0xFF) / 255,
    z: ((float >> 16) & 0xFF) / 255
  }
}

export function hsvToFloat (hsv) {
  return normalizedVec3ToFloat(hsv.h / 360, hsv.s, hsv.v)
}

export function floatToHsv (float) {
  const xyz = floatToNormalizedVec3(float)
  return {
    h: xyz.x * 360,
    s: xyz.y,
    v: xyz.z
  }
}
