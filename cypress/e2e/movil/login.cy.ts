// pruebas de login del residente en la version movil
// La pantalla vive en /movil/login y al enviar el formulario dispara
// POST /api/auth/login. Tras un login exitoso navega segun el rol del usuario.
describe("Movil - Login residente", () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/auth/login", { fixture: "auth/login-residente.json" }).as("login")
    // /api/auth/me se llama al montar el AuthProvider; lo mockeamos vacio para no
    // sesgar el estado inicial antes de que el residente teclee sus credenciales.
    cy.intercept("GET", "/api/auth/me", { statusCode: 401, body: {} }).as("authMe")
  })

  it("ingresa con email y password validos", () => {
    cy.visit("/movil/login")

    cy.contains("Iniciar Sesión").should("be.visible")
    cy.get("input[type=email]").type("ana@udlap.mx")
    cy.get("input[type=password]").type("password123")

    // El boton submit del formulario muestra "Iniciar Sesión" (mismo texto que el h1).
    // Forzamos el match exacto sobre el boton para evitar tomar el header por error.
    cy.get("button[type=submit]").contains(/Iniciar Sesión/i).click()

    cy.wait("@login").its("request.body").should("deep.include", {
      email: "ana@udlap.mx",
      password: "password123",
    })

    // Tras login exitoso, debe salir del /movil/login.
    cy.url().should("not.include", "/movil/login")
  })
})
