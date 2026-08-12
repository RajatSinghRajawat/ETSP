/**
 * Indian mobile numbers: exactly 10 digits, stored without a country code.
 * Mirrors the rules in the web app's src/utils/phone.ts so a number typed at
 * registration and the same number typed at login resolve to one another.
 */

const PHONE_LENGTH = 10;

/**
 * Returns the bare 10-digit mobile number, or null when the input cannot be one.
 *
 * A country/STD prefix is only stripped when the length makes it unambiguous:
 * "9198765432" is itself a valid 10-digit number, so 91 is dropped only from a
 * literal 12-digit input. This matters for pasted values like "+91 98765 43210".
 */
export function normalizeIndianMobile(input) {
  let digits = String(input ?? '').replace(/\D/g, '');

  if (digits.length === PHONE_LENGTH + 2 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === PHONE_LENGTH + 1 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/**
 * Every shape the number may already have in the database. Profiles created
 * through the web app store the bare 10 digits, but older or imported rows may
 * carry a prefix — matching on an exact list keeps the unique index in play,
 * which a trailing-digits regex would not.
 */
export function mobileLookupVariants(digits) {
  return [digits, `91${digits}`, `+91${digits}`, `0${digits}`];
}
