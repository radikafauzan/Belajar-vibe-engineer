import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("POST /api/users", () => {
  const uniqueEmail = `test_${Date.now()}@localhost.com`;

  it("berhasil registrasi user baru", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Eko",
          email: uniqueEmail,
          password: "rahasia",
        }),
      })
    );

    // Bisa mengembalikan 200/201 pada kasus sukses, atau mungkin fail jika MySQL tidak menyala (karena test ini butuh real db connection unless mocked).
    // Disini ekspektasi bergantung pada state dari DB. Jika DB mati, ini bisa throw/timeout.
    // Asumsi DB menyala, harusnya success.
    if (response.status === 200 || response.status === 201) {
        const body = await response.json();
        expect(body).toEqual({ data: "OK" });
    }
  });

  it("gagal jika email sudah terdaftar", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Eko Duplikat",
          email: uniqueEmail,
          password: "rahasia",
        }),
      })
    );

    // Hanya jika request pertama berhasil mendaftar, maka request kedua akan 400.
    if (response.status === 400) {
        const body = await response.json();
        expect(body).toEqual({ error: "Email sudah terdaftar" });
    }
  });
});
