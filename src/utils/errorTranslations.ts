/**
 * Translates backend error messages to Portuguese
 */
export const translateErrorMessage = (errorMessage: string): string => {
  // Translate rate limiting errors to Portuguese
  if (errorMessage.includes("attempt(s) remaining")) {
    const match = errorMessage.match(/(\d+) attempt\(s\) remaining/);
    if (match) {
      const remaining = match[1];
      return `Senha atual incorreta. ${remaining} tentativa(s) restante(s).`;
    }
  }

  if (errorMessage.includes("locked for") && errorMessage.includes("minutes")) {
    const match = errorMessage.match(/locked for (\d+) minutes/);
    if (match) {
      const minutes = match[1];
      return `Muitas tentativas de alteração de senha falharam. Sua conta foi bloqueada por ${minutes} minutos.`;
    }
  }

  if (errorMessage.includes("Please try again in") && errorMessage.includes("minute(s)")) {
    const match = errorMessage.match(/Please try again in (\d+) minute\(s\)/);
    if (match) {
      const minutes = match[1];
      return `Muitas tentativas de alteração de senha falharam. Tente novamente em ${minutes} minuto(s).`;
    }
  }

  if (errorMessage.includes("Current password is incorrect")) {
    return "Senha atual incorreta.";
  }

  // Return original message if no translation match
  return errorMessage;
};
