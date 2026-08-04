/**
 * Indian mobile numbers: exactly 10 digits, no country code stored.
 * Every phone/WhatsApp input on the site funnels through these helpers so the
 * typing rules and the validation message stay identical everywhere.
 */

export const PHONE_LENGTH = 10;

/**
 * Strips everything that is not a digit, drops a country/STD prefix when the
 * length makes it unambiguous, and caps the result at 10 digits.
 *
 * The length checks are exact on purpose: "9198765432" is itself a valid
 * 10-digit mobile number, so a prefix is only removed when the input is
 * literally 12 digits starting with 91 (or 11 starting with 0). This matters
 * most for pasted values like "+91 98765 43210".
 */
export function sanitizePhone(input: string): string {
  let digits = String(input ?? '').replace(/\D/g, '');

  if (digits.length === PHONE_LENGTH + 2 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === PHONE_LENGTH + 1 && digits.startsWith('0')) {
    digits = digits.slice(1);
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
 * Attributes for the underlying `<input>` of a phone field.
 *
 * Deliberately no `maxLength`: the browser enforces it on paste too, which
 * would truncate "+91 98765 43210" to "+91 98765" before sanitizePhone ever
 * sees it. The 10-digit cap is applied in sanitizePhone instead.
 */
export const phoneHtmlInputProps = {
  inputMode: 'numeric' as const,
  pattern: '[0-9]*',
  autoComplete: 'tel',
};

/** Props to spread onto a phone `TextField`. */
export const phoneInputProps = {
  type: 'tel' as const,
  slotProps: { htmlInput: phoneHtmlInputProps },
};
