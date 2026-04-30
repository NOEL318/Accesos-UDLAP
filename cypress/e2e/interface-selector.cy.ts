// pruebas del selector inicial de interfaz
// La pantalla raíz "/" muestra 4 tarjetas: Quiosco, Móvil, iPad y Colegios Residenciales.
// Cada tarjeta es un <button> que navega via useNavigate(iface.path).
describe("Interface Selector", () => {
  it("muestra las 4 opciones y navega a movil", () => {
    cy.visit("/")

    // Las cuatro tarjetas (busqueda case-insensitive con tildes opcionales).
    cy.contains(/m[oó]vil/i).should("be.visible")
    cy.contains(/iPad/i).should("be.visible")
    cy.contains(/quiosco/i).should("be.visible")
    cy.contains(/colegios/i).should("be.visible")

    // Al hacer click en la tarjeta de Móvil debe navegar a /movil
    // (el guard /movil podria redirigir a /movil/login si no hay sesion,
    // por eso aceptamos cualquier URL que incluya "/movil").
    cy.contains(/m[oó]vil/i).click()
    cy.url().should("include", "/movil")
  })
})
