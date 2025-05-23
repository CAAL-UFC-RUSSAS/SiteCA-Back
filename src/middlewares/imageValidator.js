// Middleware para validar tamanho de imagens
const MAX_IMAGE_SIZE_MB = 10;

function validateImageSize(req, res, next) {
    try {
        const { imagem } = req.body;
        
        // Se não há imagem, prossegue
        if (!imagem) {
            return next();
        }
        
        // Verificar se é string válida
        if (typeof imagem !== 'string') {
            return res.status(400).json({ 
                error: 'Formato de imagem inválido' 
            });
        }
        
        // Extrair dados base64
        let base64Data = imagem;
        if (imagem.startsWith('data:')) {
            const [header, data] = imagem.split(',');
            if (!header || !data) {
                return res.status(400).json({ 
                    error: 'Formato de imagem inválido' 
                });
            }
            base64Data = data;
        }
        
        // Calcular tamanho
        const buffer = Buffer.from(base64Data, 'base64');
        const tamanhoMB = buffer.length / (1024 * 1024);
        
        // Validar limite
        if (tamanhoMB > MAX_IMAGE_SIZE_MB) {
            return res.status(413).json({ 
                error: `Imagem muito grande. Tamanho máximo: ${MAX_IMAGE_SIZE_MB}MB. Tamanho atual: ${tamanhoMB.toFixed(2)}MB`
            });
        }
        
        // Adicionar informação do tamanho no req para uso posterior
        req.imageInfo = {
            tamanhoMB: tamanhoMB.toFixed(2)
        };
        
        console.log(`✅ Imagem validada: ${tamanhoMB.toFixed(2)}MB (limite: ${MAX_IMAGE_SIZE_MB}MB)`);
        next();
        
    } catch (error) {
        console.error('Erro na validação de imagem:', error);
        return res.status(400).json({ 
            error: 'Erro ao validar imagem: ' + error.message 
        });
    }
}

module.exports = validateImageSize; 