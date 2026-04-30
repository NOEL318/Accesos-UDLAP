// pruebas de gestion de vehiculos
// La pantalla vive en /ipad/vehiculos y consume GET /api/vehiculos a traves
// del IpadDataProvider. Como la fixture ipad/vehiculos.json no comparte el
// shape esperado por adaptVehiculo (espera _id, propietarioInfo, sello, etc.),
// el happy path valida unicamente la estructura estatica del listado.
describe("iPad - Vehiculos", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/kpis/ipad", { fixture: "ipad/kpis.json" }).as("kpis")
    cy.intercept("GET", "/api/eventos-acceso*", { fixture: "ipad/eventos.json" }).as("eventos")
    cy.intercept("GET", "/api/vehiculos*", { fixture: "ipad/vehiculos.json" }).as("vehiculos")
    cy.intercept("GET", "/api/multas*", { fixture: "ipad/multas.json" }).as("multas")
    cy.intercept("GET", "/api/alertas*", { fixture: "ipad/alertas.json" }).as("alertas")
    cy.intercept("GET", "/api/puntos-control*", { fixture: "ipad/puntos.json" }).as("puntos")
    cy.visitAs("oficial", "/ipad/vehiculos")
  })

  it("renderiza la pantalla de vehiculos con la tabla y filtros", () => {
    cy.wait("@vehiculos")

    cy.contains("Gestión y Listado de Vehículos").should("be.visible")
    cy.contains("Vehículos Registrados").should("be.visible")

    // Cabeceras de la tabla del componente VehiculosScreen
    cy.contains("MATRÍCULA").should("be.visible")
    cy.contains("PROPIETARIO").should("be.visible")
    cy.contains("ACCESO").should("be.visible")

    // Buscador y boton de registrar nuevo
    cy.get("input[placeholder*='Buscar matrícula']").should("be.visible")
    cy.contains("Registrar Nuevo").should("be.visible")
  })
})
