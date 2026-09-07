import { Elysia, t } from "elysia";
import { UsersService } from "../services/users-service";

export const usersRouter = new Elysia({ prefix: "/api" }).post(
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
);
