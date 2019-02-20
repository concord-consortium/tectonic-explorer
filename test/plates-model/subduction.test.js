import Subduction, { MAX_SUBDUCTION_DIST } from '../../js/plates-model/subduction'
import * as THREE from 'three'

describe('Subduction model', () => {
  it('should be initialized', () => {
    const field = {}
    const sub = new Subduction(field)
    expect(sub.field).toEqual(field)
    expect(sub.dist).toEqual(0)
    expect(sub.topPlate).toBeUndefined()
    expect(sub.relativeVelocity).toBeUndefined()
  })

  describe('progress', () => {
    it('should be based on current distance traveled by field', () => {
      const sub = new Subduction({})
      expect(sub.progress).toEqual(0)
      sub.dist = MAX_SUBDUCTION_DIST * 0.5
      expect(sub.progress).toBeGreaterThan(0.1)
      expect(sub.progress).toBeLessThan(0.9)
      sub.dist = MAX_SUBDUCTION_DIST
      expect(sub.progress).toEqual(1)
    })
  })

  describe('active', () => {
    it('should be true when the field has not moved backwards', () => {
      const sub = new Subduction({})
      expect(sub.active).toEqual(true)
      sub.dist = 0.5
      expect(sub.active).toEqual(true)
      sub.dist = -0.5 // moved backwards
      expect(sub.active).toEqual(false)
    })
  })

  describe('forEachSubductingNeighbour', () => {
    it('should call provided callback for every field that is subducting', () => {
      const field = {
        forEachNeighbour: (callback) => {
          const fields = [
            {subduction: {progress: 0}},
            {subduction: {progress: 0.5}},
            {subduction: {progress: 1}},
            {fieldThatDoesNotSubduct: true}
          ]
          fields.forEach(callback)
        }
      }
      const sub = new Subduction(field)
      const callback = jest.fn()
      sub.forEachSubductingNeighbour(callback)
      expect(callback).toHaveBeenCalledTimes(3)
    })
  })

  describe('avgProgress', () => {
    it('should return avg progress of the subducting neighbours', () => {
      const field = {
        forEachNeighbour: (callback) => {
          const fields = [
            {subduction: {progress: 0}},
            {subduction: {progress: 0.5}},
            {subduction: {progress: 1}},
            {fieldThatDoesNotSubduct: true}
          ]
          fields.forEach(callback)
        }
      }
      const sub = new Subduction(field)
      expect(sub.avgProgress).toEqual(0.5) // (0 + 0.5 + 1) / 3
    })
  })

  describe('calcSlabGradient', () => {
    it('should return null if there are not enough neighbouring fields that are subducting (will not be precise enough)', () => {
      const field = {
        absolutePos: new THREE.Vector3(1, 0, 0),
        forEachNeighbour: (callback) => {
          const fields = [
            {
              absolutePos: new THREE.Vector3(0.8, 0, 0),
              subduction: {avgProgress: 1}
            },
            {absolutePos: new THREE.Vector3(0, 0, 1)},
            {absolutePos: new THREE.Vector3(0, 0, 1)},
            {absolutePos: new THREE.Vector3(0, 0, 1)},
            {absolutePos: new THREE.Vector3(0, 0, 1)}
          ]
          fields.forEach(callback)
        }
      }
      const sub = new Subduction(field)
      expect(sub.calcSlabGradient()).toEqual(null)
    })

    it('should return gradient of the subduction slope', () => {
      let field = {
        absolutePos: new THREE.Vector3(0.5, 0, 0),
        forEachNeighbour: (callback) => {
          const fields = [
            {
              absolutePos: new THREE.Vector3(1, 0, 0),
              subduction: {avgProgress: 1}
            },
            {
              absolutePos: new THREE.Vector3(0, 0, 1),
              subduction: {avgProgress: 0}
            },
            {
              absolutePos: new THREE.Vector3(0, 0, 1),
              subduction: {avgProgress: 0}
            },
            {
              absolutePos: new THREE.Vector3(0, 0, 1),
              subduction: {avgProgress: 0}
            },
            {
              absolutePos: new THREE.Vector3(0, 0, 1),
              subduction: {avgProgress: 0}
            }
          ]
          fields.forEach(callback)
        }
      }
      let sub = new Subduction(field)
      jest.spyOn(sub, 'avgProgress', 'get').mockImplementation(() => 0)
      expect(sub.calcSlabGradient().toArray()).toEqual([1, 0, 0])  // result is always normalized

      field = {
        absolutePos: new THREE.Vector3(1, 0, 0),
        forEachNeighbour: (callback) => {
          const fields = [
            {
              absolutePos: new THREE.Vector3(0.5, 0, 0),
              subduction: {avgProgress: 1}
            },
            {
              absolutePos: new THREE.Vector3(0, 0, 1),
              subduction: {avgProgress: 0.5}
            },
            {
              absolutePos: new THREE.Vector3(0, 0, 1),
              subduction: {avgProgress: 0.5}
            },
            {
              absolutePos: new THREE.Vector3(0, 0, 1),
              subduction: {avgProgress: 0.5}
            },
            {
              absolutePos: new THREE.Vector3(0, 0, 1),
              subduction: {avgProgress: 0.5}
            }
          ]
          fields.forEach(callback)
        }
      }
      sub = new Subduction(field)
      jest.spyOn(sub, 'avgProgress', 'get').mockImplementation(() => 0.5)
      expect(sub.calcSlabGradient().toArray()).toEqual([-1, 0, 0]) // result is always normalized
    })
  })

  describe('setCollision', () => {
    it('set topPlate and linearVelocity', () => {
      const field1 = { linearVelocity: new THREE.Vector3(0.5, 0, 0) }
      const field2 = { linearVelocity: new THREE.Vector3(1, 0, 0), plate: 'somePlate' }
      const sub = new Subduction(field1)
      sub.setCollision(field2)
      expect(sub.topPlate).toEqual(field2.plate)
      expect(sub.relativeVelocity.toArray()).toEqual([-0.5, 0, 0])
    })
  })
})
