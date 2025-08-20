# Archivo: app.py

import os
import json
import re
import requests
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

app = Flask(__name__)
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

if not GOOGLE_API_KEY or not SERPER_API_KEY:
    raise ValueError("Faltan las claves de API de Google o Serper en el archivo .env")

genai.configure(api_key=GOOGLE_API_KEY)

# --- ARQUITECTURA DE VERIFICACIÓN Y ENRIQUECIMIENTO ---

def buscar_link_real(query):
    """Usa la API de Serper para encontrar el enlace real del primer resultado de Google."""
    try:
        url = "https://google.serper.dev/search"
        payload = json.dumps({"q": query})
        headers = {'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json'}
        response = requests.post(url, headers=headers, data=payload, timeout=5)
        if response.status_code == 200:
            results = response.json()
            if "organic" in results and len(results["organic"]) > 0:
                # Devuelve el título y el enlace del primer resultado
                return {
                    "titulo": results["organic"][0].get("title", query),
                    "url": results["organic"][0].get("link", None)
                }
    except requests.RequestException as e:
        print(f"Error en la API de búsqueda: {e}")
    return None

def enriquecer_recursos_recursivamente(nodo):
    """Recorre el árbol y enriquece los recursos con enlaces verificados."""
    if not isinstance(nodo, dict):
        return

    if 'recursos' in nodo:
        recursos = nodo['recursos']
        # Verificar y enriquecer recurso principal
        if 'recurso_principal' in recursos and recursos['recurso_principal']:
            titulo_sugerido = recursos['recurso_principal'].get('titulo')
            enlace_verificado = buscar_link_real(titulo_sugerido)
            if enlace_verificado and enlace_verificado['url']:
                recursos['recurso_principal'] = enlace_verificado
            else:
                recursos.pop('recurso_principal', None) # Elimina si no se encuentra

        # Verificar y enriquecer libro
        if 'libro_recomendado' in recursos and recursos['libro_recomendado']:
            query_libro = f"{recursos['libro_recomendado']} libro"
            enlace_libro = buscar_link_real(query_libro)
            if enlace_libro and enlace_libro['url']:
                recursos['libro_recomendado'] = {"titulo": recursos['libro_recomendado'], "url": enlace_libro['url']}
            else:
                 recursos.pop('libro_recomendado', None)

        # Verificar y enriquecer curso
        if 'curso_profundizacion' in recursos and recursos['curso_profundizacion']:
            query_curso = f"{recursos['curso_profundizacion']}"
            enlace_curso = buscar_link_real(query_curso)
            if enlace_curso and enlace_curso['url']:
                recursos['curso_profundizacion'] = {"titulo": recursos['curso_profundizacion'], "url": enlace_curso['url']}
            else:
                 recursos.pop('curso_profundizacion', None)

    if 'sub_nodos' in nodo:
        for sub_nodo in nodo['sub_nodos']:
            enriquecer_recursos_recursivamente(sub_nodo)

def extraer_json_robusto(texto):
    match = re.search(r'```json\s*(\{.*?\})\s*```', texto, re.DOTALL)
    if match:
        try: return json.loads(match.group(1))
        except json.JSONDecodeError: pass
    try:
        json_start = texto.find('{'); json_end = texto.rfind('}') + 1
        if json_start != -1 and json_end != 0: return json.loads(texto[json_start:json_end])
    except json.JSONDecodeError: return None
    return None

# --- RUTAS DE LA APLICACIÓN ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate-path', methods=['POST'])
def generar_ruta():
    try:
        data = request.get_json()
        objetivo, nivel = data.get('goal'), data.get('level')
        if not objetivo or not nivel:
            return jsonify({"error": "El objetivo y el nivel son requeridos."}), 400

        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        prompt_completo = crear_prompt_vanguardista(objetivo, nivel)
        response = model.generate_content(prompt_completo, request_options={"timeout": 180})
        
        respuesta_json = extraer_json_robusto(response.text)

        if not respuesta_json or "nodo_raiz" not in respuesta_json:
            raise ValueError("La IA devolvió una estructura de datos inesperada.")
        
        enriquecer_recursos_recursivamente(respuesta_json['nodo_raiz'])

        return jsonify(respuesta_json)

    except Exception as e:
        print(f"Error Inesperado: {e}")
        return jsonify({"error": f"Ocurrió un error en el servidor: {str(e)}"}), 500

def crear_prompt_vanguardista(objetivo_usuario, nivel_conocimiento):
    return f"""
    Eres una 'Diseñadora de Experiencias de Aprendizaje Holísticas'. Tu misión es crear una ruta de aprendizaje en formato JSON que sea profunda, visualmente jerárquica y con un ecosistema de recursos variados y de élite.

    Objetivo: '{objetivo_usuario}'
    Nivel: '{nivel_conocimiento}'

    **REGLAS DE ORO:**
    1.  **ESTRUCTURA DE MAPA NO LINEAL:** El JSON debe representar un árbol. Genera un 'nodo_raiz' que se divida en 2 a 4 'sub_nodos' (ramas principales). Cada 'rama' es una categoría que debe contener más 'sub_nodos' anidados para crear correlatividad.
    2.  **ECOSISTEMA DE RECURSOS INTELIGENTE:** Para CADA paso de aprendizaje (nodos que no son 'hub'), genera un objeto 'recursos'. `recurso_principal` y `desafio_practico` son OBLIGATORIOS. Los otros son OPCIONALES y solo deben incluirse si son muy relevantes.
        -   `recurso_principal`: Un objeto con el "titulo" del MEJOR artículo/video/documentación para la teoría.
        -   `libro_recomendado`: El "Título del Libro de Autor Famoso".
        -   `curso_profundizacion`: El "Nombre del Curso en Coursera/edX/etc".
        -   `desafio_practico`: Un ejercicio claro y accionable.
    3.  **REGLA FINAL: Tu única salida debe ser el bloque de código JSON.**

    **FORMATO JSON ESTRICTO:**
    ```json
    {{
      "nodo_raiz": {{
        "titulo": "Ruta para: {objetivo_usuario} ({nivel_conocimiento})",
        "es_hub": true,
        "sub_nodos": [
          {{
            "titulo": "TEMA PRINCIPAL",
            "es_hub": true,
            "sub_nodos": [
              {{
                "titulo": "Concepto Específico",
                "descripcion": "Una descripción clara y útil de este concepto.",
                "recursos": {{
                  "recurso_principal": {{
                    "titulo": "Video Tutorial: Cómo hacer X en YouTube por Canal de Prestigio"
                  }},
                  "libro_recomendado": "El Arte de Aprender de Josh Waitzkin",
                  "desafio_practico": "Aplica la técnica Pomodoro durante una sesión de estudio."
                }}
              }}
            ]
          }}
        ]
      }}
    }}
    ```
    """

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)

# Para gunicorn (Render), asegúrate que 'app' esté disponible como variable global
# Esto permite: gunicorn app:app