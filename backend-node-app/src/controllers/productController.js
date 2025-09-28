const geminiService = require('../services/geminiService');

const productController = {
    verifyProduct: async (req, res, next) => {
        try {
            const { productData } = req;
            const { file } = req;

            if (!productData || !file) {
                const error = new Error('Payload incompleto: se requiere producto e imagen.');
                error.status = 400;
                throw error;
            }

            console.log('[productController] Iniciando verificación de producto', {
                title: productData.title,
                price: productData.price,
                category: productData.category,
            });

            const result = await geminiService.verifyProduct({
                product: productData,
                imageBuffer: file.buffer,
                imageMimeType: file.mimetype,
            });

            console.log('[productController] Resultado de Gemini', result);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },
};

module.exports = productController;
