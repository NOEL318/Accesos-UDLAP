// Flujo E2E completo del sistema integrado (Sprint 3).
//
// Recorre los 4 módulos en una sola sesión para demostrar que el sistema
// funciona como una unidad: selector inicial → móvil (residente crea visita) →
// iPad (oficial ve KPIs) → colegios (admin ve dashboard de residencias).
//
// Es la evidencia E2E "extremo a extremo" que pide el Sprint 3 y que se
// referencia desde docs/sprint3/MATRIZ_PRUEBAS.md (caso E2E-01).
//
// Estrategia:
// - Mockeamos los endpoints comunes con fixtures ya existentes para cada módulo.
// - Usamos cy.visitAs(rol, ruta) para hidratar localStorage entre roles, en
//   lugar de simular logout/login completos (más estable en CI sin backend
//   real). Eso sigue cubriendo el flujo: selector → módulo → acción → módulo
//   siguiente.

describe("Flujo completo end-to-end - integración Sprint 3", () => {
  it("selector → móvil (crear visita) → iPad (dashboard) → colegios (dashboard)", () => {
    // ── Paso 1: Selector inicial ────────────────────────────────────────────
    cy.visit("/")
    cy.contains(/m[oó]vil/i).should("be.visible")
    cy.contains(/iPad/i).should("be.visible")
    cy.contains(/quiosco/i).should("be.visible")
    cy.contains(/colegios/i).should("be.visible")

    // ── Paso 2: Móvil — residente crea una visita ──────────────────────────
    cy.mockApiBase()
    cy.intercept("GET", "/api/visitas*", { body: [] }).as("listaVisitas")
    cy.intercept("POST", "/api/visitas", { fixture: "visitas/creada.json" }).as("crearVisita")
    cy.visitAs("residente", "/movil/visitas/nueva")

    cy.contains("Registrar Visita").should("be.visible")
    cy.get('input[placeholder="Nombre Apellido"]').type("Pedro Hernández")
    cy.contains("button", /Automóvil/i).click()
    cy.contains("button", /Generar Código de Acceso/i).click()

    cy.wait("@crearVisita").its("request.body").should("deep.include", {
      tipoAcceso: "vehicular",
      multiplesEntradas: false,
    })
    cy.contains(/registrad|correctamente|exitos/i).should("be.visible")

    // ── Paso 3: iPad — oficial entra al dashboard de seguridad ─────────────
    cy.intercept("GET", "/api/kpis/ipad", { fixture: "ipad/kpis.json" }).as("kpis")
    cy.intercept("GET", "/api/eventos-acceso*", { fixture: "ipad/eventos.json" }).as("eventos")
    cy.intercept("GET", "/api/vehiculos*", { fixture: "ipad/vehiculos.json" }).as("vehiculos")
    cy.intercept("GET", "/api/multas*", { fixture: "ipad/multas.json" }).as("multas")
    cy.intercept("GET", "/api/alertas*", { fixture: "ipad/alertas.json" }).as("alertas")
    cy.intercept("GET", "/api/puntos-control*", { fixture: "ipad/puntos.json" }).as("puntos")
    cy.visitAs("oficial", "/ipad/dashboard")

    cy.wait("@kpis")
    cy.contains("Entradas Hoy").should("be.visible")
    cy.contains("Puntos de Control").should("be.visible")

    // ── Paso 4: Colegios — admin entra al dashboard residencial ────────────
    cy.intercept("GET", "/api/colegios/edificios*", { fixture: "colegios/edificios.json" }).as("ed")
    cy.intercept("GET", "/api/colegios/residentes*", { fixture: "colegios/residentes.json" }).as("res")
    cy.intercept("GET", "/api/colegios/movimientos*", { fixture: "colegios/movimientos.json" }).as("movs")
    cy.intercept("GET", "/api/alertas*", { fixture: "colegios/alertas.json" }).as("alertasCol")
    cy.intercept("GET", "/api/visitas*", { body: [] }).as("visitasCol")
    cy.intercept("GET", "/api/colegios/kpis*", { fixture: "colegios/kpis.json" }).as("kpisCol")
    cy.visitAs("colegio-admin", "/colegios/dashboard")

    cy.url().should("include", "/colegios")

    // ── Cierre: volver al selector y confirmar coherencia visual ───────────
    cy.visit("/")
    cy.contains(/m[oó]vil/i).should("be.visible")
    cy.contains(/colegios/i).should("be.visible")
  })
})
