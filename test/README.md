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
   ```

## ⚙️ Requisitos

- Servidor rodando na porta 3333
- Banco PostgreSQL configurado
- Node.js com fetch (ou instalar `node-fetch@2`)

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