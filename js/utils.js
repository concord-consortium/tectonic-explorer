export function getURLParam (name) {
  const url = window.location.href
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
    imageLoaded(img)
  } else {
    img.addEventListener('load', imageLoaded)
    img.addEventListener('error', () => {
      throw new Error(`Cannot load image ${imgSrc}`)
    })
  }
}
