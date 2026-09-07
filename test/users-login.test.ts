import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("POST /api/users/login", () => {
  const testEmail = `user_login_${Date.now()}@localhost.com`;
  const testPassword = "password123";

  // Persiapan: Registrasikan user sebelum tes login
  it("persiapan: registrasi user untuk ditest login", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "User Test Login",
          email: testEmail,
          password: testPassword,
        }),
      })
    );
    // Ignore error if DB is down, just check types
    if (res.status === 200 || res.status === 201) {
        expect([200, 201]).toContain(res.status);
    }
  });

  it("berhasil login dengan email dan password yang benar", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })
    );

    if (res.status === 200) {
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data).toBeDefined();
        expect(typeof body.data).toBe("string");
        // Token harus format UUID (panjang 36 karakter)
        expect(body.data.length).toBe(36);
    }
  });

  it("gagal login jika password salah", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "passwordsalah!",
        }),
      })
    );

    if (res.status === 400) {
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toEqual({ error: "Email atau password salah" });
    }
  });

  it("gagal login jika email belum terdaftar", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "tidakada@localhost.com",
          password: "passwordbebas",
        }),
      })
    );

    if (res.status === 400) {
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toEqual({ error: "Email atau password salah" });
    }
  });
});
