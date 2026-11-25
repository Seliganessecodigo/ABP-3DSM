import { googleSsoStartUrl } from './api.ts'

export const ssoInvitationStorageKey = 'greener.sso.invite'
export const ssoVerifierStorageKey = 'greener.sso.verifier'

export function readSsoInvitation(value: string | null): string | undefined {
  return value?.match(/^[A-Za-z0-9_-]{64}$/)?.[0]
}

export async function redirectToGoogleSso(invitation?: string): Promise<void> {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const verifier = base64Url(bytes)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const challenge = base64Url(new Uint8Array(digest))
  sessionStorage.setItem(ssoVerifierStorageKey, verifier)
  window.location.assign(googleSsoStartUrl(challenge, invitation))
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}
