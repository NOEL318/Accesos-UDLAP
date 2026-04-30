// pruebas del flujo de escaneo QR en el kiosco
// La pantalla principal del kiosco vive en /quiosco. Al validar un token primero llama
// GET /api/visitas/qr/:token (validarQrToken) y despues POST /api/visitas/qr/:token/scan
// para registrar el resultado del escaneo.
describe("Kiosco - Escaneo de acceso", () => {
  beforeEach(() => {
    cy.mockApiBase()
    cy.loginAs("oficial")
  })

  it("escanea un QR válido y muestra acceso permitido", () => {
    // 1) validacion del token: visita programada => permitido
    cy.intercept("GET", "/api/visitas/qr/*", {
      statusCode: 200,
      body: {
        id: "v1",
        invitado: { nombre: "Juan Pérez", identificacion: "PERJ950101" },
        tipoAcceso: "vehicular",
        puntoAcceso: "Principal",
        fechaHora: "2026-04-29T10:00:00Z",
        status: "programada",
        qrToken: "qr-valido-123",
      },
    }).as("validarQr")

    // 2) registro del scan en el backend
    cy.intercept("POST", "/api/visitas/qr/*/scan", {
      statusCode: 200,
      body: { ok: true },
    }).as("scan")

    cy.visit("/quiosco")

    // El input del token es el unico <input> de la pantalla; lo identificamos por placeholder.
    cy.get('input[placeholder="Pega el token del QR"]').type("qr-valido-123")
    cy.contains("button", /^Validar$/).click()

    cy.wait("@validarQr")
    cy.wait("@scan").its("request.body").should("deep.include", {
      puntoId: "kiosco-principal",
      resultado: "permitido",
    })

    // El badge superior cambia a "ACCESO AUTORIZADO" y se muestra el nombre del invitado
    cy.contains("ACCESO AUTORIZADO").should("be.visible")
    cy.contains(/acceso permitido/i).should("be.visible")
    cy.contains("Juan Pérez").should("be.visible")
  })

  it("escanea un QR de visita cancelada y muestra acceso denegado", () => {
    cy.intercept("GET", "/api/visitas/qr/*", {
      statusCode: 200,
      body: {
        id: "v9",
        invitado: { nombre: "Pedro Cancelado", identificacion: "PEDC900101" },
        tipoAcceso: "peatonal",
        puntoAcceso: "Principal",
        fechaHora: "2026-04-29T10:00:00Z",
        status: "cancelada",
        qrToken: "qr-cancelado-456",
      },
    }).as("validarQrCancelada")

    cy.intercept("POST", "/api/visitas/qr/*/scan", {
      statusCode: 200,
      body: { ok: true },
    }).as("scanDenegado")

    cy.visit("/quiosco")

    cy.get('input[placeholder="Pega el token del QR"]').type("qr-cancelado-456")
    cy.contains("button", /^Validar$/).click()

    cy.wait("@validarQrCancelada")
    cy.wait("@scanDenegado").its("request.body").should("deep.include", {
      puntoId: "kiosco-principal",
      resultado: "denegado",
    })

    cy.contains("ACCESO DENEGADO").should("be.visible")
    cy.contains(/acceso denegado/i).should("be.visible")
  })

  it("muestra error cuando el token QR no existe", () => {
    // Si validarQrToken falla, el componente captura el error y muestra el mensaje
    // en el bloque scanError sin llegar a llamar al endpoint /scan.
    cy.intercept("GET", "/api/visitas/qr/*", {
      statusCode: 404,
      body: { message: "QR inválido" },
    }).as("validarQrFail")

    cy.visit("/quiosco")

    cy.get('input[placeholder="Pega el token del QR"]').type("qr-inexistente")
    cy.contains("button", /^Validar$/).click()

    cy.wait("@validarQrFail")

    // El badge cambia a denegado y se muestra el mensaje de error retornado.
    cy.contains("ACCESO DENEGADO").should("be.visible")
    cy.contains(/qr inválido/i).should("be.visible")
  })
})
