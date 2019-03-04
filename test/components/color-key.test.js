import React from 'react'
import { mount } from 'enzyme'
import ColorKey from '../../js/components/color-key'

describe('Color Key component', () => {
  let store
  beforeEach(() => {
    global.resetConfig()
    store = {
      model: {
        plates: []
      },
      earthquakes: false,
      volcanicEruptions: false,
      key: true,
      setOption: jest.fn()
    }
  })

  it('displays by default', () => {
    let wrapper = mount(<ColorKey simulationStore={store} />)
    expect(wrapper.html()).toEqual(expect.stringContaining('data-test="color-key-plates"'))
  })
  it('can toggle the key', () => {
    let wrapper = mount(<ColorKey simulationStore={store} />)
    const instance = wrapper.find(ColorKey).instance().wrappedInstance
    instance['toggleKey']()
    expect(store.setOption).toHaveBeenLastCalledWith('key', false)
  })
  it('can display earthquake key', () => {
    store.key = true
    store.earthquakes = true
    let wrapper = mount(<ColorKey simulationStore={store} />)
    expect(wrapper.html()).toEqual(expect.stringContaining('Earthquake Magnitude'))
  })
  it('can display volcano key', () => {
    store.key = true
    store.volcanicEruptions = true
    let wrapper = mount(<ColorKey simulationStore={store} />)
    expect(wrapper.html()).toEqual(expect.stringContaining('Volcanic Eruption'))
  })
})
