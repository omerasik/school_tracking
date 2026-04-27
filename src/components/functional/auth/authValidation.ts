export const validateLogin = (email: string, password: string): string | null => {
    if (!email || !password) {
        return "Vul alle velden in";
    }
    return null;
};

export const validateRegister = (
    email: string,
    password: string,
    confirmPassword: string,
    firstName: string,
    lastName: string
): string | null => {
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
        return "Vul alle velden in";
    }

    if (password !== confirmPassword) {
        return "Wachtwoorden komen niet overeen";
    }

    return null;
};

export const translateError = (error: unknown): string => {
    const errorMessage = error instanceof Error ? error.message : "Er ging iets mis";

    if (errorMessage.includes("Invalid login credentials")) {
        return "Ongeldige inloggegevens";
    }
    if (errorMessage.includes("already registered") || errorMessage.includes("already exists")) {
        return "Dit e-mailadres is al geregistreerd";
    }

    return errorMessage;
};
