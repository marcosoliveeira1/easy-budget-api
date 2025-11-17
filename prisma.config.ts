import path from "node:path";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    migrations: {
        seed: `tsx ${path.join(__dirname, "prisma/seed.ts")}`,
    }
});