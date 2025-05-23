# 🧪 Testes de Autenticação

Scripts simples para testar as rotas `/register` e `/login` do servidor.

## 📋 Scripts

### `register-user.js` - Cadastrar usuário específico
```bash
node test/register-user.js
```
- Cadastra: `um.caal2.0@gmail.com` / `porumcaal2.0`
- Testa login após cadastro

### `test-auth.js` - Teste completo
```bash
node test/test-auth.js
```
- Testa cadastro e login
- Verificação de servidor

### `test-image-limit.js` - Teste de limitação de imagens
```bash
node test/test-image-limit.js
```
- Testa limite de 10MB para imagens
- Verifica se imagens grandes são rejeitadas
- Verifica se imagens pequenas são aceitas

## 🚀 Como usar

1. **Inicie o servidor:**
   ```bash
   node server.js
   ```

2. **Execute os testes:**
   ```bash
   node test/register-user.js
   # ou
   node test/test-auth.js
   # ou
   node test/test-image-limit.js
   ```

## ⚙️ Requisitos

- Servidor rodando na porta 3333
- Banco PostgreSQL configurado
- Node.js com fetch (ou instalar `node-fetch@2`)

## 🖼️ Limitação de Imagens

O servidor agora limita o tamanho das imagens para **10MB**:

- ✅ **Express**: Limite geral de 10MB para requisições
- ✅ **Middleware**: Validação específica para imagens
- ✅ **Controlador**: Verificação dupla no processamento
- ❌ **Erro 413**: Retornado para imagens muito grandes

### Exemplo de erro:
```json
{
  "error": "Imagem muito grande. Tamanho máximo: 10MB. Tamanho atual: 12.34MB"
}
```

## 📊 Saída esperada

```
🚀 Cadastrando usuário via API...
📧 Email: um.caal2.0@gmail.com
🔑 Senha: porumcaal2.0
──────────────────────────────────────────────────
📡 Enviando POST /register...
✅ Usuário cadastrado com sucesso!

🧪 Testando login...
✅ Login realizado com sucesso!
👤 Usuário: um.caal2.0@gmail.com
🔑 Token gerado: Sim

✨ Finalizado!
```

## ❌ Problemas comuns

- **Servidor não rodando**: Execute `node server.js`
- **fetch não disponível**: Instale `npm install node-fetch@2`
- **Usuário já existe**: Normal, continua para testar login
- **Imagem muito grande**: Reduza para menos de 10MB 