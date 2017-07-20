import * as THREE from 'three'
import { serialize, deserialize } from '../js/utils'

test('basic serialization tests', () => {
  let target
  target = {}
  // Serialized object is equal to source object, but it's a copy.
  expect(serialize(target)).toEqual(target)
  expect(serialize(target)).not.toBe(target)
  target = { a: 1, b: 'test' }
  expect(serialize(target)).toEqual(target)
  target = { a: 1, b: { c: 2, d: { e: 3 } } }
  expect(serialize(target)).toEqual(target)
  expect(serialize(target.b.d)).not.toBe(target.b.d)

  target = { a: 1, b: 2, c: 3, serializableProps: [ 'a', 'b' ] }
  expect(serialize(target)).toEqual({a: 1, b: 2})
})

test('basic deserialization tests', () => {
  let target
  let props
  target = {}
  props = {}
  expect(deserialize(target, props)).toEqual(target)
  expect(deserialize(target, props)).toBe(target)
  target = {}
  props = { a: 1, b: 'test' }
  expect(deserialize(target, props)).toEqual(props)
  target = { otherProp: 0 }
  props = { a: 1, b: 'test' }
  expect(deserialize(target, props)).toEqual({ otherProp: 0, a: 1, b: 'test' })

  target = { a: 1, b: 2, c: 3, serializableProps: [ 'a', 'b' ] }
  props = { a: 10, b: 11, c: 13 }
  expect(deserialize(target, props)).toEqual({a: 10, b: 11, c: 3, serializableProps: [ 'a', 'b' ]})
})

test('serialization of THREE types', () => {
  expect(serialize({ a: new THREE.Vector2(1, 2) })).toEqual({ a: { threeType: 'Vector2', array: [1, 2] } })
  expect(serialize({ a: new THREE.Vector3(1, 2, 3) })).toEqual({ a: { threeType: 'Vector3', array: [1, 2, 3] } })
  expect(serialize({ a: new THREE.Matrix3() })).toEqual({ a: { threeType: 'Matrix3', array: [1, 0, 0, 0, 1, 0, 0, 0, 1] } })
  expect(serialize({ a: new THREE.Matrix4() })).toEqual({ a: { threeType: 'Matrix4', array: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] } })
})

test('deserialization of THREE types', () => {
  let target
  target = {}
  deserialize(target, { a: { threeType: 'Vector2', array: [1, 2] } })
  expect(target.a instanceof THREE.Vector2).toBe(true)
  expect(target.a.equals(new THREE.Vector2(1, 2))).toBe(true)
  deserialize(target, { a: { threeType: 'Vector3', array: [1, 2, 3] } })
  expect(target.a instanceof THREE.Vector3).toBe(true)
  expect(target.a.equals(new THREE.Vector3(1, 2, 3))).toBe(true)
  deserialize(target, { a: { threeType: 'Matrix3', array: [1, 0, 0, 0, 1, 0, 0, 0, 1] } })
  expect(target.a instanceof THREE.Matrix3).toBe(true)
  expect(target.a.equals(new THREE.Matrix3())).toBe(true)
  deserialize(target, { a: { threeType: 'Matrix4', array: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] } })
  expect(target.a instanceof THREE.Matrix4).toBe(true)
  expect(target.a.equals(new THREE.Matrix4())).toBe(true)
})
