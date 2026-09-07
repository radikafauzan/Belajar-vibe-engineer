# Issue #2: Implementasi Login User (POST /api/users/login)

## 📌 Ringkasan Masalah & Tujuan
Membuat fitur otentikasi login user dengan endpoint `POST /api/users/login`. Jika email dan password cocok (diverifikasi menggunakan bcrypt), sistem akan membuat token sesi baru dalam format **UUID**, menyimpannya ke tabel `sessions` di database MySQL, dan mengembalikan token tersebut kepada client.

Dokumen ini disusun sebagai panduan langkah demi langkah yang detail, terstruktur, dan presisi agar dapat langsung dieksekusi oleh junior programmer atau model AI tanpa ambiguitas.

---

## 🛠️ Spesifikasi Teknis & Tech Stack
- **Runtime**: Bun
- **Framework Web**: Elysia.js
- **Database & ORM**: MySQL & Drizzle ORM (`drizzle-orm/mysql2`)
- **Password Verification**: Bcrypt bawaan Bun (`await Bun.password.verify(password, hashedPassword, "bcrypt")`)
- **Token Generator**: Native UUID (`crypto.randomUUID()`)

---

## 🗄️ 1. Spesifikasi Database (Tabel `sessions`)

### Skema Tabel Baru: `sessions`
Tabel ini digunakan untuk menyimpan sesi login user yang aktif.

| Nama Kolom | Tipe Data | Nullable | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | No | Primary Key, Auto Increment |
| `token` | `VARCHAR(255)` | No | Token sesi berupa UUID |
| `user_id` | `INT` | No | Foreign Key merujuk ke `users.id` |
| `created_at` | `TIMESTAMP` | No | Default `CURRENT_TIMESTAMP` |

---

## 🌐 2. Spesifikasi Endpoint API

- **URL**: `/api/users/login`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`

### Request Body (JSON)
```json
{
  "email": "eko@localhost",
  "password": "rahasia"
}
```

### Response Body

#### Kasus Sukses (Login Berhasil):
- **HTTP Status**: `200 OK`
- **Body**:
```json
{
  "data": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed"
}
```
*(Nilai `data` adalah string UUID dari token yang baru saja dibuat dan disimpan di database).*

#### Kasus Error (Email Tidak Ditemukan atau Password Salah):
- **HTTP Status**: `400 Bad Request` (atau `401 Unauthorized`)
- **Body**:
```json
{
  "error": "Email atau password salah"
}
```
> **Catatan Keamanan:** Pesan error untuk email tidak terdaftar dan password salah harus dibuat **sama persis** (`"Email atau password salah"`) demi alasan keamanan (mencegah *user enumeration*).

#### Kasus Error (Validasi Input Kosong / Format Salah):
- **HTTP Status**: `400 Bad Request`
- **Body**:
```json
{
  "error": "Format email tidak valid" 
}
```
*(Atau error validasi dari Elysia jika email/password tidak dikirim).*

---

## 📁 3. Struktur Folder & File Target

Pastikan struktur file di dalam folder `src/` mengikuti konvensi berikut:

```text
src/
├── db/
│   ├── index.ts                # Koneksi database Drizzle
│   └── schema/
│       ├── index.ts            # Re-export semua skema (tambahkan export sessions)
│       ├── users.ts            # Skema tabel users
│       └── sessions.ts         # [BARU] Skema tabel sessions
├── routes/
│   └── users-router.ts         # [UPDATE] Tambahkan routing POST /users/login
├── services/
│   └── users-service.ts        # [UPDATE] Tambahkan method login() & logic verifikasi
└── index.ts                    # Entry point aplikasi (sudah me-mount usersRouter)
```

> **Aturan Penamaan File:**
> - Routing di `src/routes/`: menggunakan format `[nama]-router.ts` (contoh: `users-router.ts`).
> - Service di `src/services/`: menggunakan format `[nama]-service.ts` (contoh: `users-service.ts`).

---

## 📋 4. Tahapan Implementasi (Step-by-Step Guide)

Ikuti tahapan berikut secara berurutan:

### Langkah 1: Buat Skema Drizzle untuk Sessions (`src/db/schema/sessions.ts`)
Buat file baru `src/db/schema/sessions.ts` dengan relasi foreign key ke tabel `users`.

```typescript
// src/db/schema/sessions.ts
import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core";
import { users } from "./users";

