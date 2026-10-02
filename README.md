# 🏀 Club SOMISA · Estadísticas de Baloncesto y Mapa de Tiro

Plataforma técnica profesional para el registro y análisis estadístico post-partido de **Club SOMISA** (San Nicolás de los Arroyos, Buenos Aires, Argentina - Liga Federal de Básquet).

---

## 🚀 Cómo Solucionar la Pantalla Blanca con "Deploy from a branch"

### ¿Por qué salía la pantalla en blanco?
Al seleccionar en GitHub Pages la opción **"Deploy from a branch"** con la rama `main`, GitHub intenta servir directamente los archivos fuente (`index.html` que apunta a `src/main.tsx`). Como ningún navegador puede ejecutar TypeScript ni JSX sin compilar, la pantalla queda totalmente en blanco.

Para usar **Deploy from a branch**, GitHub Pages debe servir la rama compilada: **`gh-pages`**.

---

### Pasos para que funcione al 100% (con "Deploy from a branch"):

#### Método 1: Automático con GitHub (Recomendado)
1. Sube los cambios a tu repositorio:
   ```bash
   git add .
   git commit -m "Configurar despliegue a gh-pages"
   git push origin main
   ```
2. El archivo `.github/workflows/static.yml` compilará la app automáticamente y creará la rama **`gh-pages`**.
3. En GitHub, ve a **Settings** > **Pages**:
   - **Source**: `Deploy from a branch`
   - **Branch**: Selecciona 👉 **`gh-pages`** (carpeta: `/ (root)`)
   - Clic en **Save**.
4. ¡Listo! Espera unos segundos y abre tu URL:
   `https://<tu-usuario>.github.io/<tu-repo>/`

#### Método 2: Despliegue Directo desde tu Terminal
También puedes desplegar directamente con un solo comando:
```bash
npm run deploy
```
*(Este comando compila la app y sube la carpeta `dist` directamente a la rama `gh-pages` de tu GitHub).*

---

## 💻 Ejecución Local en tu Computadora

```bash
# 1. Clonar el repositorio
git clone https://github.com/<tu-usuario>/<nombre-del-repo>.git

# 2. Ingresar a la carpeta
cd <nombre-del-repo>

# 3. Instalar dependencias
npm install

# 4. Iniciar servidor de desarrollo
npm run dev
```
Abre tu navegador en `http://localhost:3000`.

---

## 📊 Características de la Plataforma

- **Planilla Oficial de Partido**: Registro exacto según planilla técnica de básquetbol con cálculos automáticos de porcentajes (`Ti%`, `3P%`, `3PAr`, `TL%`, `FTr`, `eFG%`, `TS%`, `ToV%`, `RT`, `Pt`, `Pts Tot`).
- **Dorsales y Plantilla Oficial de Club SOMISA**: Asignación de camiseta `#`, nombres y posiciones con sincronización a todos los partidos.
- **Mapa de Tiro y Zonas de Calor**: Coordenadas visuales de tiros convertidos y fallados con mapa de calor por zonas.
- **Resúmenes Automáticos**: Indicadores de equipo (4 factores) y estadísticas acumuladas por jugador.
- **Exportaciones**: Reportes listos para imprimir o compartir en PDF y CSV.

---

© 2026 Club SOMISA de San Nicolás de los Arroyos · Liga Federal de Básquet
