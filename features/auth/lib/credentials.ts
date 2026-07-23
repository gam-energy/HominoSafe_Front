/** Shared username / password rules for signup and password reset. */

export const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9._-]{2,49}$/;
export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/;

export const USERNAME_RULES_KEY = "err_username_pattern";
export const PASSWORD_RULES_KEY = "err_password_pattern";

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test((value || "").trim());
}

export function isValidPassword(value: string): boolean {
  return PASSWORD_PATTERN.test(value || "");
}

export type PasswordChecks = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  digit: boolean;
  special: boolean;
};

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= 8 && password.length <= 64,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}
