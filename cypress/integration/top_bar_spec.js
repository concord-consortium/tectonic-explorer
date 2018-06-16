import TopBar from '../../js/components/top-bar'
import simulationStore from '../../js/stores/simulation-store'
import React from 'react'
import { Provider } from 'mobx-react'
import { mount } from '../utils/cypress_react_test'

import css from '../../css-modules/top-bar.less'

describe('Top Bar', function () {
  beforeEach(() => {
    mount(<TopBar />)
  })

  it ('renders correctly', function () {
    Cypress.component().its('state').should('deep.equal', {
      shareDialogOpen: false,
      aboutDialogOpen: false
    })
    Cypress.component().then((component) => {
      const spy = cy.spy(component, 'openAboutDialog')
      cy.contains('About').click()
      cy.contains('About').click().then((about) => {
        expect(spy).to.be.called
        Cypress.component().its('state').should('deep.equal', {
          shareDialogOpen: false,
          aboutDialogOpen: true
        })
      })
    })
  })
      
  it ('can set state', function () {
    Cypress.component().invoke('setState', {shareDialogOpen: true})
    Cypress.component().its('state').should('deep.equal', {
      shareDialogOpen: true,
      aboutDialogOpen: false
    })
  })
})