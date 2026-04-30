// pruebas de la pantalla de horario academico
// La pantalla vive en /movil/horario y consume GET /api/horario. Las clases se
// pintan como bloques absolutos en una cuadricula y solo se muestra el texto de
// la materia si el bloque mide mas de 28px (>=1h con SLOT_HEIGHT=52). El salon
// solo aparece si el bloque mide >=44px. Con la fixture clases.json tenemos
// "Cálculo Integral" (1h) y "Programación" (1.5h) que son visibles.
describe("Movil - Horario", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/horario", { fixture: "horario/clases.json" }).as("horario")
    cy.visitAs("residente", "/movil/horario")
  })

  it("muestra las clases del horario", () => {
    cy.wait("@horario")

    cy.contains("Horario").should("be.visible")
    cy.contains("Cálculo Integral").should("be.visible")
    cy.contains("CF301").should("be.visible")
  })
})
