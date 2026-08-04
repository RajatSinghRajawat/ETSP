/**
 * Indian mobile numbers: exactly 10 digits, no country code stored.
 * Every phone/WhatsApp input on the site funnels through these helpers so the
 * typing rules and the validation message stay identical everywhere.
 */

export const PHONE_LENGTH = 10;

/**
 * Strips everything that is not a digit, drops a leading +91/91/0 that users
 * habitually type, and caps the result at 10 digits.
 */
export function sanitizePhone(input: string): string {
  let digits = String(input ?? '').replace(/\D/g, '');

  // "+91 98765 43210" / "919876543210" -> "9876543210"
  if (digits.length > PHONE_LENGTH && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  // Legacy STD style "09876543210"
  if (digits.length > PHONE_LENGTH && digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }

  return digits.slice(0, PHONE_LENGTH);
}

export function isValidPhone(value: string): boolean {
  return /^[6-9]\d{9}$/.test(String(value ?? '').trim());
}

/** Returns an error string, or '' when the value is acceptable. */
export function validatePhone(value: string, { required = false } = {}): string {
  const digits = String(value ?? '').trim();

  if (!digits) {
    return required ? 'Mobile number is required' : '';
  }
  if (digits.length !== PHONE_LENGTH) {
    return 'Enter a 10 digit mobile number';
  }
  if (!isValidPhone(digits)) {
    return 'Enter a valid 10 digit mobile number';
  }
  return '';
}

/**
 * Props to spread onto a phone `TextField` — numeric keypad on mobile,
 * digits only, hard 10-character cap.
 */
export const phoneInputProps = {
  type: 'tel' as const,
  inputMode: 'numeric' as const,
  slotProps: {
    htmlInput: {
      maxLength: PHONE_LENGTH,
      inputMode: 'numeric' as const,
      pattern: '[0-9]*',
      autoComplete: 'tel',
    },
  },
};
