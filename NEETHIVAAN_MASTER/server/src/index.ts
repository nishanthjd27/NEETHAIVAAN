// path: server/src/index.ts
import { createApp } from "./app";
import { connectDB } from "./config/database";
import { ENV }       from "./config/env";

async function bootstrap(): Promise<void> {
  await connectDB();
  const app    = createApp();
  const server = app.listen(ENV.PORT, () => {
    console.log("✅ NEETHIVAAN API running on port " + ENV.PORT + " [" + ENV.NODE_ENV + "]");
  });

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
    server.close(() => process.exit(1));
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
