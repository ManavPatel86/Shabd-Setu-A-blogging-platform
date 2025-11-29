import { describe, expect, it } from "vitest";
import userReducer, { setUser, removeUser } from "@/redux/user/user.slice";

const demoUser = {
  _id: "42",
  name: "Ada Lovelace",
  email: "ada@example.com",
};

describe("user slice reducer", () => {
  it("returns the initial state by default", () => {
    const initialState = userReducer(undefined, { type: "unknown" });

    expect(initialState).toEqual({ isLoggedIn: false, user: {} });
  });

  it("sets the user and marks session as logged in", () => {
    const nextState = userReducer(undefined, setUser(demoUser));

    expect(nextState.isLoggedIn).toBe(true);
    expect(nextState.user).toEqual(demoUser);
  });

  it("clears the user and resets login status", () => {
    const populatedState = { isLoggedIn: true, user: demoUser };
    const nextState = userReducer(populatedState, removeUser());

    expect(nextState).toEqual({ isLoggedIn: false, user: {} });
  });
});
