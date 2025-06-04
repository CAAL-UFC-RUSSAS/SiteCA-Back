const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailController {
  /**
   * Envia um e-mail de contato para o destinatário configurado
   */
  async enviarEmail(req, res) {
    console.log('Recebida requisição de contato:', req.body);
    try {
      const { nome, email, assunto, mensagem } = req.body;
      
      // Validação básica dos campos
      if (!nome || !email || !mensagem) {
        console.log('Validação falhou:', { nome, email, mensagem });
        return res.status(400).json({ 
          error: 'Campos inválidos', 
          message: 'Por favor, preencha todos os campos obrigatórios.' 
        });
      }

      // Configuração do e-mail que envia (remetente)
      const emailUsuario = process.env.EMAIL_USER || 'ouvidoriacaadalovelace@gmail.com';
      const emailSenha = process.env.EMAIL_PASS || 'cplc svkh surf fcmo';
      
      // E-mail de destino configurável através de variável de ambiente
      const destinatario = process.env.EMAIL_DESTINATARIO || 'um.caal2.0@gmail.com';
      
      console.log('Iniciando envio de e-mail para:', destinatario);
      
      // Criar um transportador de e-mail usando SMTP do Gmail
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUsuario,
          pass: emailSenha
        }
      });
      
      // Configurar as opções do e-mail
      const mailOptions = {
        from: `"Formulário de Contato CACC" <${emailUsuario}>`,
        to: destinatario,
        subject: `Contato do site - ${assunto || 'Sem assunto'}`,
        text: `
          Nome: ${nome}
          E-mail: ${email}
          Assunto: ${assunto || 'Não especificado'}
          
          Mensagem:
          ${mensagem}
        `,
        html: `
          <h3>Mensagem de contato do site do Centro Acadêmico</h3>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>E-mail:</strong> ${email}</p>
          <p><strong>Assunto:</strong> ${assunto || 'Não especificado'}</p>
          <p><strong>Mensagem:</strong></p>
          <p style="padding: 15px; background-color: #f5f5f5; border-left: 4px solid #007bff;">${mensagem.replace(/\n/g, '<br>')}</p>
        `,
        // Configurar resposta automática para o remetente (opcional)
        replyTo: email
      };

      console.log('Configuração de e-mail:', { 
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      // Enviar o e-mail
      const info = await transporter.sendMail(mailOptions);

      console.log(`E-mail enviado com sucesso para ${destinatario}. ID: ${info.messageId}`);

      // Responder com sucesso
      return res.status(200).json({
        success: true,
        message: 'E-mail enviado com sucesso!',
        messageId: info.messageId
      });
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      
      return res.status(500).json({
        error: 'Erro ao enviar e-mail',
        message: 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde.'
      });
    }
  }
}

module.exports = new EmailController(); 