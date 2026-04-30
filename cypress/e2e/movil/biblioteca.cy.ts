// pruebas del flujo de busqueda y prestamo en biblioteca
// La pantalla vive en /movil/biblioteca y consume tres GET en paralelo:
// /api/biblioteca/libros, /api/biblioteca/prestamos y /api/biblioteca/deseos.
// La pestania "Favoritos" se muestra por default y lista prestamos + lista de
// deseos. Para ver el catalogo (donde aparecen los libros) hay que ir al tab
// "Material".
describe("Movil - Biblioteca", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("GET", "/api/biblioteca/libros", { fixture: "biblioteca/libros.json" }).as("libros")
    cy.intercept("GET", "/api/biblioteca/prestamos", { fixture: "biblioteca/prestamos.json" }).as("prestamos")
    cy.intercept("GET", "/api/biblioteca/deseos", { fixture: "biblioteca/deseos.json" }).as("deseos")
    cy.intercept("POST", "/api/biblioteca/prestamos", {
      statusCode: 201,
      body: { id: "p2" },
    }).as("prestar")
    cy.visitAs("residente", "/movil/biblioteca")
  })

  it("muestra libros y prestamos del residente", () => {
    cy.wait(["@libros", "@prestamos", "@deseos"])

    cy.contains("Biblioteca UDLAP").should("be.visible")

    // En la pestania por default ("Favoritos") se ven los prestamos activos.
    cy.contains("Sistemas Operativos Modernos").should("be.visible")

    // Cambiamos a la pestania "Material" para ver el catalogo completo.
    cy.contains("button", /^Material$/).click()
    cy.contains("Clean Code").should("be.visible")
  })
})
