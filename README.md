# Gestor de Partida — Expediente Anunnaki (PWA completa)

App web específica para llevar ficha y progreso de *Expediente Anunnaki*. **No incluye contenido del libro**.

## Funciones
- Ficha: Nombre, Edad, País, Profesión
- Atributos: FUE, DES, PER
- Progresión: PX, PV, PD, Euros, niveles de Combate (1–4)
- **Chequeos predefinidos** (crear/editar, exportar/importar JSON)
- Tiradas con dado + atributo y registro detallado (incluye éxito/fracaso en chequeos)
- Habilidades, Equipo, Sección actual, Registro de decisiones y Notas
- Guardado automático + exportar/importar partida (.anu2)
- PWA: instalación en iPhone/Android y uso offline
- Iconos incluidos

## Instalación en GitHub Pages (HTTPS)
1. Crea un repo nuevo en GitHub (público).
2. Sube todos los archivos de esta carpeta (manteniendo rutas).
3. En el repo: **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main` y `/ (root)` → Guardar.
4. Espera 1–2 minutos y abre la URL de Pages que te da GitHub.
5. En iPhone (Safari): **Compartir → Añadir a pantalla de inicio**.

### (Opcional) Workflow automático
Incluye `.github/workflows/pages.yml` para publicar automáticamente al hacer *push* a `main`.

## Importar/Exportar
- Partida: **Exportar .anu2** / **Importar .anu/.anu2**
- Chequeos: **Exportar/Importar** JSON (`ea_checks.json`)

## Notas
- El botón **Recalcular PV/PD** aplica la regla de 10 PX = +1 PV; 4 PX = +1 PD (ajústalo manualmente si usas otras reglas).
- No copies texto del libro en la app; está diseñada como **gestor** personal.
