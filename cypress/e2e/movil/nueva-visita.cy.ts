// pruebas del flujo de creacion de visita programada
// La pantalla vive en /movil/visitas/nueva. El input de nombre NO tiene atributo
// name="nombre" (es un componente <Input> de shadcn). Lo localizamos por su placeholder
// "Nombre Apellido" que coincide con el codigo. La pantalla NO tiene un campo
// de identificacion, asi que solo capturamos nombre y los selectores ya tienen valor
// por defecto (tipo "visita", modo "automovil", primer punto de acceso).
describe("Movil - Nueva visita", () => {
  beforeEach(() => {
    cy.mockApiBase()
    // El hook useVisitas carga la lista al montar la pantalla de nueva visita
    // (el create llama a refresh internamente). Stubeamos para evitar 404.
    cy.intercept("GET", "/api/visitas*", { body: [] }).as("listaVisitas")
    cy.intercept("POST", "/api/visitas", { fixture: "visitas/creada.json" }).as("crear")
    cy.visitAs("residente", "/movil/visitas/nueva")
  })

  it("crea una visita con datos validos", () => {
    cy.contains("Registrar Visita").should("be.visible")

    // Campo de nombre del visitante (Input de shadcn con placeholder "Nombre Apellido").
    cy.get('input[placeholder="Nombre Apellido"]').type("Juan Pérez")

    // El boton de modo "Automóvil" ya viene seleccionado por defecto, pero lo
    // clickeamos explicitamente para validar la interaccion.
    cy.contains("button", /Automóvil/i).click()

    // Boton final del formulario.
    cy.contains("button", /Generar Código de Acceso/i).click()
    cy.wait("@crear").its("request.body").should("deep.include", {
      tipoAcceso: "vehicular",
      multiplesEntradas: false,
    })

    // Tras crear, se abre un Sheet con el mensaje de exito.
    cy.contains(/registrad|correctamente|exitos/i).should("be.visible")
  })
})
