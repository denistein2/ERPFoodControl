import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailRequestBody {
  to?: string;
  subject?: string;
  html?: string;
}

interface EmailRequest {
  method?: string;
  body?: EmailRequestBody;
}

interface EmailResponse {
  status: (code: number) => {
    json: (payload: unknown) => unknown;
  };
}

export default async function handler(req: EmailRequest, res: EmailResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html } = req.body ?? {};

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const data = await resend.emails.send({
      from: 'ERP Food Control <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json(error);
  }
}
