import React from 'react'
import { shallow } from 'enzyme'
import SortableDensities from '../../js/components/sortable-densities'
import config from '../../js/config'

describe('SortableDensities component', () => {
  let store
  beforeEach(() => {
    // Restore config as it can be modified by tests.
    global.resetConfig()
    store = {
      model: {
        plates: []
      }
    }
  })

  it('respects `densityWordInPlanetWizard` config option', () => {
    config.densityWordInPlanetWizard = true

    let wrapper = shallow(<SortableDensities simulationStore={store} />)
    expect(wrapper.html()).toEqual(expect.stringContaining('LOW'))
    expect(wrapper.html()).toEqual(expect.stringContaining('HIGH'))
    expect(wrapper.html()).toEqual(expect.stringContaining('Click and drag to reorder the plate density'))

    config.densityWordInPlanetWizard = false

    wrapper = shallow(<SortableDensities simulationStore={store} />)
    expect(wrapper.html()).toEqual(expect.stringContaining('BELOW'))
    expect(wrapper.html()).toEqual(expect.stringContaining('ABOVE'))
    expect(wrapper.html()).toEqual(expect.stringContaining('Click and drag to reorder the plates'))
  })
})
