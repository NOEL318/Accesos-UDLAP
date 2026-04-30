// pruebas de login del admin de colegio
// La pantalla vive en /colegios/login y dispara POST /api/auth/login
// al enviar el formulario. Tras login exitoso navega a /colegios.
describe("Colegios - Login admin", () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/auth/login", {
      fixture: "auth/login-colegio-admin.json",
    }).as("login")
    // /api/auth/me se llama al montar el AuthProvider; lo mockeamos vacio para
    // no sesgar el estado inicial antes de que el admin teclee sus credenciales.
    // Si devolvemos un user valido el LoginScreen redirige automaticamente.
    cy.intercept("GET", "/api/auth/me", { statusCode: 401, body: {} }).as("authMe")
  })

  it("ingresa con credenciales validas", () => {
    cy.visit("/colegios/login")
    // Los inputs ya vienen con valores por defecto (colegios@udlap.mx / demo1234);
    // limpiamos antes de tipear para garantizar el valor exacto.
    cy.get("input[type=email]").clear().type("maria@udlap.mx")
    cy.get("input[type=password]").clear().type("password123")
    cy.contains(/ingresar|iniciar sesion/i).click()
    cy.wait("@login")
    cy.url().should("not.include", "/login")
  })
})
