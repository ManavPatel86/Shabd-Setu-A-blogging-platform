import { beforeEach, describe, expect, it, vi } from "vitest";
import { showToast } from "@/helpers/showToast";

const { baseToast, successSpy, errorSpy, infoSpy } = vi.hoisted(() => {
  const toastFn = vi.fn();
  const success = vi.fn();
  const error = vi.fn();
  const info = vi.fn();
  toastFn.success = success;
  toastFn.error = error;
  toastFn.info = info;
  return { baseToast: toastFn, successSpy: success, errorSpy: error, infoSpy: info };
});

vi.mock("react-toastify", () => ({
  toast: baseToast,
}));

const expectedConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: false,
  draggable: true,
  progress: undefined,
  theme: "light",
};

describe("showToast helper", () => {
  beforeEach(() => {
    baseToast.mockClear();
    successSpy.mockClear();
    errorSpy.mockClear();
    infoSpy.mockClear();
  });

  it("routes success messages to toast.success", () => {
    showToast("success", "Everything saved");

    expect(successSpy).toHaveBeenCalledWith("Everything saved", expectedConfig);
  });

  it("routes error messages to toast.error", () => {
    showToast("error", "Something failed");

    expect(errorSpy).toHaveBeenCalledWith("Something failed", expectedConfig);
  });

  it("routes info messages to toast.info", () => {
    showToast("info", "Heads up");

    expect(infoSpy).toHaveBeenCalledWith("Heads up", expectedConfig);
  });

  it("falls back to the base toast when no type is provided", () => {
    showToast(undefined, "generic");

    expect(baseToast).toHaveBeenCalledWith("generic", expectedConfig);
  });
});
