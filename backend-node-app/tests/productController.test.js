const productController = require('../src/controllers/productController');
const geminiService = require('../src/services/geminiService');
const pinataService = require('../src/services/pinataService');

jest.mock('../src/services/geminiService');
jest.mock('../src/services/pinataService');

describe('productController.verifyProduct', () => {
    const baseReq = () => ({
        productData: {
            title: 'Producto Test',
            description: 'Descripción',
            price: 100,
            currency: 'USD',
            category: 'Electronics',
            location: 'Madrid',
        },
        file: {
            buffer: Buffer.from('imagen'),
            mimetype: 'image/jpeg',
            originalname: 'producto.jpg',
        },
    });

    const createRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    const next = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debe subir el contenido a Pinata y responder con los CIDs cuando la verificación es exitosa', async () => {
        const req = baseReq();
        const res = createRes();

        const geminiResult = { decision: 'SI', reason: 'Producto legítimo' };
        geminiService.verifyProduct.mockResolvedValue(geminiResult);
        pinataService.uploadFile.mockResolvedValue('cidImagen123');
        pinataService.uploadJson.mockResolvedValue('cidProducto456');

        await productController.verifyProduct(req, res, next);

        expect(geminiService.verifyProduct).toHaveBeenCalledWith({
            product: req.productData,
            imageBuffer: req.file.buffer,
            imageMimeType: req.file.mimetype,
        });
        expect(pinataService.uploadFile).toHaveBeenCalledWith({
            buffer: req.file.buffer,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
        });
        expect(pinataService.uploadJson).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.objectContaining({
                    titulo: req.productData.title,
                    cid_imagen: 'cidImagen123',
                }),
            })
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            decision: geminiResult.decision,
            reason: geminiResult.reason,
            cidImagen: 'cidImagen123',
            cidProducto: 'cidProducto456',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('debe pasar los errores de Gemini al middleware de errores', async () => {
        const req = baseReq();
        const res = createRes();
        const error = new Error('Fallo en Gemini');

        geminiService.verifyProduct.mockRejectedValue(error);

        await productController.verifyProduct(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });

    it('debe retornar un error 500 cuando la IA detecta fraude', async () => {
        const req = baseReq();
        const res = createRes();

        const geminiResult = { decision: 'NO', reason: 'Producto fraudulento' };
        geminiService.verifyProduct.mockResolvedValue(geminiResult);

        await productController.verifyProduct(req, res, next);

        expect(pinataService.uploadFile).not.toHaveBeenCalled();
        expect(pinataService.uploadJson).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(Error);
        expect(error.status).toBe(500);
        expect(error.message).toBe('Producto fraudulento');
    });

    it('debe lanzar error si falta el producto o la imagen', async () => {
        const req = { productData: null, file: null };
        const res = createRes();

        await productController.verifyProduct(req, res, next);

        expect(next).toHaveBeenCalled();
        const passedError = next.mock.calls[0][0];
        expect(passedError).toBeInstanceOf(Error);
        expect(passedError.status).toBe(400);
    });
});
