import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const PAKISTAN_MOBILE_REGEX = /^(?:\+92|92|0)?3[0-9]{9}$/;

export const normalizePakistaniPhone = (value: string): string =>
  String(value || '').replace(/[\s-]/g, '');

export const isValidPakistaniPhone = (value: string): boolean =>
  PAKISTAN_MOBILE_REGEX.test(normalizePakistaniPhone(value));

export const pakistaniPhoneValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const raw = control.value;
  if (!raw) return null;

  return isValidPakistaniPhone(String(raw)) ? null : { pakistaniPhone: true };
};

export const PAKISTANI_PHONE_ERROR =
  'Enter a valid Pakistani mobile number (e.g. 03001234567 or +923001234567)';
