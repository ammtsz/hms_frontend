import { APP_TITLE } from "@/config/appBranding";

export const LOGIN_FORM_LABELS = {
  clinicHeading: APP_TITLE,
  emailLabel: "Email",
  passwordLabel: "Password",
  emailPlaceholder: "you@example.com",
  signInButton: "Sign in",
  signingInLoading: "Signing in...",
  fillAllFields: "Please fill in all fields",
  genericLoginError: "Error logging in",
} as const;

export const AUTH_ERROR_MESSAGES = {
  invalidCredentials: "Invalid email or password",
  loginFailedGeneric: "Error during login. Please try again later.",
} as const;
