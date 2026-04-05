export function validatePhone(phone: string): string | null {
  const cleaned = phone.replace(/\s+/g, '');
  if (!cleaned) return 'Le numéro de téléphone est requis';
  if (!/^\+?[0-9]{8,15}$/.test(cleaned)) return 'Numéro de téléphone invalide';
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return 'Le nom est requis';
  if (name.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères';
  if (name.trim().length > 50) return 'Le nom est trop long';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Le mot de passe est requis';
  if (password.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères';
  return null;
}

export function validateOTP(otp: string): string | null {
  if (!otp) return 'Le code OTP est requis';
  if (!/^\d{6}$/.test(otp)) return 'Le code OTP doit contenir 6 chiffres';
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) return `${fieldName} est requis(e)`;
  return null;
}
