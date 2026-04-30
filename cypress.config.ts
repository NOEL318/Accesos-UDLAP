import { defineConfig } from "cypress"

export default defineConfig({
  // Habilitamos Cypress.env para compartir el rol simulado entre comandos y el
  // hook window:before:load que hidrata localStorage en cada visit.
  allowCypressEnv: true,

  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents() {
      // sin event listeners por ahora
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
})
