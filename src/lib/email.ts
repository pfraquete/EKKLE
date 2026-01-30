import { Resend } from 'resend';
import { escapeHtml } from '@/lib/sanitize';

/**
 * Helper to get app URL with fallback and warning
 */
function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    console.warn('[Email] NEXT_PUBLIC_APP_URL not set, using fallback');
    return 'https://ekkle.up.railway.app';
  }
  return url;
}

/**
 * Helper to get from email with fallback
 */
function getFromEmail(): string {
  return process.env.FROM_EMAIL || 'Ekkle <onboarding@resend.dev>';
}

export async function sendLeaderWelcomeEmail(email: string, name: string, password: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = getFromEmail();
  const appUrl = getAppUrl();

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
          <h1 style="color: #e11d48;">Olá, ${escapeHtml(name)}!</h1>
          <p>Sua nova célula foi criada e agora você faz parte oficial da liderança da Ekkle.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Seus dados de acesso:</p>
            <p style="margin: 10px 0 0 0;"><strong>E-mail:</strong> ${escapeHtml(email)}</p>
            <p style="margin: 5px 0 0 0;"><strong>Senha temporária:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${escapeHtml(password)}</code></p>
          </div>
          <p style="color: #dc2626; font-weight: bold;">⚠️ IMPORTANTE: Altere sua senha no primeiro acesso através das configurações do seu perfil.</p>
          <a href="${escapeHtml(appUrl)}/login" style="display: inline-block; background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Acessar Sistema</a>
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
            <p>Olá, <strong>${escapeHtml(adminName)}</strong>,</p>
            <p>Há uma nova solicitação de acesso para sua igreja no Ekkle:</p>

            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #f3f4f6;">
              <p style="margin: 0 0 10px 0;"><strong>Nome:</strong> ${escapeHtml(registration.fullName)}</p>
              <p style="margin: 0 0 10px 0;"><strong>E-mail:</strong> ${escapeHtml(registration.email)}</p>
              <p style="margin: 0 0 10px 0;"><strong>WhatsApp:</strong> ${escapeHtml(registration.phone)}</p>
              ${registration.message ? `<p style="margin: 15px 0 0 0; font-style: italic; color: #666; border-top: 1px solid #e5e7eb; pt: 10px;">"${escapeHtml(registration.message)}"</p>` : ''}
            </div>

            <p>Para aprovar ou recusar este cadastro, acesse o painel administrativo:</p>

            <a href="${escapeHtml(appUrl)}/membros" style="display: inline-block; background-color: #e11d48; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 0;">Ver Todas as Solicitações</a>
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
  churchName,
  loginUrl
}: {
  to: string
  name: string
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
      subject: `Bem-vindo(a) à ${escapeHtml(churchName)}!`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #e11d48; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bem-vindo(a)!</h1>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px; line-height: 1.6;">Olá, <strong>${escapeHtml(name)}</strong>!</p>
            <p style="font-size: 16px; line-height: 1.6;">Seja muito bem-vindo(a) à <strong>${escapeHtml(churchName)}</strong>! Seu cadastro foi concluído com sucesso.</p>

            <div style="background-color: #f0fdf4; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #10b981;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #065f46;">Agora você já pode fazer login e aproveitar todos os recursos disponíveis para membros!</p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${escapeHtml(loginUrl)}" style="display: inline-block; background-color: #e11d48; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(225, 29, 72, 0.2);">Acessar Minha Área</a>
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
            <p style="margin: 0;">© 2026 ${escapeHtml(churchName)}</p>
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

/**
 * Send notification to cell leader when member requests to join
 */
export async function sendCellRequestNotification({
  to,
  leaderName,
  memberName,
  cellName,
  message,
  requestsUrl
}: {
  to: string
  leaderName: string
  memberName: string
  cellName: string
  message?: string
  requestsUrl: string
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
      subject: `Nova Solicitação para ${escapeHtml(cellName)}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #e11d48; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Nova Solicitação de Participação</h1>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 16px; line-height: 1.6;">Olá, <strong>${escapeHtml(leaderName)}</strong>!</p>
            <p style="font-size: 16px; line-height: 1.6;"><strong>${escapeHtml(memberName)}</strong> solicitou participação na célula <strong>${escapeHtml(cellName)}</strong>.</p>

            ${message ? `
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #e11d48;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #666; font-size: 14px;">Mensagem do solicitante:</p>
              <p style="margin: 0; font-style: italic; color: #666;">"${escapeHtml(message)}"</p>
            </div>
            ` : ''}

            <p style="font-size: 16px; line-height: 1.6;">Para aprovar ou recusar esta solicitação, acesse o painel de solicitações:</p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${escapeHtml(requestsUrl)}" style="display: inline-block; background-color: #e11d48; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(225, 29, 72, 0.2);">Ver Solicitações Pendentes</a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 24px;">
              Este é um e-mail automático. Por favor, responda pela plataforma Ekkle.
            </p>
          </div>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">© 2026 Ekkle</p>
            <p style="margin: 8px 0 0 0;">Sistema de Gestão Eclesiástica</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending cell request notification:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service cell request error:', error);
    return { success: false, error };
  }
}

/**
 * Send notification to member when cell request is approved
 */
export async function sendCellApprovalNotification({
  to,
  memberName,
  cellName,
  cellUrl
}: {
  to: string
  memberName: string
  cellName: string
  cellUrl: string
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
      subject: `Solicitação Aprovada - ${escapeHtml(cellName)}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #10b981; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Solicitação Aprovada!</h1>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px; line-height: 1.6;">Olá, <strong>${escapeHtml(memberName)}</strong>!</p>
            <p style="font-size: 16px; line-height: 1.6;">Sua solicitação para participar da célula <strong>${escapeHtml(cellName)}</strong> foi aprovada! Você agora faz parte desta célula.</p>

            <div style="background-color: #d1fae5; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #10b981;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6;">Acesse a página da sua célula para ver informações sobre próximos encontros, membros e muito mais.</p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${escapeHtml(cellUrl)}" style="display: inline-block; background-color: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">Acessar Minha Célula</a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 24px;">
              Estamos felizes em ter você conosco! Seja muito bem-vindo(a).
            </p>
          </div>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">© 2026 Ekkle</p>
            <p style="margin: 8px 0 0 0;">Sistema de Gestão Eclesiástica</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending cell approval notification:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service cell approval error:', error);
    return { success: false, error };
  }
}

/**
 * Send notification to member when cell request is rejected
 */
export async function sendCellRejectionNotification({
  to,
  memberName,
  cellName,
  reason,
  cellsUrl
}: {
  to: string
  memberName: string
  cellName: string
  reason?: string
  cellsUrl: string
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
      subject: `Solicitação não aprovada - ${escapeHtml(cellName)}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #f59e0b; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Sobre sua Solicitação</h1>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 16px; line-height: 1.6;">Olá, <strong>${escapeHtml(memberName)}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.6;">Informamos que sua solicitação para participar da célula <strong>${escapeHtml(cellName)}</strong> não foi aprovada no momento.</p>

            ${reason ? `
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #92400e; font-size: 14px;">Motivo:</p>
              <p style="margin: 0; color: #92400e;">${escapeHtml(reason)}</p>
            </div>
            ` : ''}

            <p style="font-size: 16px; line-height: 1.6;">Não desanime! Existem outras células disponíveis que podem ser a escolha certa para você. Você pode explorar e solicitar participação em outras células.</p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${escapeHtml(cellsUrl)}" style="display: inline-block; background-color: #e11d48; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(225, 29, 72, 0.2);">Ver Outras Células</a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 24px;">
              Se tiver dúvidas, entre em contato com a liderança da igreja.
            </p>
          </div>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">© 2026 Ekkle</p>
            <p style="margin: 8px 0 0 0;">Sistema de Gestão Eclesiástica</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending cell rejection notification:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service cell rejection error:', error);
    return { success: false, error };
  }
}

/**
 * Send notification to church admin about LGPD deletion request
 */
export async function sendDeletionRequestNotification({
  to,
  adminName,
  memberName,
  reason,
  lgpdUrl,
}: {
  to: string;
  adminName: string;
  memberName: string;
  reason: string;
  lgpdUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = getFromEmail();

  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured. Email not sent.');
    return { success: false, error: 'API Key missing' };
  }

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: '⚠️ Solicitação de Exclusão de Conta - LGPD',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Solicitação de Exclusão - LGPD</h1>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 16px; line-height: 1.6;">Olá, <strong>${escapeHtml(adminName)}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.6;">Um membro da sua igreja solicitou a exclusão de sua conta conforme a Lei Geral de Proteção de Dados (LGPD).</p>

            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #dc2626;">
              <p style="margin: 0 0 12px 0; font-weight: bold; color: #991b1b;">Detalhes da Solicitação:</p>
              <p style="margin: 0 0 8px 0; color: #7f1d1d;"><strong>Membro:</strong> ${escapeHtml(memberName)}</p>
              <p style="margin: 0; color: #7f1d1d;"><strong>Motivo:</strong> ${escapeHtml(reason)}</p>
            </div>

            <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ Importante:</strong> De acordo com a LGPD, você tem até <strong>15 dias</strong> para processar esta solicitação.
              </p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${escapeHtml(lgpdUrl)}" style="display: inline-block; background-color: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Gerenciar Solicitação</a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 24px;">
              Acesse o painel de administração para revisar e processar esta solicitação.
            </p>
          </div>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">© 2026 Ekkle</p>
            <p style="margin: 8px 0 0 0;">Sistema de Gestão Eclesiástica</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending LGPD deletion notification:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service LGPD deletion error:', error);
    return { success: false, error };
  }
}
