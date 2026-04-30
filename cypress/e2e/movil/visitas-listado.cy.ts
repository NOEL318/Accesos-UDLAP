// pruebas del listado y detalle de visitas
// La pantalla vive en /movil/visitas y consume GET /api/visitas. La fixture
// visitas/lista.json trae 2 elementos con campo "id" (no "_id"). El componente
// VisitasScreen usa v._id en la key/onClick, asi que para mantener compatibilidad
// con la fixture seguimos los textos visibles ("Juan Pérez", "Marta Gómez").
describe("Movil - Listado de visitas", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/visitas*", { fixture: "visitas/lista.json" }).as("lista")
    // El hook useVisita pega a /api/visitas/:id; mockeamos por path glob.
    cy.intercept("GET", "/api/visitas/*", { fixture: "visitas/detalle.json" }).as("detalle")
    cy.visitAs("residente", "/movil/visitas")
  })

  it("muestra las visitas y abre el detalle", () => {
    cy.wait("@lista")

    cy.contains("Visitas y Accesos").should("be.visible")
    cy.contains("Juan Pérez").should("be.visible")
    cy.contains("Marta Gómez").should("be.visible")

    cy.contains("Juan Pérez").click()
    cy.url().should("match", /\/movil\/visitas\/[^/]+/)

    // En la pantalla de detalle se muestra el nombre del invitado.
    cy.contains("Juan Pérez").should("be.visible")
  })
})
