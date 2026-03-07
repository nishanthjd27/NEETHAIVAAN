/*
const REQUIRED_ENV_VARS: string[] = [
  "NODE_ENV",
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "CLIENT_URL",
];

/**
 * Call once at startup before anything else.
 * validateEnv();
 * /
export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key] || process.env[key]!.trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(
      `\n🚨  Missing required environment variables:\n    ${missing.join(
        "\n    "
      )}\n`
    );
    process.exit(1); // Hard stop — never run without required config
  }

  // Warn on obviously insecure JWT secrets in production
  if (
    process.env.NODE_ENV === "production" &&
    process.env.JWT_SECRET!.length < 32
  ) {
    console.warn(
      "⚠️  JWT_SECRET is shorter than 32 characters. Use a strong secret in production."
    );
  }

  console.log("✅  Environment variables validated.");
}
*/
