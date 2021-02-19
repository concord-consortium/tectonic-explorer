import React from 'react'
import { mount } from 'enzyme'
import SidebarMenu from '../../js/components/sidebar-menu'
import config from '../../js/config'

describe('SidebarMenu component', () => {
  let store
  beforeEach(() => {
    // Restore config as it can be modified by tests.
    global.resetConfig()
    store = {
      model: {
        plates: []
      },
      setOption: jest.fn()
    }
  })

  it('respects `sidebar` config option and renders only chosen components', () => {
    // Case 1
    const allOptions = [
      ['interactions', 'Interaction'],
      ['timestep', 'Model Speed'],
      ['colormap', 'Color Scheme'],
      ['earthquakes', 'Earthquakes'],
      ['volcanicEruptions', 'Volcanic Eruptions'],
      ['latLongLines', 'Latitude and Longitude Lines'],
      ['plateLabels', 'Plate Labels'],
      ['velocityArrows', 'Velocity Arrows'],
      ['forceArrows', 'Force Arrows'],
      ['eulerPoles', 'Euler Poles'],
      ['boundaries', 'Plate Boundaries'],
      ['wireframe', 'Wireframe'],
      ['save', 'Share Model']
    ]
    config.sidebar = allOptions.map(e => e[0])
    let wrapper = mount(
      <SidebarMenu active={true} simulationStore={store} />
    )
    allOptions.map(e => e[1]).forEach(label => {
      expect(wrapper.text()).toEqual(expect.stringContaining(label))
    })

    // Case 2
    const sliceIdx = 5
    const enabledOptions = allOptions.slice(0, sliceIdx)
    const hiddenOptions = allOptions.slice(sliceIdx)
    config.sidebar = enabledOptions.map(e => e[0])
    wrapper = mount(
      <SidebarMenu active={true} simulationStore={store} />
    )
    enabledOptions.map(e => e[1]).forEach(label => {
      expect(wrapper.text()).toEqual(expect.stringContaining(label))
    })
    hiddenOptions.map(e => e[1]).forEach(label => {
      expect(wrapper.text()).toEqual(expect.not.stringContaining(label))
    })
  })

  it('lets user toggle checkbox-based options', () => {
    const wrapper = mount(
      <SidebarMenu active={true} simulationStore={store} />
    )
    // const checkboxOptions = [
    //   ['earthquakes', 'toggleEarthquakes'],
    //   ['volcanicEruptions', 'toggleVolcanicEruptions'],
    //   ['wireframe', 'toggleWireframe'],
    //   ['renderVelocities', 'toggleVelocities'],
    //   ['renderForces', 'toggleForces'],
    //   ['renderBoundaries', 'toggleBoundaries'],
    //   ['renderEulerPoles', 'toggleEulerPoles'],
    //   ['renderLatLongLines', 'toggleLatLongLines'],
    //   ['renderPlateLabels', 'togglePlateLabels']
    // ]
    const checkboxOptions = [
      'earthquakes',
      'wireframe',
      'renderVelocities',
      'renderForces',
      'renderBoundaries',
      'renderEulerPoles',
      'renderLatLongLines',
      'renderPlateLabels'
    ]
    checkboxOptions.forEach(opt => {
      wrapper.find(`[data-test="toggle-${opt}"] input`).at(0).simulate('click')
      expect(store.setOption).toHaveBeenLastCalledWith(opt, true)
    })
  })
})
