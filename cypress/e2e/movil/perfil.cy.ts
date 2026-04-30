// pruebas de la pantalla de perfil del residente
// La pantalla vive en /movil/perfil. Consume el usuario autenticado desde el
// AuthProvider (la fixture me-residente.json provee user.nombre = "Ana Pérez").
// El boton de logout dispara POST /api/auth/logout (mockeado en mockApiBase) y
// luego navega a /movil/login.
describe("Movil - Perfil", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.visitAs("residente", "/movil/perfil")
  })

  it("muestra los datos del usuario y permite cerrar sesion", () => {
    cy.contains("Perfil").should("be.visible")
    cy.contains("Ana Pérez").should("be.visible")

    cy.contains("button", /Cerrar Sesión/i).click()

    cy.url().should("include", "/movil/login")
  })
})
