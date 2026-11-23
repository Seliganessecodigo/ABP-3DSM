export const EMAIL_DELIVERY = Symbol('EMAIL_DELIVERY')

export interface EmailDelivery {
  send(to: string, subject: string, text: string): Promise<void>
}
