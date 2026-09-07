import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("Elysia App Endpoints", () => {
  it("GET / should return 200 and greeting message", async () => {
    const response = await app.handle(new Request("http://localhost/"));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("belajar-vibe-engineer");
    expect(data.message).toBe("Server backend Elysia & Drizzle ORM berjalan dengan sukses!");
  });

  it("GET /health should return status information", async () => {
    const response = await app.handle(new Request("http://localhost/health"));
    // Status can be 200 (if MySQL is running locally) or 503 (if no local MySQL instance is active)
    expect([200, 503]).toContain(response.status);
    const data = await response.json();
    expect(data.server).toBe("online");
    expect(data.database).toBeDefined();
  });
});
