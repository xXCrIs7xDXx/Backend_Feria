const productController = require('../src/controllers/productController');
const geminiService = require('../src/services/geminiService');

jest.mock('../src/services/geminiService');

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

    it('debe responder con el resultado de Gemini cuando la verificación es exitosa', async () => {
        const req = baseReq();
        const res = createRes();

        const geminiResult = { isScam: false, reason: 'Todo en orden' };
        geminiService.verifyProduct.mockResolvedValue(geminiResult);

        await productController.verifyProduct(req, res, next);

        expect(geminiService.verifyProduct).toHaveBeenCalledWith({
            product: req.productData,
            imageBuffer: req.file.buffer,
            imageMimeType: req.file.mimetype,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(geminiResult);
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
