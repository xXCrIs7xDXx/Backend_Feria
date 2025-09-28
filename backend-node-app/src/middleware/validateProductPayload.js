const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

const parseProduct = (rawProduct) => {
    if (!rawProduct) {
        throw new Error('El campo "product" es obligatorio.');
    }

    if (typeof rawProduct === 'object') {
        return rawProduct;
    }

    try {
        return JSON.parse(rawProduct);
    } catch (error) {
        const parseError = new Error('El campo "product" debe ser un JSON válido.');
        parseError.status = 400;
        throw parseError;
    }
};

const validateProduct = (product) => {
    const requiredStringFields = ['title', 'description', 'currency', 'category', 'location'];

    requiredStringFields.forEach((field) => {
        if (!product[field] || typeof product[field] !== 'string') {
            const error = new Error(`El campo "${field}" es obligatorio y debe ser una cadena.`);
            error.status = 400;
            throw error;
        }
    });

    if (product.price === undefined || product.price === null) {
        const error = new Error('El campo "price" es obligatorio.');
        error.status = 400;
        throw error;
    }

    const priceNumber = Number(product.price);
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
        const error = new Error('El campo "price" debe ser un número mayor o igual que cero.');
        error.status = 400;
        throw error;
    }

    return {
        ...product,
        price: priceNumber,
    };
};

module.exports = (req, res, next) => {
    try {
        const { file } = req;

        if (!file) {
            const error = new Error('El campo "image" es obligatorio.');
            error.status = 400;
            throw error;
        }

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            const error = new Error('La imagen debe ser de tipo JPG o PNG.');
            error.status = 400;
            throw error;
        }

        const product = parseProduct(req.body?.product);
        req.productData = validateProduct(product);

        next();
    } catch (error) {
        if (!error.status) {
            error.status = 400;
        }
        next(error);
    }
};
