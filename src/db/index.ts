import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

export const poolConnection = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "belajar_vibe_engineer",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(poolConnection, { schema, mode: "default" });

export async function checkDatabaseConnection(): Promise<{
  status: "connected" | "disconnected";
  message?: string;
}> {
  try {
    const [rows] = await poolConnection.query("SELECT 1");
    return { status: "connected" };
  } catch (error: any) {
    return {
      status: "disconnected",
      message: error?.message || "Unable to connect to database",
    };
  }
}
