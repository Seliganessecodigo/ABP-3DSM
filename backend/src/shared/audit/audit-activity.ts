// The administrative audit is a read model of changes and attempts to change persisted state.
// Add new change actions here; access events and preparatory challenges do not belong to it.
export const auditableChangeActions = [
  'account.created', 'account.role.changed', 'account.status.changed', 'account.status.denied',
  'monitoring.paused', 'monitoring.resumed', 'preference.saved',
  'auth.organization.created', 'auth.admin.invited', 'auth.admin.invitation.issued',
  'auth.email.confirmed', 'auth.email.confirmation.resent',
  'auth.password.changed', 'auth.password-recovery.completed',
  'auth.sso.invitation.issued', 'auth.sso.identity.linked', 'auth.sso.identity.revoked',
  'auth.totp.activated', 'auth.totp.replaced', 'auth.totp.recovered',
] as const
