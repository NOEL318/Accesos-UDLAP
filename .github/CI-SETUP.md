# Configuración del CI

Este repo usa un workflow de GitHub Actions (`.github/workflows/ci.yml`) que corre la suite Cypress en push a `dev` y `master`, más un build adicional en `master`.

## Pasos para activar el workflow

1. Hacer push del archivo `.github/workflows/ci.yml` a `master`. Eso registra el workflow en GitHub.
2. Crear la rama `dev` desde `master` (ver siguiente sección).
3. Verificar en la pestaña **Actions** del repo en GitHub que aparece el workflow "CI".

## Crear la rama `dev`

Esta rama no existe todavía. Crearla con:

```bash
git checkout master
git pull origin master
git checkout -b dev
git push -u origin dev
```

El primer push a `dev` debería disparar el workflow `cypress` (sin el job `build`, que solo corre en master).

## Flujo de trabajo

1. Trabajo se hace en `dev` o ramas feature mergeadas a `dev`. Cada push corre Cypress.
2. Cuando `dev` está verde, el usuario hace **merge manual** a `master`:
   ```bash
   git checkout master
   git merge dev
   git push origin master
   ```
   (O abrir un PR en GitHub si quiere review.)
3. El push a `master` dispara: Cypress + build. Si pasa, Vercel deploya automáticamente desde su propia integración con GitHub.

## Branch protection (opcional, recomendado)

GitHub > Settings > Branches > Add branch protection rule:

### Para `master`:
- Branch name pattern: `master`
- Require pull request reviews before merging (opcional, depende del equipo).
- Require status checks to pass: marcar **"Cypress E2E"** y **"Build (solo en master)"**.

### Para `dev`:
- Branch name pattern: `dev`
- Require status checks to pass: marcar **"Cypress E2E"**.

## Deploy a Vercel

Vercel tiene integración propia con GitHub que se dispara automáticamente al hacer push a `master`. **El workflow de GitHub Actions NO se involucra en el deploy** — solo verifica que tests + build pasen antes de que Vercel haga su trabajo en paralelo. Si quieres que el deploy espere al CI verde, hay que configurar "Production Branch" en Vercel para que respete check status (en Project Settings > Git > Production Branch).

## Tests skipped

Hoy hay 5 tests Cypress marcados con `describe.skip` o `it.skip` por bugs conocidos del frontend (ver comentarios inline en los specs). Cuando se arreglen los bugs, quitar los `.skip` para que entren a CI.
