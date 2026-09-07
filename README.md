# Belajar Vibe Engineer - Backend Project

Fondasi project backend modern berbasis runtime **Bun**, framework **Elysia.js**, dan ORM **Drizzle** yang terhubung ke database **MySQL**.

---

## 🛠️ Tech Stack

- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Web Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database Driver**: [mysql2](https://github.com/sidorares/node-mysql2)
- **Database Tooling**: [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)

---

## 📂 Struktur Direktori

```text
.
├── drizzle/              # Folder output hasil generate migrasi SQL (Drizzle Kit)
├── src/
│   ├── db/
│   │   ├── schema/       # Definisi skema tabel Drizzle
│   │   │   ├── users.ts  # Skema tabel users (contoh)
│   │   │   └── index.ts  # Re-export seluruh skema tabel
│   │   └── index.ts      # Koneksi MySQL pool & Drizzle ORM instance
│   └── index.ts          # Entry point server Elysia.js & route handlers
├── .env.example          # Contoh variabel environment
├── .env                  # Variabel environment lokal
├── .gitignore            # Daftar file/folder yang diabaikan git
├── drizzle.config.ts     # Konfigurasi Drizzle Kit
├── package.json          # Dependencies dan scripts
├── tsconfig.json         # Konfigurasi TypeScript
└── README.md             # Dokumentasi project
```

---

## 🚀 Memulai (Getting Started)

### 1. Prasyarat

Pastikan [Bun](https://bun.sh/) telah terinstal di sistem Anda.

### 2. Instalasi Dependensi

Jalankan perintah berikut pada direktori root project:

```bash
bun install
```

### 3. Konfigurasi Environment

Salin file `.env.example` menjadi `.env` dan sesuaikan kredensial database MySQL Anda:

```bash
cp .env.example .env
```

Isi variabel di `.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=belajar_vibe_engineer
```

### 4. Menjalankan Server Development

Jalankan server dalam watch mode:

```bash
bun run dev
```

Server akan aktif pada `http://localhost:3000`.

---

## 🗄️ Manajemen Database & Migrasi (Drizzle Kit)

| Perintah | Keterangan |
|---|---|
| `bun run db:generate` | Membuat file migrasi SQL baru berdasarkan perubahan skema di `src/db/schema/` |
| `bun run db:migrate` | Menerapkan file migrasi SQL ke database MySQL |
| `bun run db:push` | Mendorong perubahan skema langsung ke database tanpa file migrasi (berguna saat prototyping) |
| `bun run db:studio` | Membuka Drizzle Studio di browser untuk inspeksi visual tabel dan data |

---

## 📡 Endpoint API

### 1. Root Endpoint
- **URL**: `GET /`
- **Respons**:
```json
{
  "name": "belajar-vibe-engineer",
  "message": "Server backend Elysia & Drizzle ORM berjalan dengan sukses!",
  "environment": "development",
  "timestamp": "2026-09-07T06:30:00.000Z"
}
```

### 2. Health Check Endpoint
- **URL**: `GET /health`
- **Respons (Healthy)**:
```json
{
  "status": "healthy",
  "server": "online",
  "database": {
    "status": "connected"
  },
  "uptime": 12.34,
  "timestamp": "2026-09-07T06:30:00.000Z"
}
```
