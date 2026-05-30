/**
 * Password Policy Validator
 * Enforces strong security requirements for student/parent password setup.
 */

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long.",
    }
  }

  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (!hasUppercase) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter.",
    }
  }

  if (!hasLowercase) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter.",
    }
  }

  if (!hasDigit) {
    return {
      isValid: false,
      message: "Password must contain at least one number.",
    }
  }

  if (!hasSpecial) {
    return {
      isValid: false,
      message: "Password must contain at least one special character.",
    }
  }

  return { isValid: true }
}
