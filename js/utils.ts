import * as THREE from "three";

export function getURLParam (name: any) {
  const url = (self || window).location.href;
  name = name.replace(/[[]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return true;
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// Returns ImageData object containing data of the image defined by imgSrc argument.
export function getImageData (imgSrc: any, callback: any) {
  function imageLoaded (event: any) {
    const targetImg = event.target;
    const canvas = document.createElement("canvas");
    canvas.width = targetImg.width;
    canvas.height = targetImg.height;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(targetImg, 0, 0, targetImg.width, targetImg.height);
    const data = ctx?.getImageData(0, 0, targetImg.width, targetImg.height);
    callback(data);
  }

  // Load image first.
  const img = document.createElement("img");
  img.src = imgSrc;
  if (img.complete) {
    imageLoaded({ target: img });
  } else {
    img.addEventListener("load", imageLoaded);
    img.addEventListener("error", () => {
      throw new Error(`Cannot load image ${imgSrc}`);
    });
  }
}

const SERIALIZABLE_THREE_TYPES = ["Vector2", "Vector3", "Quaternion", "Matrix3", "Matrix4"];

// Useful for serialization.
export function serialize (object: any) {
  const result: Record<string, any> = {};
  const propsList = object.serializableProps || Object.keys(object);
  propsList.forEach((propName: any) => {
    const prop = object[propName];
    if (prop === null) {
      result[propName] = null;
    } else if (prop === undefined) {
      // Do nothing. We can make serialized object smaller using undefined values as a falsy values.
    } else if (typeof prop !== "object") {
      // Simple case, basic value like number, boolean or string.
      result[propName] = prop;
    } else {
      let threeType = false;
      SERIALIZABLE_THREE_TYPES.forEach(type => {
        if (prop instanceof (THREE as any)[type]) {
          result[propName] = { threeType: type, array: prop.toArray() };
          threeType = true;
        }
      });
      if (!threeType) {
        // Regular object.
        result[propName] = serialize(prop);
      }
    }
  });
  return result;
}

// Useful for deserialization.
export function deserialize (object: any, props: any) {
  const propsList = object.serializableProps || Object.keys(props);
  propsList.forEach((propName: any) => {
    const prop = props[propName];
    if (prop === null) {
      object[propName] = null;
    } else if (prop === undefined) {
      object[propName] = undefined;
    } else if (typeof prop !== "object") {
      object[propName] = prop;
    } else if (prop.threeType && prop.array) {
      object[propName] = (new (THREE as any)[prop.threeType]()).fromArray(prop.array);
    } else {
      // Regular object
      object[propName] = deserialize({}, prop);
    }
  });
  return object;
}
