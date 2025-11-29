import User, { USERNAME_REGEX } from "../models/user.model.js";

export const USERNAME_REQUIREMENTS_MESSAGE = "Username must be 3-20 characters and may include lowercase letters, numbers, or underscores.";

export const normalizeUsername = (value = "") =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");

export const stripToAllowedCharacters = (value = "") => normalizeUsername(value);

export const isValidUsername = (value = "") => USERNAME_REGEX.test(value);

export const isUsernameAvailable = async (username, excludeUserId) => {
    if (!username) return false;
    const query = { username };
    if (excludeUserId) {
        query._id = { $ne: excludeUserId };
    }
    const existing = await User.exists(query);
    return !existing;
};

const buildBaseFromSeed = (seed = "") => {
    const cleaned = stripToAllowedCharacters(seed)
        .replace(/_{2,}/g, "_")
        .replace(/^_+|_+$/g, "");

    if (cleaned.length >= 3) {
        return cleaned.slice(0, 20);
    }

    const randomFallback = `user${Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(0, 6)}`;
    return stripToAllowedCharacters(randomFallback);
};

export const generateUsernameSuggestion = async (seed = "") => {
    let base = buildBaseFromSeed(seed);
    if (!base) {
        base = "user";
    }

    base = base.slice(0, 20);

    let candidate = base;
    let attempt = 0;

    const ensureValidLength = (value, suffix = "") => {
        const trimmedBase = value.slice(0, Math.max(3, 20 - suffix.length));
        return `${trimmedBase}${suffix}`;
    };

    while (attempt < 1000) {
        const suffix = attempt === 0 ? "" : attempt.toString();
        const current = ensureValidLength(base, suffix);
        if (isValidUsername(current) && await isUsernameAvailable(current)) {
            return current;
        }
        attempt += 1;
    }

    throw new Error("Unable to generate an available username.");
};
