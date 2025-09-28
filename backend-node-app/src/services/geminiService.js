const fetch = require('node-fetch');

const DEFAULT_API_VERSION = 'v1beta';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_AUTHENTIC_DECISION = 'SI';
const DEFAULT_FAKE_DECISION = 'NO';

const AUTHENTIC_DECISION = (process.env.GEMINI_DECISION_AUTHENTIC || DEFAULT_AUTHENTIC_DECISION).trim() || DEFAULT_AUTHENTIC_DECISION;
const FAKE_DECISION = (process.env.GEMINI_DECISION_FAKE || DEFAULT_FAKE_DECISION).trim() || DEFAULT_FAKE_DECISION;
const NORMALIZED_AUTHENTIC = AUTHENTIC_DECISION.toUpperCase();
const NORMALIZED_FAKE = FAKE_DECISION.toUpperCase();

const normalizeDecision = (value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const upper = trimmed.toUpperCase();
    if (upper === NORMALIZED_AUTHENTIC) {
        return AUTHENTIC_DECISION;
    }
    if (upper === NORMALIZED_FAKE) {
        return FAKE_DECISION;
    }
    return null;
};

const normalizeModelName = (model) => {
    if (!model) return DEFAULT_MODEL;
    const trimmed = model.trim();
    if (!trimmed) return DEFAULT_MODEL;
    return trimmed.startsWith('models/') ? trimmed.slice('models/'.length) : trimmed;
};

const tryParseJson = (value) => {
    if (typeof value !== 'string') return null;
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
};

const buildStructuredResult = (parsedDecision) => {
    if (!parsedDecision) return null;
    const decision = normalizeDecision(parsedDecision.decision);
    if (!decision) return null;

    const reason = typeof parsedDecision.reason === 'string' && parsedDecision.reason.trim()
        ? parsedDecision.reason.trim()
        : decision === AUTHENTIC_DECISION
            ? 'Producto evaluado como auténtico.'
            : 'Producto evaluado como posiblemente fraudulento.';

    return { decision, reason };
};

const attemptStructuredExtraction = (rawText) => {
    if (!rawText) return null;

    const candidates = [];
    const register = (candidate) => {
        if (candidate && typeof candidate === 'string') {
            const trimmed = candidate.trim();
            if (trimmed) {
                candidates.push(trimmed);
            }
        }
    };

    register(rawText);

    const withoutCodeFences = rawText
        .replace(/```(?:json)?/gi, '')
        .replace(/```/g, '');
    register(withoutCodeFences);

    const jsonMatch = rawText.match(/\{[\s\S]*?"decision"[\s\S]*?"reason"[\s\S]*?\}/i);
    if (jsonMatch) {
        register(jsonMatch[0]);
    }

    for (const candidate of candidates) {
        const parsed = tryParseJson(candidate);
        const result = buildStructuredResult(parsed);
        if (result) {
            return result;
        }
    }

    return null;
};

const resolveModelEndpoint = () => {
    const version = (process.env.GEMINI_API_VERSION || DEFAULT_API_VERSION).trim() || DEFAULT_API_VERSION;
    const model = normalizeModelName(process.env.GEMINI_MODEL || DEFAULT_MODEL);
    return `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent`;
};

const buildPrompt = (product) => {
    const productJson = JSON.stringify(product, null, 2);
    return `Eres un analista especializado en detección de fraudes en productos de comercio electrónico.
Debes revisar la información estructurada del producto y la imagen asociada (enviada por separado) para determinar si el producto parece auténtico.

Responde SIEMPRE con un JSON válido que tenga exactamente estas claves:
{
  "decision": "${AUTHENTIC_DECISION}" | "${FAKE_DECISION}",
  "reason": "Explicación breve"
}

Reglas:
- Usa "${AUTHENTIC_DECISION}" en "decision" sólo si el producto parece legítimo.
- Usa "${FAKE_DECISION}" en "decision" si detectas señales de posible fraude o riesgo.
- "reason" debe contener una frase corta y clara.
- No añadas texto adicional ni comentarios fuera del JSON.
- No utilices bloques de código ni comillas triples (\`\`\`).

Datos del producto:
${productJson}`;
};

const extractGeminiResult = (apiResponseText) => {
    const structured = attemptStructuredExtraction(apiResponseText);
    if (structured) {
        return structured;
    }

    const fallbackText = apiResponseText.trim();
    const normalizedText = fallbackText.toUpperCase();
    const decisionFromText = (() => {
        if (normalizedText.includes(`"DECISION"`) || normalizedText.includes('DECISION')) {
            if (normalizedText.includes(`"${NORMALIZED_FAKE}"`) || normalizedText.includes(`:${NORMALIZED_FAKE}`)) {
                return FAKE_DECISION;
            }
            if (normalizedText.includes(`"${NORMALIZED_AUTHENTIC}"`) || normalizedText.includes(`:${NORMALIZED_AUTHENTIC}`)) {
                return AUTHENTIC_DECISION;
            }
        }
        return null;
    })();
    const containsFakeSignals = /scam|fraud|fake|estafa|riesgo|falso/i.test(fallbackText);
    const decision = decisionFromText || (containsFakeSignals ? FAKE_DECISION : AUTHENTIC_DECISION);

    return {
        decision,
        reason:
            fallbackText ||
            (decision === AUTHENTIC_DECISION
                ? 'Producto evaluado como auténtico.'
                : 'Producto evaluado como posiblemente fraudulento.'),
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
