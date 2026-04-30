// pruebas del login del kiosco con seleccion de oficial
// La pantalla vive en /quiosco/login y monta GET /api/auth/oficiales al cargar.
// Tras escoger un oficial se renderiza un teclado numerico (PinKeypad) que dispara
// POST /api/auth/login-pin al completar 4 digitos.
describe("Kiosco - Login de oficial", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("POST", "/api/auth/login-pin", { fixture: "auth/login-oficial.json" }).as("loginPin")
  })

  it("muestra la lista de oficiales y permite seleccionar uno", () => {
    cy.visit("/quiosco/login")
    cy.wait("@oficiales")

    cy.contains("Quiosco UDLAP").should("be.visible")
    cy.contains("Selecciona oficial operador").should("be.visible")

    // Los oficiales vienen de cypress/fixtures/auth/oficiales.json
    cy.contains("Carlos Ramírez").should("be.visible")
    cy.contains("Lucía Torres").should("be.visible")
  })

  it("ingresa con PIN correcto y avanza al kiosco principal", () => {
    cy.visit("/quiosco/login")
    cy.wait("@oficiales")

    // Tras seleccionar al oficial se muestra el keypad y los 4 indicadores de PIN
    cy.contains("Carlos Ramírez").click()
    cy.contains("← Cambiar oficial").should("be.visible")

    // Tecleamos 4 digitos en el PinKeypad. Cada NumericKey es un <button> con el texto del digito.
    // Usamos selectores que apunten exactamente al boton del digito (evitando coincidir
    // con el avatar del oficial seleccionado u otros textos).
    cy.get("button").contains(/^1$/).click()
    cy.get("button").contains(/^2$/).click()
    cy.get("button").contains(/^3$/).click()
    cy.get("button").contains(/^4$/).click()

    cy.wait("@loginPin").its("request.body").should("deep.include", {
      oficialUserId: "u-of-1",
      pin: "1234",
    })

    // Tras login exitoso navega a /quiosco (la pantalla principal)
    cy.url().should("include", "/quiosco")
    cy.url().should("not.include", "/quiosco/login")
  })

  it("permite volver a cambiar de oficial despues de seleccionar uno", () => {
    cy.visit("/quiosco/login")
    cy.wait("@oficiales")

    cy.contains("Carlos Ramírez").click()
    cy.contains("← Cambiar oficial").click()
    cy.contains("Selecciona oficial operador").should("be.visible")
  })
})