export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
```

### Langkah 2: Daftarkan Skema di Index (`src/db/schema/index.ts`)
Buka `src/db/schema/index.ts` dan ekspor skema `sessions`:

```typescript
// src/db/schema/index.ts
export * from "./users";
export * from "./sessions";
```

### Langkah 3: Sinkronisasi Skema ke Database
Jalankan salah satu perintah Drizzle untuk menerapkan tabel `sessions` ke MySQL:
```bash
# Opsi 1: Push langsung ke database (rekomendasi untuk development)
bun run db:push

# ATAU Opsi 2: Menggunakan migration file
bun run db:generate
bun run db:migrate
```

---

### Langkah 4: Tambahkan Logic Login di Service (`src/services/users-service.ts`)
Buka `src/services/users-service.ts`, lalu:
1. Import tabel `sessions` dari `../db/schema/sessions`.
2. Buat interface `LoginUserInput`.
3. Tambahkan method statis `login(input: LoginUserInput)`.

**Detail Logic `login()`**:
1. Cari user di tabel `users` berdasarkan `email`.
2. Jika user tidak ditemukan -> kembalikan `{ success: false, error: "Email atau password salah" }`.
3. Cocokkan password input dengan password hash di database menggunakan `Bun.password.verify(input.password, user.password, "bcrypt")`.
4. Jika password tidak cocok -> kembalikan `{ success: false, error: "Email atau password salah" }`.
5. Jika cocok:
   - Buat token unik dengan `crypto.randomUUID()`.
   - Simpan session baru ke tabel `sessions` (`token` dan `userId`).
   - Kembalikan `{ success: true, data: token }`.

**Contoh Kode Pembaruan (`src/services/users-service.ts`):**
```typescript
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema/users";
import { sessions } from "../db/schema/sessions"; // <-- Import sessions

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export class UsersService {
  static async register(input: RegisterUserInput) {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUser.length > 0) {
      return {
        success: false as const,
        error: "Email sudah terdaftar",
      };
    }

    const hashedPassword = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    await db.insert(users).values({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });

    return {
      success: true as const,
      data: "OK",
    };
  }

  static async login(input: LoginUserInput) {
    // 1. Ambil user berdasarkan email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (!user) {
      return {
        success: false as const,
        error: "Email atau password salah",
      };
    }

    // 2. Verifikasi password hash bcrypt
    const isPasswordValid = await Bun.password.verify(
      input.password,
      user.password,
      "bcrypt"
    );

    if (!isPasswordValid) {
      return {
        success: false as const,
        error: "Email atau password salah",
      };
    }

    // 3. Generate token UUID
    const token = crypto.randomUUID();

    // 4. Simpan token session ke database
    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    return {
      success: true as const,
      data: token,
    };
  }
}
```

---

### Langkah 5: Tambahkan Route Login di Controller (`src/routes/users-router.ts`)
Buka `src/routes/users-router.ts` dan tambahkan rute `.post("/users/login", ...)` berantai (*method chaining*).

**Detail Rute:**
- Path: `/users/login` (karena prefix router adalah `/api`, path lengkapnya adalah `/api/users/login`).
- Validasi body:
  - `email`: string format email.
  - `password`: string minimal 1 karakter.
- Response:
  - Jika gagal (`!result.success`): set HTTP status `400` dan kembalikan `{ error: result.error }`.
  - Jika berhasil: kembalikan `{ data: result.data }`.

**Contoh Kode Pembaruan (`src/routes/users-router.ts`):**
```typescript
import { Elysia, t } from "elysia";
import { UsersService } from "../services/users-service";

