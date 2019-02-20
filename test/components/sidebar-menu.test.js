import React from 'react'
import { mount } from 'enzyme'
import SidebarMenu from '../../js/components/sidebar-menu'
import { Sidebar } from 'react-toolbox'
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
      ['interactions', 'Select interaction'],
      ['timestep', 'Adjust model speed'],
      ['colormap', 'Select color scheme'],
      ['earthquakes', 'Earthquakes'],
      ['latLongLines', 'Latitude and longitude lines'],
      ['plateLabels', 'Plate labels'],
      ['velocityArrows', 'Velocity arrows'],
      ['forceArrows', 'Force arrows'],
      ['eulerPoles', 'Euler poles'],
      ['boundaries', 'Plate boundaries'],
      ['wireframe', 'Wireframe'],
      ['save', 'Share model']
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
    const instance = wrapper.find(SidebarMenu).instance().wrappedInstance
    const checkboxOptions = [
      ['earthquakes', 'toggleEarthquakes'],
      ['wireframe', 'toggleWireframe'],
      ['renderVelocities', 'toggleVelocities'],
      ['renderForces', 'toggleForces'],
      ['renderBoundaries', 'toggleBoundaries'],
      ['renderEulerPoles', 'toggleEulerPoles'],
      ['renderLatLongLines', 'toggleLatLongLines'],
      ['renderPlateLabels', 'togglePlateLabels']
    ]
    checkboxOptions.forEach(entry => {
      const [ opt, funcName ] = entry
      instance[funcName]()
      expect(store.setOption).toHaveBeenLastCalledWith(opt, true)
    })
  })
})
