import User, { USERNAME_REGEX } from "../models/user.model.js";

export const USERNAME_REQUIREMENTS_MESSAGE = "Username must be 3-20 characters, start with a letter, and may contain lowercase letters, numbers, or underscores.";

export const normalizeUsername = (value = "") => value.trim().toLowerCase();

export const isValidUsername = (value = "") => USERNAME_REGEX.test(value);

const buildUsernameBase = (seed = "") => {
    let base = (seed || "")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .replace(/_{2,}/g, "_")
        .replace(/^_+|_+$/g, "");

    if (!base || !/^[a-z]/.test(base)) {
        base = `user${Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(0, 6)}`;
    }

    if (base.length < 3) {
        base = `${base}${"abcdefghijklmnopqrstuvwxyz".slice(0, 3 - base.length)}`;
    }

    return base.slice(0, 15);
};

// Export buildUsernameBase for unit tests
export { buildUsernameBase };

// Internal helper to generate candidate with specific suffix (exposed for testing)
export const generateCandidateWithSuffix = (base, suffix) => {
    if (suffix === 0) return base;
    const suffixStr = suffix.toString();
    const trimmedBase = base.slice(0, Math.max(3, 20 - suffixStr.length));
    return `${trimmedBase}${suffixStr}`;
};

export const generateUniqueUsername = async (seed = "", _startingSuffix = 0) => {
    let base = buildUsernameBase(seed);
    let suffix = _startingSuffix;
    let candidate = generateCandidateWithSuffix(base, suffix);

    while (await User.exists({ username: candidate })) {
        suffix += 1;
        candidate = generateCandidateWithSuffix(base, suffix);
    }

    if (!isValidUsername(candidate)) {
        return generateUniqueUsername(`user${Date.now()}`);
    }

    return candidate;
};

export const ensureUserHasUsername = async (userDoc, seed) => {
    if (!userDoc) return null;
    if (userDoc.username && isValidUsername(userDoc.username)) {
        return userDoc;
    }

    const fallbackSeed = seed || userDoc.name || userDoc.email || userDoc._id?.toString() || "user";
    userDoc.username = await generateUniqueUsername(fallbackSeed);
    await userDoc.save();
    return userDoc;
};
