class TopContainer {
    getDrawContinents() {
        return cy.get('[data-test=Draw continents');
        // return cy.get('.interaction-selector > .large-button > .label').contains('Draw Continents');
    }

    getEraseContinents() {
        return cy.get('[data-test=Erase continents');
        // return cy.get('.interaction-selector > .large-button > .label').contains('Erase Continents');
    }

    getDrawCrossSection() {
        return cy.get('[data-test=Draw cross section');
        // return cy.get('.interaction-selector > .large-button > .label').contains('Draw cross section');
    }

    getDrawForceVector() {
        return cy.get('[data-test=Draw force vectors');
        // return cy.get('.interaction-selector > .large-button > .label').contains('Draw force vectors');    
    }

    getRotateCamera() {
        return cy.get('[data-test=Rotate Camera');
        // return cy.get('.interaction-selector > .large-button > .label').contains('Rotate Camera');   
    }
}
export default TopContainer;