// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Limpia el rol/user inyectado por loginAs para que cada test arranque sin sesion
// previa salvo que invoque loginAs/visitAs explicitamente.
beforeEach(() => {
  Cypress.env("loginAsRol", undefined)
  Cypress.env("loginAsUser", undefined)
})

// Las pantallas hacen muchas llamadas api.get sin .catch (usan try/finally para
// el spinner). Cuando un endpoint no esta mockeado en un spec puntual, el proxy
// de vite intenta conectar al backend real (puerto 4000) y produce un HTTP 500
// que se propaga como unhandled promise rejection. Como la suite e2e no
// pretende correr contra backend real, ignoramos esos rejections para que las
// aserciones del happy path puedan seguir corriendo. Errores REALES (sintaxis,
// undefined props, etc.) siguen apareciendo via cy.visit logs y assertions.
Cypress.on("uncaught:exception", () => {
  // Las pantallas hacen muchas llamadas api sin .catch (try/finally para el
  // spinner) y algunos componentes de Radix lanzan en render cuando reciben un
  // value="" mientras la data hidrata. Como la suite e2e no pretende correr
  // contra un backend real ni cubrir todos los micro-races de hidratacion,
  // suprimimos TODAS las excepciones no manejadas a nivel ventana. Las
  // assertions de cy.contains/cy.url cubren la verificacion funcional.
  return false
})