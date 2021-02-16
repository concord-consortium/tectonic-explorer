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
      crossSectionVisible: false,
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
    wrapper.find('[data-test="key-close-button"]').at(0).simulate('click')
    expect(store.setOption).toHaveBeenLastCalledWith('key', false)
  })
  it('can display earthquake key', () => {
    store.key = true
    store.earthquakes = true
    let wrapper = mount(<ColorKey simulationStore={store} />)
    expect(wrapper.html()).toEqual(expect.stringContaining('data-test="color-key-earthquakes"'))
  })
  it('can display volcano key', () => {
    store.key = true
    store.volcanicEruptions = true
    let wrapper = mount(<ColorKey simulationStore={store} />)
    expect(wrapper.html()).toEqual(expect.stringContaining('data-test="color-key-volcanic-eruptions"'))
  })
  it('can display cross-section key', () => {
    store.key = true
    store.crossSectionVisible = true
    let wrapper = mount(<ColorKey simulationStore={store} />)
    expect(wrapper.html()).toEqual(expect.stringContaining('data-test="color-key-cross-section-container"'))
  })
})
