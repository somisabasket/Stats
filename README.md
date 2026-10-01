# 🏀 Club SOMISA · Estadísticas de Baloncesto y Mapa de Tiro

Plataforma técnica profesional para el registro y análisis estadístico post-partido de **Club SOMISA** (San Nicolás de los Arroyos, Buenos Aires, Argentina - Liga Federal de Básquet).

Diseñada con los colores institucionales del club (**Azul Pantone 281 C `#00205B`**, gris técnico y blanco) y con **modo oscuro** para lectura nocturna.

---

## 🌐 Cómo Ver la Aplicación en Vivo en GitHub Pages

Esta aplicación está 100% preparada para funcionar en **GitHub Pages** de forma gratuita y automática:

### Paso a Paso para Activar GitHub Pages:
1. Sube este repositorio a tu cuenta de GitHub (`git push origin main`).
2. En la página de tu repositorio en GitHub, ve a la pestaña **Settings** (Configuración).
3. En el menú lateral izquierdo, haz clic en **Pages**.
4. En la sección **Build and deployment** > **Source**, selecciona:
   👉 **`GitHub Actions`**
5. ¡Listo! El flujo de trabajo `.github/workflows/deploy.yml` compilará la app automáticamente y te dará el enlace público:
   `https://<tu-usuario>.github.io/<nombre-del-repo>/`

---

## 💻 Ejecución Local en tu Computadora

Si quieres ejecutar la aplicación en tu máquina local:

```bash
# 1. Clonar el repositorio
git clone https://github.com/<tu-usuario>/<nombre-del-repo>.git

# 2. Ingresar a la carpeta
cd <nombre-del-repo>

# 3. Instalar las dependencias
npm install

# 4. Iniciar el servidor de desarrollo
npm run dev
```

Abre tu navegador en `http://localhost:3000`.

---

## 📊 Características Principales

1. **Carga Tipo Planilla Técnica Oficial**:
   - Estructura idéntica a planilla técnica de básquetbol con doble columna para dobles (TC/TI), triples (3PC/3PI) y libres (TLC/TLI).
   - Cálculo en tiempo real de porcentajes automáticos: `Ti%`, `3P%`, `3PAr` (en rojo), `TL%`, `FTr`, `eFG%`, `TS%`, `ToV%` (en verde), rebotes (`RD`, `RO`, `RT`), asistencias, robos, pérdidas, tapones y valoración FIBA (`Pts Tot`).
   - Función para **pegar directamente desde Excel o Google Sheets** con `Ctrl + V`.

2. **Gestión de Plantilla y Dorsales (#)**:
   - Administrador de plantilla oficial con nombres, apellidos, dorsales (#) y posiciones (Base, Escolta, Alero, Ala-Pívot, Pívot).
   - Botón de sincronización automática de dorsales para todos los partidos de la temporada.

3. **Mapa de Tiro Interactivo y Zonas de Calor**:
   - Media cancha reglamentaria con detección de coordenadas ($X, Y$) y zona de tiro.
   - Modo de dispersión (scatter) de tiros convertidos y fallados, y mapa de calor por zonas de tiro.
   - Filtros por jugador y efectividad.

4. **Resumen de Equipo y Jugador**:
   - Seguimiento de los 4 factores de Dean Oliver (*Tiro Efectivo eFG%*, *Tasa de Pérdidas ToV%*, *Rebote Ofensivo ORB%* y *Tasa de Libres FTr*).
   - Fichas individuales acumuladas por jugador, promedios por partido (PPG, RPG, APG, SPG, BPG, Valoración) y desglose fecha por fecha.

5. **Alta y Eliminación de Partidos**:
   - Botón **"Dar de Alta Partido"**: crea un nuevo encuentro contra cualquier rival precargando la plantilla de Club SOMISA.
   - Botón **"Eliminar Partido"**: confirmación segura con modal preventivo.

6. **Exportación Automática en 1 Clic**:
   - **Reporte Oficial en PDF**: Formato A4 apaisado con diseño profesional de Club SOMISA, planilla técnica completa, porcentajes y desglose de tiros.
   - **Planilla en CSV**: Compatible directamente con Excel y Google Sheets.
   - **Respaldo JSON**: Descarga y restauración completa de la base de datos de la temporada.

---

## 🛠️ Tecnologías Utilizadas

- **React 19** + **TypeScript**
- **Vite 6/8** con rutas relativas (`base: './'`) para compatibilidad universal en GitHub Pages
- **Tailwind CSS v4** (Paleta Pantone 281 C)
- **jsPDF** para la generación de reportes en PDF descargables
- **Lucide Icons**
- **LocalStorage API** para persistencia total y autónoma sin necesidad de backend externo

---

© 2026 Club SOMISA de San Nicolás de los Arroyos · Liga Federal de Básquet
