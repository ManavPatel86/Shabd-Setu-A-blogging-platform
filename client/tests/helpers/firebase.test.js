import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const initializeAppMock = vi.fn();
const getAuthMock = vi.fn();
const providerInstance = { provider: true };
const GoogleAuthProviderMock = vi.fn(function MockProvider() {
  return providerInstance;
});

vi.mock("firebase/app", () => ({
  initializeApp: (...args) => initializeAppMock(...args),
}));

vi.mock("firebase/auth", () => ({
  getAuth: (...args) => getAuthMock(...args),
  GoogleAuthProvider: GoogleAuthProviderMock,
}));

describe("firebase helper", () => {
  beforeEach(() => {
    vi.resetModules();
    initializeAppMock.mockReset();
    getAuthMock.mockReset();
    GoogleAuthProviderMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("initializes firebase and exposes auth/provider instances", async () => {
    vi.stubEnv("VITE_FIREBASE_API", "api-key-123");
    initializeAppMock.mockReturnValue({ name: "app" });
    getAuthMock.mockReturnValue({ auth: "instance" });

    const module = await import("@/helpers/firebase");

    expect(initializeAppMock).toHaveBeenCalledWith({
      apiKey: "api-key-123",
      authDomain: "se-project-f0cc6.firebaseapp.com",
      projectId: "se-project-f0cc6",
      storageBucket: "se-project-f0cc6.firebasestorage.app",
      messagingSenderId: "809803675418",
      appId: "1:809803675418:web:126af70c6ea0bfe04edea3",
    });
    expect(getAuthMock).toHaveBeenCalledWith({ name: "app" });
    expect(GoogleAuthProviderMock).toHaveBeenCalledTimes(1);
    expect(module.auth).toEqual({ auth: "instance" });
    expect(module.provider).toBe(providerInstance);
  });
});
