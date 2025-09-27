const SampleController = {
    getProjectReviewPayload: (req, res) => {
        const {
            id,
            title,
            priceAmount,
            priceCurrency,
            originalPriceAmount,
            originalPriceCurrency,
            category,
            condition,
            location,
            description,
            warranty,
            accessories,
            checksum,
            image,
        } = req.query;

        const imageBase64 =
            image ||
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

        const accessoriesList = accessories
            ? accessories.split(',').map((item) => item.trim()).filter(Boolean)
            : ['Lente 24-70mm', '2 baterías', 'Cargador rápido', 'Funda rígida'];

        res.status(200).json({
            image: imageBase64,
            product: {
                id: id || 'demo-001',
                title: title || 'Cámara Mirrorless Pro X1',
                price: {
                    amount: priceAmount ? Number(priceAmount) : 299.99,
                    currency: priceCurrency || 'USD',
                },
                originalPrice: {
                    amount: originalPriceAmount ? Number(originalPriceAmount) : 349.99,
                    currency: originalPriceCurrency || 'USD',
                },
                category: category || 'Electronics',
                condition: condition || 'Refurbished',
                location: location || 'San Francisco, CA',
                description:
                    description ||
                    'Cámara mirrorless profesional con sensor full-frame, estabilización de 5 ejes y conectividad WiFi integrada. Incluye lente kit 24-70mm y dos baterías originales.',
                attributes: {
                    warranty: warranty || '6 meses',
                    accessoriesIncluded: accessoriesList,
                },
                checksum: checksum || 'sha256:demo-checksum-123',
            },
        });
    }
};

module.exports = SampleController;