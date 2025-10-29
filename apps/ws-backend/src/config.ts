export const JWT_SECRET = process.env.JWT_SECRET!;
export const DB_HOST = process.env.DB_HOST!;
export const PORT = process.env.PORT!;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}
