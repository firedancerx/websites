export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  // Standard RFC-style regex pattern enforcing @ and valid domain extension
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(trimmed);
}

export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== "string" || phone.trim() === "") return true; // Optional phone field
  const trimmed = phone.trim();
  // Phone must contain digits, spaces, hyphens, plus prefix, parentheses, and NO letters
  const phoneRegex = /^\+?[0-9\s\-()]{7,25}$/;
  if (!phoneRegex.test(trimmed)) return false;
  // Extra check: ensure at least 7 digits
  const digitCount = (trimmed.match(/\d/g) || []).length;
  return digitCount >= 7;
}
