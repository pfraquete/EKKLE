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
