import BottomPanel from '../../js/components/bottom-panel'
import simulationStore from '../../js/stores/simulation-store'
import React from 'react'
import { Provider } from 'mobx-react'
import { mount } from '../utils/cypress_react_test'

let panelHeight = 0

describe('Bottom Bar', function () {
  beforeEach(() => {
    cy.visit('http://localhost:8080/?preset=subduction')
    cy.wait(2000) // wait for splash screen to close
    if (!panelHeight) {
      cy.get('.bottom-panel')
      .then((panel) => {
        panelHeight = panel[0].clientHeight
      })
    }
  })

  afterEach(() => {
    cy.get('.bottom-panel')
      .should('be.visible')
      .then((panel) => {
        expect(panel[0].clientHeight).to.eq(panelHeight)
      })
  })

  it ('Resizes the logo', function () {
    cy.get('.cc-logo-large').should('be.visible')
    cy.get('.cc-logo-small').should('not.be.visible')

    cy.viewport(800, 660)
    cy.get('.cc-logo-large').should('not.be.visible')
    cy.get('.cc-logo-small').should('be.visible')
  })

  it ('Shows and hides the sidebar', function () {
    cy.get('.sidebar').should('not.be.visible')
    cy.contains('menu').click()
    cy.get('.sidebar').should('be.visible')
    cy.contains('close').click()
    cy.get('.sidebar').should('not.be.visible')
  })

  it ('Has functional checkboxes', function () {
    cy.contains('menu').click()

    cy.contains('Latitude and longitude lines').click()
    cy.contains('Force arrows').click()
    cy.contains('Euler poles').click()
    cy.contains('Plate boundaries').click()
    cy.contains('Wireframe').click()
  })
})

describe('Bottom Bar integration', function () {
  beforeEach(() => {
    mount(
      <Provider simulationStore={simulationStore}>
        <BottomPanel />
      </Provider>)
  })

  it ('Calls the sidebar function', function () {
    Cypress.component().then((component) => {
      let bottomPanel = component._reactInternalInstance._renderedComponent._instance.wrappedInstance
      assert.deepEqual(bottomPanel.state, {
        sidebarActive: false,
        fullscreen: false
      })
      const spy = cy.spy(bottomPanel, 'toggleSidebar')
      cy.contains("menu").click()
      cy.contains("close").click()
      cy.contains("menu").click().then(() => {
        expect(spy).to.be.called
        assert.deepEqual(bottomPanel.state, {
          sidebarActive: true,
          fullscreen: false
        })
      })
    })
  })
})