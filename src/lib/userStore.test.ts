import { beforeEach, describe, expect, it } from "vitest";
import { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, getRegisteredUsers, readUsers, writeUsers } from "@/lib/userStore";

describe("userStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("seeds a default admin account on first read", () => {
    const users = readUsers();
    expect(users[SEED_ADMIN_EMAIL]).toEqual({
      name: "Admin",
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      role: "admin",
    });
  });

  it("does not duplicate or overwrite an existing admin account", () => {
    writeUsers({
      "owner@example.com": { name: "Owner", email: "owner@example.com", password: "hunter2", role: "admin" },
    });
    const users = readUsers();
    expect(Object.keys(users)).toEqual(["owner@example.com"]);
    expect(users["owner@example.com"].name).toBe("Owner");
  });

  it("getRegisteredUsers strips passwords from every record", () => {
    const registered = getRegisteredUsers();
    expect(registered).toContainEqual({ name: "Admin", email: SEED_ADMIN_EMAIL, role: "admin" });
    for (const user of registered) {
      expect(user).not.toHaveProperty("password");
    }
  });

  it("persists additional users alongside the seeded admin", () => {
    const before = readUsers();
    writeUsers({
      ...before,
      "customer@example.com": {
        name: "Customer",
        email: "customer@example.com",
        password: "secret123",
        role: "customer",
      },
    });
    const after = readUsers();
    expect(Object.keys(after).sort()).toEqual([SEED_ADMIN_EMAIL, "customer@example.com"].sort());
  });
});
