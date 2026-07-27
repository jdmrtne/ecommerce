import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, validateLogin, validateSignup } from "@/lib/auth";

describe("validateLogin", () => {
  it("returns no errors for a valid login", () => {
    expect(validateLogin({ email: "jude@example.com", password: "secret" })).toEqual({});
  });

  it("flags a malformed email", () => {
    const errors = validateLogin({ email: "not-an-email", password: "secret" });
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeUndefined();
  });

  it("flags an empty password", () => {
    const errors = validateLogin({ email: "jude@example.com", password: "" });
    expect(errors.password).toBeDefined();
  });

  it("flags both fields when both are invalid", () => {
    const errors = validateLogin({ email: "bad", password: "" });
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });
});

describe("validateSignup", () => {
  const valid = {
    name: "Jude",
    email: "jude@example.com",
    password: "secret123",
    confirmPassword: "secret123",
  };

  it("returns no errors for a valid signup", () => {
    expect(validateSignup(valid)).toEqual({});
  });

  it("flags a blank name (including whitespace-only)", () => {
    expect(validateSignup({ ...valid, name: "" }).name).toBeDefined();
    expect(validateSignup({ ...valid, name: "   " }).name).toBeDefined();
  });

  it("flags a malformed email", () => {
    expect(validateSignup({ ...valid, email: "nope" }).email).toBeDefined();
  });

  it(`flags a password shorter than ${MIN_PASSWORD_LENGTH} characters`, () => {
    const errors = validateSignup({ ...valid, password: "abc", confirmPassword: "abc" });
    expect(errors.password).toBeDefined();
  });

  it("flags a mismatched confirm-password", () => {
    const errors = validateSignup({ ...valid, confirmPassword: "different" });
    expect(errors.confirmPassword).toBeDefined();
  });

  it("accepts a password exactly at the minimum length", () => {
    const pw = "a".repeat(MIN_PASSWORD_LENGTH);
    expect(validateSignup({ ...valid, password: pw, confirmPassword: pw }).password).toBeUndefined();
  });
});
