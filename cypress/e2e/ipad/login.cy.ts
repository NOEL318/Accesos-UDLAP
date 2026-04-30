// pruebas de login del oficial en el iPad con PIN
// La pantalla vive en /ipad/login y monta GET /api/auth/oficiales al cargar.
// Tras escoger un oficial se renderiza el PinKeypad y al completar 4 digitos
// dispara POST /api/auth/login-pin. La sesion se guarda via AuthProvider y el
// IpadLayoutInner redirige automaticamente a /ipad/dashboard.
describe("iPad - Login oficial", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.intercept("POST", "/api/auth/login-pin", { fixture: "auth/login-oficial.json" }).as("loginPin")
  })

  it("muestra la lista de oficiales en la pantalla de login", () => {
    cy.visit("/ipad/login")
    cy.wait("@oficiales")

    cy.contains("Selecciona tu perfil").should("be.visible")
    // Los oficiales vienen de cypress/fixtures/auth/oficiales.json
    cy.contains("Carlos Ramírez").should("be.visible")
    cy.contains("Lucía Torres").should("be.visible")
  })

  it("ingresa con PIN correcto", () => {
    cy.visit("/ipad/login")
    cy.wait("@oficiales")

    // Tras seleccionar al oficial se muestra el keypad y los 4 indicadores de PIN
    cy.contains("Carlos Ramírez").click()

    // Tecleamos 4 digitos en el PinKeypad. Cada NumericKey es un <button> con el
    // texto del digito. Usamos regex exacto para evitar coincidir con otros textos.
    ;["1", "2", "3", "4"].forEach((d) =>
      cy.get("button").contains(new RegExp(`^${d}$`)).click()
    )

    cy.wait("@loginPin").its("request.body").should("deep.include", {
      oficialUserId: "u-of-1",
      pin: "1234",
    })

    // Tras login exitoso, debe salir del /ipad/login.
    cy.url().should("not.include", "/ipad/login")
  })
})
