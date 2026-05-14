import nodemailer from 'nodemailer'

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: parseInt(process.env.SMTP_PORT ?? '1025'),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  })
}

export async function sendMail(opts: {
  to: string
  subject: string
  text: string
  html?: string
}) {
  if (process.env.DISABLE_EMAIL === 'true') return

  const transport = createTransport()
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? 'GPI <noreply@gpi.pt>',
    ...opts,
  })
}
