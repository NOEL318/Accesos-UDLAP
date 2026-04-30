// pruebas del dashboard del iPad de seguridad
// La pantalla vive en /ipad/dashboard y consume varios endpoints a traves del
// IpadDataProvider:
//   GET /api/kpis/ipad         -> useIpadKpis
//   GET /api/eventos-acceso    -> useIpadEventos
//   GET /api/vehiculos         -> useIpadVehiculos
//   GET /api/multas            -> useIpadMultas
//   GET /api/alertas?scope=... -> useIpadAlertas
//   GET /api/puntos-control    -> data context
// El happy path solo valida que la pantalla cargue y muestre los textos estaticos
// principales del dashboard (titulos de KPIs y secciones), sin asumir formatos
// concretos de los datos remotos.
describe("iPad - Dashboard", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/kpis/ipad", { fixture: "ipad/kpis.json" }).as("kpis")
    cy.intercept("GET", "/api/eventos-acceso*", { fixture: "ipad/eventos.json" }).as("eventos")
    cy.intercept("GET", "/api/vehiculos*", { fixture: "ipad/vehiculos.json" }).as("vehiculos")
    cy.intercept("GET", "/api/multas*", { fixture: "ipad/multas.json" }).as("multas")
    cy.intercept("GET", "/api/alertas*", { fixture: "ipad/alertas.json" }).as("alertas")
    cy.intercept("GET", "/api/puntos-control*", { fixture: "ipad/puntos.json" }).as("puntos")
    cy.visitAs("oficial", "/ipad/dashboard")
  })

  it("muestra los KPIs principales y las secciones del dashboard", () => {
    cy.wait("@kpis")

    // Etiquetas estaticas de los KpiCard del DashboardScreen
    cy.contains("Entradas Hoy").should("be.visible")
    cy.contains("Incidentes Activos").should("be.visible")
    cy.contains("Vehículos en Campus").should("be.visible")
    cy.contains("Visitas Nocturnas").should("be.visible")

    // Secciones principales del dashboard
    cy.contains("Puntos de Control").should("be.visible")
    cy.contains("Acciones Rápidas").should("be.visible")
  })
})
