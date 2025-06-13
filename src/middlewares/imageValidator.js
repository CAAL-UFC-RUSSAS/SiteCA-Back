// Middleware para validar tamanho de imagens
const MAX_IMAGE_SIZE_MB = 10;

module.exports = (req, res, next) => {
    const { imagens } = req.body;

    // Se não houver imagens, permitir a requisição
    if (!imagens) {
        return next();
    }

    // Verificar se imagens é um array
    if (!Array.isArray(imagens)) {
        return res.status(400).json({ error: 'O campo imagens deve ser um array' });
    }

    // Verificar se há mais de 8 imagens
    if (imagens.length > 8) {
        return res.status(400).json({ error: 'Máximo de 8 imagens permitidas por produto' });
    }

    // Verificar cada imagem
    for (const imagem of imagens) {
        // Verificar se a imagem está em formato base64
        if (typeof imagem !== 'string') {
            return res.status(400).json({ error: 'Formato de imagem inválido' });
        }

        // Se a imagem não começar com data:, assumir que é base64 puro
        let base64Data = imagem;
        let mimeType = 'image/png'; // Tipo padrão para PNG

        if (imagem.startsWith('data:')) {
            // Extrair os dados da imagem
            const [header, data] = imagem.split(',');
            if (!header || !data) {
                return res.status(400).json({ error: 'Formato de imagem inválido' });
            }

            // Extrair o tipo MIME
            const mimeMatch = header.match(/data:([^;]+);/);
            if (mimeMatch) {
                mimeType = mimeMatch[1];
            }
            base64Data = data;
        }

        // Verificar se o tipo MIME é uma imagem
        if (!mimeType.startsWith('image/')) {
            return res.status(400).json({ error: 'Tipo de arquivo inválido. Apenas imagens são permitidas' });
        }

        // Verificar tamanho da imagem
        const tamanhoBytes = Math.ceil((base64Data.length * 3) / 4);
        const tamanhoMB = tamanhoBytes / (1024 * 1024);

        if (tamanhoMB > MAX_IMAGE_SIZE_MB) {
            return res.status(400).json({ error: `Imagem muito grande. Tamanho máximo: ${MAX_IMAGE_SIZE_MB}MB. Tamanho atual: ${tamanhoMB.toFixed(2)}MB` });
        }
    }

    next();
}; 