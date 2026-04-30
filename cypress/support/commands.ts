/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      mockApiBase(): Chainable<void>
      mockApi(method: string, url: string, fixture: string, alias?: string): Chainable<null>
      loginAs(rol: "residente" | "oficial" | "colegio-admin"): Chainable<void>
      visitAs(rol: "residente" | "oficial" | "colegio-admin", ruta: string): Chainable<void>
    }
  }
}

// monta intercepts base para auth y endpoints comunes en todas las pruebas
Cypress.Commands.add("mockApiBase", () => {
  cy.intercept("GET", "/api/auth/me", { fixture: "auth/me-residente.json" }).as("authMe")
  cy.intercept("POST", "/api/auth/logout", { statusCode: 204 }).as("logout")
  cy.intercept("GET", "/api/auth/oficiales", { fixture: "auth/oficiales.json" }).as("oficiales")
})

// intercepta una ruta con su fixture y registra alias para esperarla
Cypress.Commands.add("mockApi", (method, url, fixture, alias) => {
  return cy.intercept(method, url, { fixture }).as(alias ?? fixture.replace(/[^a-z0-9]/gi, "_"))
})

// Hidratamos localStorage en CADA carga de ventana usando el rol guardado en
// Cypress.env. Asi loginAs() puede llamarse antes de cualquier cy.visit y la
// sesion se aplica desde el primer render del AuthProvider.
Cypress.on("window:before:load", (win) => {
  const rol = Cypress.env("loginAsRol") as
    | "residente"
    | "oficial"
    | "colegio-admin"
    | undefined
  const userJson = Cypress.env("loginAsUser") as string | undefined
  if (rol && userJson) {
    win.localStorage.setItem("accesos_udlap_token", `fake-token-${rol}`)
    win.localStorage.setItem("accesos_udlap_user", userJson)
  }
})

// hace login simulado intercepta /api/auth/me y guarda credenciales en
// Cypress.env para que el hook window:before:load las inyecte en localStorage
// en cada visita posterior.
Cypress.Commands.add("loginAs", (rol) => {
  const fixtureName =
    rol === "residente" ? "auth/me-residente.json"
      : rol === "oficial" ? "auth/me-oficial.json"
      : "auth/me-colegio-admin.json"

  cy.intercept("GET", "/api/auth/me", { fixture: fixtureName }).as("authMe")

  cy.fixture(fixtureName).then((data) => {
    Cypress.env("loginAsRol", rol)
    Cypress.env("loginAsUser", JSON.stringify(data.user))
  })
})

// shortcut: hace login y navega a la ruta indicada
Cypress.Commands.add("visitAs", (rol, ruta) => {
  cy.loginAs(rol)
  cy.visit(ruta)
})

export {}
