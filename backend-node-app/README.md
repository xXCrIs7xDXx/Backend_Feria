# Backend Node App

Este es un proyecto de backend simple construido con Node.js y Express. A continuación se presentan las instrucciones para configurar y ejecutar la aplicación.

## Requisitos

- Node.js (versión 14 o superior)
- npm (gestor de paquetes de Node)

## Instalación

1. Clona el repositorio:

   ```
   git clone <URL_DEL_REPOSITORIO>
   ```

2. Navega al directorio del proyecto:

   ```
   cd backend-node-app
   ```

3. Instala las dependencias:

   ```
   npm install
   ```

4. Crea un archivo `.env` basado en el archivo `.env.example` y configura las variables de entorno necesarias.

## Ejecución

Para iniciar la aplicación, ejecuta el siguiente comando:

```
npm start
```

La aplicación se ejecutará en `http://localhost:3000` (o el puerto que hayas configurado en tu archivo de configuración).

## Endpoint disponible

La API expone un único `GET` en `http://localhost:3000/api/project-review`. Responde con un objeto JSON que contiene dos propiedades:

- `image`: cadena Base64 (Data URI) con la imagen del producto/proyecto.
- `product`: JSON con el detalle del producto (título, precios, categoría, etc.).

### Parámetros soportados

Puedes enviar cualquier campo como query string para sobrescribir los valores por defecto:

| Parámetro              | Descripción                                              |
|------------------------|----------------------------------------------------------|
| `id`                   | Identificador único.                                     |
| `title`                | Título o nombre del producto/proyecto.                   |
| `priceAmount`          | Precio actual (numérico).                                |
| `priceCurrency`        | Moneda del precio actual (ej. `USD`).                    |
| `originalPriceAmount`  | Precio original (numérico).                              |
| `originalPriceCurrency`| Moneda del precio original.                              |
| `category`             | Categoría.                                               |
| `condition`            | Condición (ej. `New`, `Used`, `Refurbished`).            |
| `location`             | Ubicación.                                               |
| `description`          | Descripción larga.                                      |
| `warranty`             | Detalle de la garantía.                                  |
| `accessories`          | Lista separada por comas de accesorios incluidos.        |
| `checksum`             | Hash o identificador para validación.                    |
| `image`                | Imagen codificada en Base64 (Data URI).                  |

Si omites un parámetro, el endpoint responderá con un valor por defecto.

### Ejemplos de uso

#### Cargar datos por defecto

```powershell
http GET http://localhost:3000/api/project-review
```

#### Sobrescribir valores

```powershell
http GET http://localhost:3000/api/project-review \
   title=="iPhone 15 Pro" \
   description=="Smartphone con chip A17, 256GB y cámara triple." \
   priceAmount==1099.99 \
   priceCurrency==USD \
   category=="Electronics" \
   condition=="New" \
   location=="Los Angeles, CA" \
   accessories=="Cable USB-C,Cargador 30W" \
   warranty=="12 meses"
```

> Si no cuentas con HTTPie, puedes usar Postman, Thunder Client o un navegador (`http://localhost:3000/api/project-review?title=...`).

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