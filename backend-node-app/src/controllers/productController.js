const geminiService = require('../services/geminiService');
const pinataService = require('../services/pinataService');

const DEFAULT_AUTHENTIC_DECISION = 'SI';
const DEFAULT_FAKE_DECISION = 'NO';

const AUTHENTIC_DECISION = (process.env.GEMINI_DECISION_AUTHENTIC || DEFAULT_AUTHENTIC_DECISION).trim() || DEFAULT_AUTHENTIC_DECISION;
const FAKE_DECISION = (process.env.GEMINI_DECISION_FAKE || DEFAULT_FAKE_DECISION).trim() || DEFAULT_FAKE_DECISION;
const NORMALIZED_FAKE = FAKE_DECISION.toUpperCase();

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

            const normalizedDecision = (result.decision || '').trim().toUpperCase();

            if (normalizedDecision === NORMALIZED_FAKE) {
                const error = new Error(result.reason || 'Producto rechazado por la verificación de IA.');
                error.status = 500;
                throw error;
            }

            const cidImagen = await pinataService.uploadFile({
                buffer: file.buffer,
                fileName: file.originalname,
                mimeType: file.mimetype,
            });

            const productPayload = {
                titulo: productData.title,
                descripcion: productData.description,
                precio: productData.price,
                moneda: productData.currency,
                categoria: productData.category,
                ubicacion: productData.location,
                cid_imagen: cidImagen,
            };

            const cidProducto = await pinataService.uploadJson({
                metadata: {
                    name: `producto-${(productData.title || 'sin-titulo').trim()}`,
                },
                content: productPayload,
            });

            res.status(200).json({
                decision: result.decision,
                reason: result.reason,
                cidImagen,
                cidProducto,
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = productController;
