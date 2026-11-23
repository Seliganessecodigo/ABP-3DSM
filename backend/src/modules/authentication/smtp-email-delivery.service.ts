import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import { EmailDelivery } from './email-delivery'

@Injectable()
export class SmtpEmailDelivery implements EmailDelivery {
  async send(to: string, subject: string, text: string): Promise<void> {
    const host = process.env.SMTP_HOST
    const from = process.env.SMTP_FROM
    if (!host || !from) {
      throw new ServiceUnavailableException({
        code: 'EMAIL_DELIVERY_NOT_CONFIGURED',
        message: 'O envio de e-mail não está configurado',
      })
    }

    const port = Number(process.env.SMTP_PORT ?? 587)
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new ServiceUnavailableException({
        code: 'EMAIL_DELIVERY_NOT_CONFIGURED',
        message: 'A configuração de e-mail é inválida',
      })
    }

    const transport = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASSWORD
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
    })

    try {
      await transport.sendMail({ from, to, subject, text })
    } catch {
      throw new ServiceUnavailableException({
        code: 'EMAIL_DELIVERY_FAILED',
        message: 'Não foi possível enviar o e-mail',
      })
    } finally {
      transport.close()
    }
  }
}
