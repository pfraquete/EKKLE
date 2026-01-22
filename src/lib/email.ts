import { Resend } from 'resend';

export async function sendLeaderWelcomeEmail(email: string, name: string, password: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'Ekkle <onboarding@resend.dev>';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ekkle.up.railway.app';

  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured. Email not sent.');
    return { success: false, error: 'API Key missing' };
  }

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Bem-vindo(a) à Liderança - Ekkle',
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h1 style="color: #e11d48;">Olá, ${name}!</h1>
          <p>Sua nova célula foi criada e agora você faz parte oficial da liderança da Ekkle.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Seus dados de acesso:</p>
            <p style="margin: 10px 0 0 0;"><strong>E-mail:</strong> ${email}</p>
            <p style="margin: 5px 0 0 0;"><strong>Senha temporária:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
          </div>
          <p style="color: #dc2626; font-weight: bold;">⚠️ IMPORTANTE: Altere sua senha no primeiro acesso através das configurações do seu perfil.</p>
          <a href="${appUrl}/login" style="display: inline-block; background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Acessar Sistema</a>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">© 2026 Ekkle</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service unexpected error:', error);
    return { success: false, error };
  }
}

export async function sendNewRegistrationNotification(adminEmail: string, adminName: string, registration: { fullName: string, email: string, phone: string, message?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'Ekkle <onboarding@resend.dev>';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ekkle.up.railway.app';

  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured. Email not sent.');
    return { success: false, error: 'API Key missing' };
  }

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: 'Nova Solicitação de Membro - Ekkle',
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #e11d48; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Novo Cadastro Pendente</h1>
          </div>
          <div style="padding: 24px;">
            <p>Olá, <strong>${adminName}</strong>,</p>
            <p>Há uma nova solicitação de acesso para sua igreja no Ekkle:</p>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #f3f4f6;">
              <p style="margin: 0 0 10px 0;"><strong>Nome:</strong> ${registration.fullName}</p>
              <p style="margin: 0 0 10px 0;"><strong>E-mail:</strong> ${registration.email}</p>
              <p style="margin: 0 0 10px 0;"><strong>WhatsApp:</strong> ${registration.phone}</p>
              ${registration.message ? `<p style="margin: 15px 0 0 0; font-style: italic; color: #666; border-top: 1px solid #e5e7eb; pt: 10px;">"${registration.message}"</p>` : ''}
            </div>

            <p>Para aprovar ou recusar este cadastro, acesse o painel administrativo:</p>
            
            <a href="${appUrl}/membros" style="display: inline-block; background-color: #e11d48; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 0;">Ver Todas as Solicitações</a>
          </div>
          <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #666;">
            © 2026 Ekkle • Sistema de Gestão Eclesiástica
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending registration notification:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service notification error:', error);
    return { success: false, error };
  }
}