export const usersRouter = new Elysia({ prefix: "/api" })
  .post(
    "/users",
    async ({ body, set }) => {
      const result = await UsersService.register({
        name: body.name,
        email: body.email,
        password: body.password,
      });

      if (!result.success) {
        set.status = 400;
        return {
          error: result.error,
        };
      }

      return {
        data: result.data,
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, error: "Nama wajib diisi" }),
        email: t.String({ format: "email", error: "Format email tidak valid" }),
        password: t.String({ minLength: 1, error: "Password wajib diisi" }),
      }),
    }
  )
  .post(
    "/users/login",
    async ({ body, set }) => {
      const result = await UsersService.login({
        email: body.email,
        password: body.password,
      });

      if (!result.success) {
        set.status = 400;
        return {
          error: result.error,
        };
      }

      return {
        data: result.data,
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email", error: "Format email tidak valid" }),
        password: t.String({ minLength: 1, error: "Password wajib diisi" }),
      }),
    }
  );
```

---

## 🧪 5. Pengujian & Verifikasi (Testing Plan)

### A. Automated Integration Test (`test/users-login.test.ts`)
Buat file tes baru `test/users-login.test.ts` untuk menguji alur login:

**Skenario Pengujian:**
1. **Login Berhasil**: Mendaftarkan user terlebih dahulu, lalu login dengan kredensial yang benar -> status `200` dan `data` berisi string token UUID.
2. **Login Gagal (Password Salah)**: Login dengan email terdaftar tetapi password salah -> status `400` dan `{ error: "Email atau password salah" }`.
3. **Login Gagal (Email Belum Terdaftar)**: Login dengan email yang belum ada -> status `400` dan `{ error: "Email atau password salah" }`.
4. **Login Gagal (Format Validasi Salah)**: Login dengan format email salah atau kosong -> status `400`/error validasi.

**Contoh Kode Test (`test/users-login.test.ts`):**
```typescript
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
    expect([200, 201]).toContain(res.status);
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

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(typeof body.data).toBe("string");
    // Token harus format UUID (panjang 36 karakter)
    expect(body.data.length).toBe(36);
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

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Email atau password salah" });
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

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Email atau password salah" });
  });
});
```

Jalankan pengujian:
```bash
bun test test/users-login.test.ts
```

### B. Manual Verification via cURL

1. **Test Login Sukses:**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"eko@localhost","password":"rahasia"}'
```
*Ekspektasi Output:*
```json
{"data":"e4b47d33-40c2-48e7-b6a6-f3b17cb12999"}
```

2. **Test Login Password Salah:**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"eko@localhost","password":"salah"}'
```
*Ekspektasi Output:*
```json
{"error":"Email atau password salah"}
```

---

## 🎯 6. Kriteria Selesai (Definition of Done)
- [ ] File skema `src/db/schema/sessions.ts` telah dibuat dengan relasi foreign key ke `users.id`.
- [ ] Skema `sessions` diekspor di `src/db/schema/index.ts`.
- [ ] Tabel `sessions` berhasil disinkronisasi ke database MySQL via `bun run db:push` atau migrasi.
- [ ] Method `login()` pada `src/services/users-service.ts` memverifikasi password dengan `Bun.password.verify()`.
- [ ] Token sesi berupa UUID (`crypto.randomUUID()`) tersimpan di tabel `sessions`.
- [ ] Endpoint `POST /api/users/login` terdaftar di `src/routes/users-router.ts`.
- [ ] Endpoint mengembalikan `{ "data": "<token>" }` saat login berhasil.
- [ ] Endpoint mengembalikan `{ "error": "Email atau password salah" }` saat email tidak ditemukan atau password salah.
- [ ] Seluruh unit/integration test di `bun test` berhasil lolos (`PASS`).
