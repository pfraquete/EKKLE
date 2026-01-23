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

export async function sendWelcomeEmail({
  to,
  name,
  tempPassword,
  churchName,
  loginUrl
}: {
  to: string
  name: string
  tempPassword: string
  churchName: string
  loginUrl: string
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'Ekkle <onboarding@resend.dev>';

  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured. Email not sent.');
    return { success: false, error: 'API Key missing' };
  }

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Bem-vindo(a) à ${churchName}!`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #e11d48; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bem-vindo(a)!</h1>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px; line-height: 1.6;">Olá, <strong>${name}</strong>!</p>
            <p style="font-size: 16px; line-height: 1.6;">Seja muito bem-vindo(a) à <strong>${churchName}</strong>! Seu cadastro foi concluído com sucesso.</p>

            <div style="background-color: #fef2f2; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #e11d48;">
              <p style="margin: 0 0 12px 0; font-weight: bold; font-size: 16px;">Seus dados de acesso:</p>
              <p style="margin: 0 0 8px 0;"><strong>E-mail:</strong> <span style="font-family: monospace; background: #fee2e2; padding: 4px 8px; border-radius: 4px;">${to}</span></p>
              <p style="margin: 0;"><strong>Senha temporária:</strong> <span style="font-family: monospace; background: #fee2e2; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${tempPassword}</span></p>
            </div>

            <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #fed7aa;">
              <p style="margin: 0; color: #ea580c; font-weight: bold;">⚠️ IMPORTANTE:</p>
              <p style="margin: 8px 0 0 0; color: #9a3412; line-height: 1.6;">Por segurança, recomendamos que você altere sua senha no primeiro acesso. Acesse <strong>Configurações > Perfil</strong> após fazer login.</p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}" style="display: inline-block; background-color: #e11d48; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(225, 29, 72, 0.2);">Acessar Minha Área</a>
            </div>

            <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 24px;">
              Através da área do membro você poderá:
            </p>
            <ul style="color: #666; line-height: 1.8; margin: 12px 0;">
              <li>Acessar eventos e cursos</li>
              <li>Fazer inscrições em células</li>
              <li>Visualizar conteúdos exclusivos</li>
              <li>Participar da comunidade</li>
            </ul>

            <p style="font-size: 14px; color: #666; margin-top: 24px;">
              Se tiver alguma dúvida, entre em contato com a liderança da igreja.
            </p>
          </div>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">© 2026 ${churchName}</p>
            <p style="margin: 8px 0 0 0;">Powered by Ekkle • Sistema de Gestão Eclesiástica</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service welcome error:', error);
    return { success: false, error };
  }
}
