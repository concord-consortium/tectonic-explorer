// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command'

addMatchImageSnapshotCommand({
  customDiffDir: 'cypress/snapshots-diff',
  failureThreshold: 0.03, // threshold for entire image
  failureThresholdType: 'percent', // percent of image or number of pixels
  customDiffConfig: { threshold: 0.1 }, // threshold for each pixel
  capture: 'viewport' // capture viewport in screenshot
})

Cypress.Commands.add('waitForSplashscreen', () => {
  // Lading can be long on TravisCI.
  cy.get('[data-test=splash-screen]', { timeout: 60000 }).should('not.exist')
})

Cypress.Commands.add('waitForSpinner', () => {
  // Lading can be long on TravisCI.
  cy.get('.spinner', { timeout: 60000 }).should('not.exist')
})

// Accepts array of page coordinates, e.g.:
// cy.mainCanvasDrag([ { x: 700, y: 500 }, { x: 800, y: 500 } ])
Cypress.Commands.add('mainCanvasDrag', positions => {
  // Why do we use this particular set of options? There are two main drag implementations:
  // - camera rotation (ThreeJS Orbit Controls) => it requires `button: 0` and `clientX/Y` to exist, e.g.:
  //    cy.get('.planet-view .canvas-3d')
  //      .trigger('mousedown', { button: 0, clientX: 700, clientY: 500 })
  //      .trigger('mousemove', { clientX: 800, clientY: 500 })
  //      .trigger('mouseup')
  // - other interactions (force drawing, continent drawing) => it requires `pageX/Y` to exist
  //    cy.get('.planet-view .canvas-3d')
  //      .trigger('mousedown', { pageX: 700, pageY: 500 })
  //      .trigger('mousemove', { pageX: 800, pageY: 500 })
  //      .trigger('mouseup')
  // To avoid two separate implementations, just set both kind of options.
  const options = positions.map(pos => (
    { button: 0, clientX: pos.x, clientY: pos.y, pageX: pos.x, pageY: pos.y }
  ))
  options.forEach((opt, idx) => {
    cy.get('.planet-view .canvas-3d').first().trigger(idx === 0 ? 'mousedown' : 'mousemove', opt)
    cy.wait(20)
  })
  cy.get('.planet-view .canvas-3d').first().trigger('mouseup')
  cy.wait(20)
})
