// pruebas de emision de multas
// La pantalla vive en /ipad/multas y consume GET /api/multas y GET /api/vehiculos
// a traves del IpadDataProvider. La pantalla es un formulario para registrar
// nuevas multas con seleccion de vehiculo por placa, tipo de infraccion, monto
// y evidencia fotografica. El happy path valida que la pantalla cargue y
// muestre los controles principales del formulario.
describe("iPad - Multas", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/kpis/ipad", { fixture: "ipad/kpis.json" }).as("kpis")
    cy.intercept("GET", "/api/eventos-acceso*", { fixture: "ipad/eventos.json" }).as("eventos")
    cy.intercept("GET", "/api/vehiculos*", { fixture: "ipad/vehiculos.json" }).as("vehiculos")
    cy.intercept("GET", "/api/multas*", { fixture: "ipad/multas.json" }).as("multas")
    cy.intercept("GET", "/api/alertas*", { fixture: "ipad/alertas.json" }).as("alertas")
    cy.intercept("GET", "/api/puntos-control*", { fixture: "ipad/puntos.json" }).as("puntos")
    cy.visitAs("oficial", "/ipad/multas")
  })

  it("muestra el formulario de registro de multas", () => {
    cy.wait("@multas")

    cy.contains("Registrar Nueva Multa").should("be.visible")
    cy.contains("Detalles de la Infracción").should("be.visible")

    // Campos clave del formulario en MultasScreen
    cy.contains("Buscar Vehículo por Placa").should("be.visible")
    cy.contains("Tipo de Infracción").should("be.visible")
    cy.contains("Monto (MXN)").should("be.visible")
    cy.contains("Evidencia Fotográfica").should("be.visible")

    // Botones de accion
    cy.contains("Confirmar Multa").should("be.visible")
    cy.contains("Cancelar").should("be.visible")
  })
})
