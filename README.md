# Cadenas de Markov

Guía web estática, accesible e interactiva sobre cadenas de Markov en tiempo discreto. El proyecto está publicado en [luisq-dev.github.io](https://luisq-dev.github.io/).

## Funcionalidades

- Conceptos de estados, clases de comunicación y propiedades de las cadenas.
- Constructor reutilizable de matrices de 2 a 5 estados con validación.
- Cálculo de P², P³, probabilidades en n pasos y distribución estacionaria.
- Detección de matrices inválidas, cadenas reducibles, periódicas y distribuciones múltiples.
- Simulador paso a paso o automático con tabla de datos accesible.
- Casos de aplicación identificados como ejemplos didácticos, con fuentes de contexto.
- Autoevaluación accesible por teclado y glosario con búsqueda sin acentos.
- Temas claro y oscuro, modo de movimiento reducido, SEO y datos estructurados.

## Desarrollo

Requiere Node.js 20 o posterior. El código fuente usa módulos JavaScript nativos y se compila con esbuild a un `script.js` clásico. El bundle generado se versiona para que GitHub Pages funcione sin configuración de build y también al abrir `index.html` directamente.

```bash
npm install
npm run build
npm run dev
```

Abre <http://127.0.0.1:4173>. También puedes abrir `index.html` directamente: el bundle clásico mantiene las funciones interactivas; el servidor local solo es necesario para cargar las tipografías autoalojadas sin restricciones CORS.

## Calidad

```bash
npm run build         # Regenerar el bundle publicable
npm run build:check   # Verificar que el bundle versionado esté actualizado
npm run lint          # ESLint, Stylelint y HTML Validate
npm run format:check  # Prettier
npm test              # Vitest
npm run test:coverage
npm run test:e2e      # Playwright + Axe; requiere el navegador de Playwright
npm run check         # Lint + formato + pruebas unitarias
```

Para preparar Playwright localmente:

```bash
npx playwright install chromium
```

La integración continua ejecuta las mismas validaciones en cada push y pull request.

## Estructura

```text
.
├── assets/              # Fuentes, favicon e imagen social
├── src/
│   ├── components/      # Módulos de interfaz
│   ├── data/            # Ejemplos, contenido y bibliografía
│   └── utils/           # Álgebra Markov, DOM y SVG
├── tests/
│   ├── e2e/             # Pruebas de interacción y accesibilidad
│   └── markov.test.js   # Pruebas matemáticas y de datos
├── index.html
├── script.js            # Bundle generado y versionado
└── styles.css
```

## Convenciones matemáticas

- Las matrices usan la convención **por filas**: cada fila suma 1.
- Se acepta una tolerancia de `0.005` para facilitar la entrada manual; las operaciones internas usan tolerancias numéricas menores.
- Una distribución estacionaria no se presenta como única si el sistema lineal tiene varias soluciones.
- Para cadenas con más de una distribución, la interfaz informa las distribuciones de largo plazo obtenidas como promedios de Cesàro desde cada estado inicial.
- Los porcentajes de los casos se generan desde la matriz; no hay valores escritos manualmente que puedan quedar desincronizados.

## Datos y fuentes

Las matrices de aplicación son **didácticas**. Los enlaces a IDEAM, BVC, DANE y OMS proporcionan contexto para obtener datos originales, pero el proyecto no afirma haber calculado sus probabilidades a partir de esas fuentes.

## Despliegue

El repositorio está preparado para GitHub Pages desde la rama `main`. Tras fusionar, GitHub Pages publica la raíz del proyecto. Verifica en **Settings → Pages** que la fuente sea _Deploy from a branch_.

## Recursos visuales

Las tipografías DM Sans, Syne y Space Mono se autoalojan desde `assets/fonts` y se distribuyen bajo la SIL Open Font License 1.1. Consulta [assets/fonts/README.md](assets/fonts/README.md).

## Licencia

Código y contenido: [MIT](LICENSE).
