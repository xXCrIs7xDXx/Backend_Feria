# Backend Node App

Este es un proyecto de backend simple construido con Node.js y Express. A continuación se presentan las instrucciones para configurar y ejecutar la aplicación.

## Requisitos

- Node.js (versión 14 o superior)

## Instalación

1. Clona el repositorio.
2. Instala las dependencias con `npm install`.
3. Configura las variables de entorno (ver sección siguiente).

## Configuración de Gemini

1. Obtén una API Key en Google AI Studio.
2. Crea un archivo `.env` en la raíz del proyecto con el contenido:

```
GEMINI_API_KEY=tu_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_VERSION=v1beta
GEMINI_DECISION_AUTHENTIC=SI
GEMINI_DECISION_FAKE=NO
PINATA_JWT=tu_pinata_jwt
```

3. Reinicia la aplicación para que la configuración se cargue correctamente.
4. (Opcional) Para comprobar qué modelos están disponibles con tu clave, ejecuta:

```powershell
curl "https://generativelanguage.googleapis.com/$Env:GEMINI_API_VERSION/models?key=$Env:GEMINI_API_KEY"
```

Consulta el campo `name` de cada modelo (por ejemplo `models/gemini-2.5-pro`) y usa el sufijo tras `models/` en `GEMINI_MODEL`. Si necesitas otros textos para las decisiones, ajusta `GEMINI_DECISION_AUTHENTIC` y `GEMINI_DECISION_FAKE`.

## Endpoint disponible

La API expone un endpoint principal:

| Método | Ruta                    | Descripción                                                                 |
|--------|-------------------------|-----------------------------------------------------------------------------|
| POST   | `/api/products/verify`  | Envía la información del producto y la imagen a Gemini para determinar si es una posible estafa. |

### Estructura del request (`multipart/form-data`)

- **product**: campo de texto con un JSON que incluya:

```json
{
   "title": "string",
   "description": "string",
   "price": 1000,
   "currency": "USD",
   "category": "string",
   "location": "string"
}
```

- **image**: archivo JPG o PNG (máximo 5 MB) enviado en el campo `image`.

### Ejemplo con HTTPie

```powershell
http --form POST http://localhost:3000/api/products/verify \
   product='{"title":"Laptop Pro","description":"Laptop con 32GB RAM","price":2499,"currency":"USD","category":"Computers","location":"New York"}' \
   image@"C:/ruta/foto.jpg"
```

### Respuesta esperada

Cuando la IA aprueba el producto, el backend sube la imagen y un JSON con los datos del producto a Pinata e incluye los CIDs en la respuesta:

```json
{
  "decision": "SI",
  "reason": "Explicación breve del resultado",
  "cidImagen": "bafy...",
  "cidProducto": "bafy..."
}
```

Si Gemini detecta fraude, responde con código 500 y el mensaje de la IA.

### Configuración de Pinata

1. Genera un JWT en tu cuenta de Pinata con permisos para `pinFileToIPFS` y `pinJSONToIPFS`.
2. Añade `PINATA_JWT` a tu `.env` (no compartas esta clave en repositorios públicos).
3. Reinicia el servidor para cargar el token.

## Estructura del Proyecto

- `src/app.js`: Configuración de la aplicación Express.
- `src/server.js`: Punto de entrada de la aplicación.
- `src/routes/index.js`: Definición de las rutas de la aplicación.
- `src/controllers/productController.js`: Orquesta la verificación con Gemini y el almacenamiento en Pinata.
- `src/middleware/errorHandler.js`: Middleware para el manejo de errores.
- `src/services/geminiService.js`: Lógica para comunicarse con Gemini.
- `src/services/pinataService.js`: Funciones para subir archivos y JSON a Pinata.
- `src/services/sampleService.js`: Servicio de ejemplo (puedes eliminarlo si no se usa).
- `src/config/config.js`: Configuración de la aplicación.

## Pruebas

Para ejecutar las pruebas, utiliza el siguiente comando:

```
npm test
```

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir, por favor abre un issue o envía un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT.