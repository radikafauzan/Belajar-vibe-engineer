import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema/users";
import { sessions } from "../db/schema/sessions";

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
    // 1. Cek apakah email sudah terdaftar
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

    // 2. Hash password menggunakan bcrypt bawaan Bun
    const hashedPassword = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // 3. Simpan ke database
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
