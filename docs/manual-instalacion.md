# Manual de Instalación

---

## 1. Requisitos del sistema

Asegúrate de contar con lo siguiente:

- Node.js (versión 18 o superior)
- npm (incluido con Node.js)
- Git
- Navegador web moderno (Chrome, Edge, Firefox)

Verificar instalación:
```bash
node -v
npm -v
git --version
```
## 2. Clonar el repositorio
Clona el proyecto desde GitHub:
```bash
git clone https://github.com/NOEL318/Accesos-UDLAP.git
cd Accesos-UDLAP
```
## 3. Instalación de dependencias
Instala las dependencias del proyecto:
```bash
npm install
```
##  4. Estructura del proyecto
El proyecto contiene las siguientes carpetas principales:
```bash
/src        → Código fuente (React + TypeScript)
/components → Componentes de interfaz
/screens    → Pantallas principales
/cypress    → Pruebas E2E
/public     → Archivos estáticos
/base       → Recursos visuales (UI)
```
## 5. Configuración del entorno

Actualmente:

No se requiere configuración avanzada
Firebase está pendiente de implementación

## 6. Ejecutar en modo desarrollo

Inicia el servidor local:
```bash
npm run dev
```
Abrir en navegador:
```bash
http://localhost:5173
```

## 7. Construcción del proyecto

Para generar la versión de producción:
```bash
npm run build
```
Para previsualizar:
```bash
npm run preview
```
## 8. Despliegue

El proyecto está desplegado en:

https://accesos-udlap.vercel.app

Plataforma utilizada:

- Vercel

## 9. Pruebas con Cypress

Para ejecutar pruebas E2E:
```bash
npx cypress run
```
Para modo interactivo:
```bash
npx cypress open
```
Ubicación de pruebas:
```bash
/cypress/e2e
```
## 10. Problemas comunes
Error: dependencias no instaladas

Solución:
```bash
npm install
```
Error: puerto ocupado

Solución:

- Cambiar puerto o cerrar procesos activos

## 11. Estado actual del sistema

- Frontend: Implementado

- Backend: Parcial (estructura en desarrollo)

- Base de datos (Firebase): Pendiente

- Pruebas Cypress: Implementadas parcialmente
