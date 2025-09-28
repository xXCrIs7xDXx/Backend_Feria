const fetch = require('node-fetch');

const DEFAULT_API_VERSION = 'v1beta';
const DEFAULT_MODEL = 'gemini-2.5-flash';

const normalizeModelName = (model) => {
    if (!model) return DEFAULT_MODEL;
    const trimmed = model.trim();
    if (!trimmed) return DEFAULT_MODEL;
    return trimmed.startsWith('models/') ? trimmed.slice('models/'.length) : trimmed;
};

const resolveModelEndpoint = () => {
    const version = (process.env.GEMINI_API_VERSION || DEFAULT_API_VERSION).trim() || DEFAULT_API_VERSION;
    const model = normalizeModelName(process.env.GEMINI_MODEL || DEFAULT_MODEL);
    return `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent`;
};

const buildPrompt = (product) => {
    return `Evalúa el siguiente producto y indica si podría tratarse de una estafa. Responde en formato JSON con las claves "isScam" (true/false) y "reason" (breve explicación). Producto: ${JSON.stringify(
        product
    )}`;
};

const extractGeminiResult = (apiResponseText) => {
    try {
        const parsed = JSON.parse(apiResponseText);
        if (typeof parsed.isScam === 'boolean' && typeof parsed.reason === 'string') {
            return parsed;
        }
    } catch (error) {
        // ignore parse errors, fallback below
    }

    const isScam = /scam|fraud|fake|estafa/i.test(apiResponseText);
    return {
        isScam,
        reason: apiResponseText.trim() || 'La respuesta de Gemini no incluyó detalles.',
    };
};

const verifyProduct = async ({ product, imageBuffer, imageMimeType }) => {
    if (!product || !imageBuffer || !imageMimeType) {
        const error = new Error('Información incompleta para verificar el producto.');
        error.status = 400;
        throw error;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        const error = new Error('GEMINI_API_KEY no está configurado.');
        error.status = 500;
        throw error;
    }

    const body = {
        contents: [
            {
                parts: [
                    {
                        text: buildPrompt(product),
                    },
                    {
                        inlineData: {
                            mimeType: imageMimeType,
                            data: imageBuffer.toString('base64'),
                        },
                    },
                ],
            },
        ],
    };

    const endpoint = resolveModelEndpoint();
    const url = `${endpoint}?key=${apiKey}`;

    console.log('[geminiService] Enviando solicitud a Gemini');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        let message = data.error?.message || 'Error al comunicarse con Gemini';
        if (response.status === 404 && /not found/i.test(message)) {
            message +=
                '. Verifica que tu API key tenga acceso al modelo indicado o ejecuta `curl "https://generativelanguage.googleapis.com/' +
                `${process.env.GEMINI_API_VERSION || DEFAULT_API_VERSION}/models?key=${apiKey.replace(/./g, '*')}` +
                '` para listar los modelos disponibles y actualiza la variable GEMINI_MODEL.';
        }
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join(' ');

    if (!text) {
        const error = new Error('Gemini no devolvió contenido interpretables.');
        error.status = 502;
        throw error;
    }

    return extractGeminiResult(text);
};

module.exports = {
    verifyProduct,
};
