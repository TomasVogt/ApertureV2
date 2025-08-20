# G.R.A. - Generador de Rutas de Aprendizaje con IA

![Demo de G.R.A.](ruta/a/tu/captura_o_gif.gif)

G.R.A. (Generador de Rutas de Aprendizaje) es una aplicación web inteligente que diseña mapas conceptuales de aprendizaje personalizados sobre cualquier tema. El usuario introduce un objetivo y su nivel de conocimiento, y la IA genera una ruta visual, interactiva y no lineal, con recursos verificados de alta calidad.

## ✨ Características Principales

- **🗺️ Visualización de Mapa Conceptual Dinámico:** Mapas conceptuales horizontales con nodos y conectores curvos en SVG.
- **🔗 Recursos 100% Verificados:** El backend usa Serper API para comprobar que los enlaces funcionen y sean de calidad.
- **🧠 Ecosistema de Aprendizaje Holístico:** Cada paso incluye un recurso principal, un libro recomendado, un curso de prestigio y un desafío práctico.
- **🌐 Experto en Cualquier Dominio:** IA agnóstica al tema, capaz de recomendar fuentes de autoridad mundial.
- **🔮 Interfaz Atractiva y Animada:** Animaciones de carga y aparición escalonada de nodos para una experiencia moderna.
- **🧩 Arquitectura Robusta:** Backend en Flask y frontend en JavaScript nativo, ligero y fácil de desplegar.

## 🚀 Tecnologías Utilizadas

- **Backend:** Python, Flask, Google Gemini API  
- **API Externa:** Serper API para verificación de enlaces  
- **Frontend:** HTML5, CSS3 (Flexbox y SVG), JavaScript (ES6+)  
- **Dependencias:** requests, python-dotenv  

## ⚙️ Instalación y Puesta en Marcha

### 1. Prerrequisitos

- Python 3.8 o superior  
- pip  
- Cuenta de Google con acceso a Gemini API  
- Cuenta en Serper.dev  

### 2. Configuración del Proyecto

1. Clona el repositorio:

```bash    
git clone https://github.com/tu-usuario/tu-repositorio.git
cd tu-repositorio
```

2. Crea y activa un entorno virtual:

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```
**Windows:**
```bash
python -m venv venv
.\venv\Scripts\activate
```
3. Instala las dependencias:
```bash
pip install -r requirements.txt
```
4. Configura tus Claves de API:
```bash
GOOGLE_API_KEY="TU_CLAVE_DE_API_DE_GOOGLE_GEMINI"
SERPER_API_KEY="TU_CLAVE_DE_API_DE_SERPER"
```
5. Ejecuta la Aplicación
```bash
python app.py
```
Abre tu navegador en: http://127.0.0.1:5000

## 📁 Estructura del Proyecto

- **Aperture/**
  - **static/** → Archivos CSS y JavaScript del frontend
    - `style.css`
    - `script.js`
  - **templates/** → Archivos HTML renderizados por Flask
    - `index.html`
  - `app.py` → Servidor Flask y lógica de IA
  - `.env` → Claves de API (no compartir)
  - `README.md` → Este archivo

