const fetch = require('node-fetch');
const FormData = require('form-data');

const PINATA_BASE_URL = 'https://api.pinata.cloud';

const resolveJwt = () => {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
        const error = new Error('PINATA_JWT no está configurado.');
        error.status = 500;
        throw error;
    }
    return jwt;
};

const parsePinataResponse = async (response, contextMessage) => {
    const data = await response.json().catch(async () => ({ raw: await response.text() }));

    if (!response.ok) {
        const message = data.error || data.message || data.raw || contextMessage;
        const error = new Error(`${contextMessage}: ${message}`);
        error.status = response.status;
        error.details = data;
        throw error;
    }

    if (!data.IpfsHash) {
        const error = new Error(`${contextMessage}: respuesta de Pinata sin IpfsHash.`);
        error.status = 502;
        error.details = data;
        throw error;
    }

    return data.IpfsHash;
};

const uploadFile = async ({ buffer, fileName, mimeType }) => {
    if (!buffer || !Buffer.isBuffer(buffer)) {
        const error = new Error('El buffer de la imagen es inválido.');
        error.status = 400;
        throw error;
    }

    const jwt = resolveJwt();
    const formData = new FormData();
    formData.append('file', buffer, {
        filename: fileName || 'producto.jpg',
        contentType: mimeType || 'application/octet-stream',
    });

    const response = await fetch(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
        body: formData,
    });

    return parsePinataResponse(response, 'Error al subir la imagen a Pinata');
};

const uploadJson = async ({ metadata, content }) => {
    if (!content || typeof content !== 'object') {
        const error = new Error('El contenido del producto para Pinata es inválido.');
        error.status = 400;
        throw error;
    }

    const jwt = resolveJwt();
    const payload = {
        pinataMetadata: {
            name: metadata?.name || `producto-${Date.now()}`,
        },
        pinataContent: content,
    };

    const response = await fetch(`${PINATA_BASE_URL}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    return parsePinataResponse(response, 'Error al subir el JSON del producto a Pinata');
};

module.exports = {
    uploadFile,
    uploadJson,
};
