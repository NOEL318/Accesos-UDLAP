// pruebas del flujo de pedido en el comedor
// La pantalla vive en /movil/comedor y consume GET /api/comedor/menu. Las
// categorias incluyen "Todos" por default, asi que el menu completo es visible
// al cargar. Para crear un pedido se postea a /api/comedor/ordenes.
describe("Movil - Comedor", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/comedor/menu", { fixture: "comedor/menu.json" }).as("menu")
    cy.intercept("POST", "/api/comedor/ordenes", { fixture: "comedor/orden-creada.json" }).as("ordenar")
    cy.visitAs("residente", "/movil/comedor")
  })

  it("muestra el menu con los platillos disponibles", () => {
    cy.wait("@menu")

    cy.contains("Comedores UDLAP").should("be.visible")
    cy.contains("Bowl Mediterráneo").should("be.visible")
    cy.contains("Hamburguesa UDLAP").should("be.visible")
  })
})
