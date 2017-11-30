import * as seedrandom from '../js/seedrandom'

test('deterministic random', () => {
  seedrandom.initialize(true)
  const result1 = [seedrandom.random(), seedrandom.random(), seedrandom.random()]
  seedrandom.initialize(true)
  const result2 = [seedrandom.random(), seedrandom.random(), seedrandom.random()]
  expect(result1).toEqual(result2)
})

test('non-deterministic random', () => {
  seedrandom.initialize(false)
  const result1 = [seedrandom.random(), seedrandom.random(), seedrandom.random()]
  seedrandom.initialize(false)
  const result2 = [seedrandom.random(), seedrandom.random(), seedrandom.random()]
  expect(result1).not.toEqual(result2)
})

test('save and restore random', () => {
  seedrandom.initialize(true)
  seedrandom.random()
  seedrandom.random()
  const state = seedrandom.getState()
  const result1 = [seedrandom.random(), seedrandom.random(), seedrandom.random()]
  seedrandom.initializeFromState(state)
  const result2 = [seedrandom.random(), seedrandom.random(), seedrandom.random()]
  expect(result1).toEqual(result2)
})
