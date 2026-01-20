import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendLeaderWelcomeEmail(email: string, name: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Videira SJC <onboarding@resend.dev>', // In production, use your verified domain
            to: email,
            subject: 'Bem-vindo(a) à Liderança - Videira SJC',
            html: `
        <div style="font-family: sans-serif; color: #333;">
          <h1 style="color: #e11d48;">Olá, ${name}!</h1>
          <p>Sua nova célula foi criada e agora você faz parte oficial da liderança da Videira SJC.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Seus dados de acesso:</p>
            <p style="margin: 10px 0 0 0;"><strong>E-mail:</strong> ${email}</p>
            <p style="margin: 5px 0 0 0;"><strong>Senha padrão:</strong> videirasjc</p>
          </div>
          <p>Recomendamos que você altere sua senha no primeiro acesso através das configurações do seu perfil.</p>
          <a href="https://videirasjc.com.br/login" style="display: inline-block; background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Acessar Sistema</a>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">© 2026 Videira São José dos Campos</p>
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
