let panelHeight = 0

describe('Bottom Bar', function () {
  beforeEach(() => {
    cy.visit('/?preset=subduction')
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

  it('Resizes the logo', function () {
    cy.get('.cc-logo-large').should('be.visible')
    cy.get('.cc-logo-small').should('not.be.visible')

    cy.viewport(800, 660)
    cy.get('.cc-logo-large').should('not.be.visible')
    cy.get('.cc-logo-small').should('be.visible')
  })

  it('Shows and hides the sidebar', function () {
    cy.get('.sidebar-menu--sidebar--tectonic-explorer').should('not.be.visible')
    cy.contains('menu').click()
    cy.get('.sidebar-menu--sidebar--tectonic-explorer').should('be.visible')
    cy.contains('close').click()
    cy.get('.sidebar-menu--sidebar--tectonic-explorer').should('not.be.visible')
  })

  it('Has functional checkboxes', function () {
    cy.contains('menu').click()

    cy.contains('Latitude and Longitude Lines').click()
    cy.contains('Force Arrows').click()
    cy.contains('Euler Poles').click()
    cy.contains('Plate Boundaries').click()
    cy.contains('Wireframe').click()
  })
})
