const ALLOWED_DOMAIN =
  process.env.ALLOWED_EMAIL_DOMAIN ?? "plinng.com";

export function isAllowedEmail(email: string | undefined): boolean {
  if (!email) return false;
  const domain = ALLOWED_DOMAIN.startsWith("@")
    ? ALLOWED_DOMAIN.slice(1)
    : ALLOWED_DOMAIN;
  return email.toLowerCase().endsWith(`@${domain.toLowerCase()}`);
}
