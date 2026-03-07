/*
import { CorsOptions } from "cors";

const ALLOWED_ORIGINS_DEV = ["http://localhost:5173", "http://localhost:3000"];

function getAllowedOrigins(): string[] {
  const envOrigin = process.env.CLIENT_URL;
  if (!envOrigin) return ALLOWED_ORIGINS_DEV;

  // Support comma-separated list: CLIENT_URL="https://a.com,https://b.com"
  return envOrigin.split(",").map((o) => o.trim());
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins();

    // Allow server-to-server (no origin header) and listed origins
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy.`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200, // IE11 compatibility
};
*/
