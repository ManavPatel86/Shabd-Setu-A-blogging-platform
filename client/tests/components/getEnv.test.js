import { getEnv } from "@/helpers/getEnv";

describe("getEnv", () => {
	const baselineEnv = { ...import.meta.env };

	afterEach(() => {
		Object.keys(import.meta.env).forEach((key) => {
			if (!(key in baselineEnv)) {
				delete import.meta.env[key];
			}
		});
		Object.assign(import.meta.env, baselineEnv);
	});

	it("returns existing environment values", () => {
		expect(getEnv("MODE")).toBe(import.meta.env.MODE);
	});

	it("returns undefined when the variable does not exist", () => {
		expect(getEnv("VITE__MISSING_KEY__")).toBeUndefined();
	});

	it("reads dynamically injected test-time variables", () => {
		import.meta.env.VITE_RUNTIME_FLAG = "ENABLED";
		expect(getEnv("VITE_RUNTIME_FLAG")).toBe("ENABLED");
	});
});
