const DEFAULT_IMAGE =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUTEhMWFhUVGRgYGRgYGRgYGB0dGBoYGBgYHR0ZHSggGB0lGxgYITEhJSkrLi4uGB8zODMtNygtLisBCgoKDg0OGhAQGy0mICYtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAKAAoAMBIgACEQEDEQH/xAAYAAACAwAAAAAAAAAAAAAAAAAEBQABBv/EAB0QAAICAgMBAAAAAAAAAAAAAAECAwQFEQAhMWH/xAAWAQEBAQAAAAAAAAAAAAAAAAABAgP/xAAYEQADAQEAAAAAAAAAAAAAAAAAAhEhMf/aAAwDAQACEQMRAD8A1WbpF2o8UtIyP5Qe7Qk2RGFxYWpIzpJ7nvtWntosWZzsBbnZx8zlqRy2hIBmD7hjRzZ0Mpref/Z';

const normalizePayload = (source = {}) => {
    const { body = {}, file } = source;

    const accessoriesRaw = body.accessories ?? body.accessoriesIncluded;
    const accessoriesList = Array.isArray(accessoriesRaw)
        ? accessoriesRaw.map((item) => String(item).trim()).filter(Boolean)
        : accessoriesRaw
        ? String(accessoriesRaw)
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
        : ['Lente 24-70mm', '2 baterías', 'Cargador rápido', 'Funda rígida'];

    const parseAmount = (value, fallback) =>
        value !== undefined && value !== null && value !== ''
            ? Number(value)
            : fallback;

    const imageFromFile = file
        ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
        : null;

    return {
        image: body.image || imageFromFile || DEFAULT_IMAGE,
        product: {
            id: body.id || 'demo-001',
            title: body.title || 'Cámara Mirrorless Pro X1',
            price: {
                amount: parseAmount(body.priceAmount, 299.99),
                currency: body.priceCurrency || 'USD',
            },
            originalPrice: {
                amount: parseAmount(body.originalPriceAmount, 349.99),
                currency: body.originalPriceCurrency || 'USD',
            },
            category: body.category || 'Electronics',
            condition: body.condition || 'Refurbished',
            location: body.location || 'San Francisco, CA',
            description:
                body.description ||
                'Cámara mirrorless profesional con sensor full-frame, estabilización de 5 ejes y conectividad WiFi integrada. Incluye lente kit 24-70mm y dos baterías originales.',
            attributes: {
                warranty: body.warranty || '6 meses',
                accessoriesIncluded: accessoriesList,
            },
            checksum: body.checksum || 'sha256:demo-checksum-123',
        },
    };
};

const SampleController = {
    postProjectReviewPayload: (req, res) => {
        const payload = normalizePayload({ body: req.body || {}, file: req.file });
        res.status(200).json(payload);
    },

    receiveProjectSubmission: (req, res) => {
        const payload = normalizePayload({ body: req.body || {}, file: req.file });
        res.status(201).json({
            message: 'Project submission received',
            payload,
        });
    },
};

module.exports = SampleController;