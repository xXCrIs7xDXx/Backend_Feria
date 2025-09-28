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

```json
{
   "decision": "SI",
   "reason": "Explicación breve del resultado"
}
```

- Si `decision` es "SI", el producto se considera auténtico.
- Si `decision` es "NO", el valor de `reason` explicará por qué se detectó un posible fraude.

### Configuración de Gemini

1. Obtén una API Key en Google AI Studio.
2. Crea un archivo `.env` en la raíz del proyecto con el contenido:

```
GEMINI_API_KEY=tu_api_key
GEMINI_MODEL=gemini-1.5-flash-latest
GEMINI_API_VERSION=v1beta
```

3. Reinicia la aplicación para que la configuración se cargue correctamente.
4. (Opcional) Para comprobar qué modelos están disponibles con tu clave, ejecuta:

```powershell
curl "https://generativelanguage.googleapis.com/v1beta/models?key=$Env:GEMINI_API_KEY"
```

Consulta el campo `name` de cada modelo (por ejemplo `models/gemini-2.0-flash-exp`) y usa el sufijo tras `models/` en `GEMINI_MODEL`.
   Content-Type:application/json \
   title="iPhone 15 Pro" \
   description="Smartphone con chip A17, 256GB y cámara triple." \
   priceAmount:=1099.99 \
   priceCurrency=USD \
   originalPriceAmount:=1299.99 \
   originalPriceCurrency=USD \
   category="Electronics" \
   condition="New" \
   location="Los Angeles, CA" \
   accessories="Cable USB-C,Cargador 30W" \
   warranty="12 meses" \
   checksum="sha256:lote-001"
```

```powershell
http POST http://localhost:3000/api/project-review/receive < payload.json
```

> También puedes usar Postman o Thunder Client; envía el cuerpo como JSON en una solicitud `POST`.

#### Enviar imagen como archivo (`multipart/form-data`)

```powershell
http --form POST http://localhost:3000/api/project-review \
   title="Cámara Mirrorless Pro X1" \
   priceAmount:=299.99 \
   image@"C:/ruta/foto.jpg"
```

## Estructura del Proyecto

- `src/app.js`: Configuración de la aplicación Express.
- `src/server.js`: Punto de entrada de la aplicación.
- `src/routes/index.js`: Definición de las rutas de la aplicación.
- `src/controllers/sampleController.js`: Controlador para manejar las solicitudes.
- `src/middleware/errorHandler.js`: Middleware para el manejo de errores.
- `src/services/sampleService.js`: Lógica de negocio relacionada con el recurso de ejemplo.
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