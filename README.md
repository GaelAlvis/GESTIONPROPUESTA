# Gestión Comercial (demo)

Plataforma web para gestionar **ventas por mayor y por menor, productos e inventario, compras y proveedores, gastos e ingresos**. Los datos de ejemplo son de una distribuidora de **huevos** que además **produce escabeches**, pero sirve para cualquier negocio.

Es una aplicación 100 % estática (HTML + CSS + JavaScript, sin compilar). Funciona en GitHub Pages gratis y ya trae **90 días de datos de ejemplo** para mostrarla.

## Módulos

| Módulo | Qué hace |
|---|---|
| **Resumen** | Ventas, utilidad bruta y neta, gastos, ticket promedio, valor del inventario. Gráficos de ventas por día (mayor/menor), productos más vendidos y gastos por categoría. Alertas de stock bajo, vencimientos y cuentas por pagar. |
| **Ventas** | Punto de venta con precio automático según cantidad y presentación, sugerencia de "lleva X más y paga menos", descuento, medio de pago y comprobante imprimible. Historial con filtros, anulación (devuelve stock) y exportación a CSV. |
| **Productos y precios** | Lista de precios por producto: costo de compra (agencia) o de producción, precio mayorista, precio al cliente final y la ganancia de cada uno. Ganancia real por producto en el periodo. Catálogo con presentaciones (unidad, maple x30, caja x360, frasco…), escalas por volumen, stock mínimo y vencimiento. |
| **Compras y proveedores** | Compras a la agencia que suman stock y recalculan el costo promedio ponderado. Compras pagadas o a crédito, sugerencia de reposición. Directorio de proveedores con total comprado y deuda. |
| **Producción** | Lotes de producción (escabeches): insumos y costos invertidos, cantidad producida, costo por frasco y ganancia esperada por mayor y al cliente final. Ganancia real según lo vendido. |
| **Huevos dañados** | Registro de huevos o productos dañados (rotos en transporte, trizados, sucios, vencidos…). Reporte de cantidad, % de lo comprado, pérdida en Bs por semana, motivo y producto. |
| **Caja** | Estado de resultados, flujo de caja, entradas y salidas por semana, ventas por medio de pago y registro de gastos u otros ingresos. |
| **Configuración** | Nombre del negocio, moneda, respaldo y restauración (.json), regenerar los datos de ejemplo o empezar en blanco. |

### Cómo se calcula el precio por mayor

1. Cada producto tiene una **unidad base** (und, kg, L…), que es en la que se lleva el stock.
2. Cada **presentación** indica cuántas unidades base contiene (p. ej. *Caja x12* = 12 und).
3. Cada presentación tiene **escalas por volumen**. Ej. Huevo Extra: *Maple x30*: 1+ a Bs 30 (cliente final) y 10+ a Bs 28 (mayorista); *Caja x360*: 1+ a Bs 320 y 5+ a Bs 312.
4. Cada presentación se marca como **cliente final** o **mayorista**. Una venta cuenta como **por mayor** si usa una presentación mayorista o si alcanza una escala por volumen.

## Publicarla gratis en GitHub Pages

1. Crea un repositorio en GitHub (puede ser público o privado con GitHub Pro; para cuentas gratis, **público**).
2. Sube **todos** los archivos de esta carpeta a la raíz del repositorio (botón *Add file → Upload files*, arrastra la carpeta completa).
3. En el repositorio entra a **Settings → Pages**.
4. En *Build and deployment* elige **Source: Deploy from a branch**, rama **main**, carpeta **/ (root)** y pulsa **Save**.
5. En 1 o 2 minutos la página queda publicada en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

Para probarla en tu computadora sin publicarla, abre `index.html` con doble clic. Los gráficos necesitan internet porque Chart.js se carga desde un CDN.

## Importante sobre los datos (modo demo)

- Los datos se guardan en el **navegador** (localStorage). Cada persona o equipo que abra la página verá su propia copia.
- Si se borran los datos del navegador, se pierde lo registrado. Usa **Configuración → Descargar respaldo**.
- Para uso real con varios usuarios, el siguiente paso es conectar una base de datos en la nube (ver abajo).

## Siguiente paso: base de datos real y gratis

Toda la lógica de datos está en `js/store.js` (objetos `Store` y `Ops`). Para escalar:

- **Supabase** (plan gratis: PostgreSQL, login de usuarios, API automática). Se crean tablas `productos`, `presentaciones`, `ventas`, `venta_items`, `compras`, `compra_items`, `proveedores` y `movimientos`, y se reemplazan `Store.load/save` y `Ops.*` por llamadas a Supabase. El frontend sigue en GitHub Pages.
- Alternativas gratuitas: Firebase (Firestore), Neon (PostgreSQL) y Cloudflare Pages + D1.

## Estructura

```
index.html            Estructura y menú
css/styles.css        Estilos (tema claro en tonos cálidos, responsive)
js/utils.js           Formatos, fechas y exportación CSV
js/pricing.js         Motor de precios mayor/menor
js/store.js           Datos y operaciones (venta, compra, anulaciones)
js/seed.js            Datos de demostración
js/ui.js              Modales, avisos y gráficos
js/views/*.js         Pantallas: dashboard, ventas, productos, compras, caja, config
js/app.js             Navegación
```
