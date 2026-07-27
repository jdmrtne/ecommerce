export interface LoginErrors {
  email?: string;
  password?: string;
}

export interface SignupErrors extends LoginErrors {
  name?: string;
  confirmPassword?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 6;

export function validateLogin(data: { email: string; password: string }): LoginErrors {
  const errors: LoginErrors = {};
  if (!EMAIL_PATTERN.test(data.email)) errors.email = "Please enter a valid email address.";
  if (!data.password) errors.password = "Please enter your password.";
  return errors;
}

export function validateSignup(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): SignupErrors {
  const errors: SignupErrors = {};
  if (!data.name.trim()) errors.name = "Please enter your name.";
  if (!EMAIL_PATTERN.test(data.email)) errors.email = "Please enter a valid email address.";
  if (data.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (data.confirmPassword !== data.password) errors.confirmPassword = "Passwords don't match.";
  return errors;
}
