import { Elysia } from "elysia";
import { checkDatabaseConnection } from "./db";

const PORT = Number(process.env.PORT) || 3000;

export const app = new Elysia()
  .get("/", () => ({
    name: "belajar-vibe-engineer",
    message: "Server backend Elysia & Drizzle ORM berjalan dengan sukses!",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  }))
  .get("/health", async ({ set }) => {
    const dbStatus = await checkDatabaseConnection();
    const isHealthy = dbStatus.status === "connected";

    if (!isHealthy) {
      set.status = 503;
    }

    return {
      status: isHealthy ? "healthy" : "degraded",
      server: "online",
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  })
  .listen(PORT);

console.log(
  `🚀 Server berjalan di http://${app.server?.hostname || "localhost"}:${app.server?.port || PORT}`
);
