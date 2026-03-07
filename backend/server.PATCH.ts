// ADD imports
import http from "http";
import { initSocketServer } from "./socket/socketServer";
import notificationRoutes  from "./routes/notificationRoutes";

// CHANGE: wrap express in http server
const httpServer = http.createServer(app);

// INIT socket BEFORE listen
initSocketServer(httpServer);

// REGISTER route
app.use("/api/notifications", notificationRoutes);

// CHANGE app.listen → httpServer.listen
httpServer.listen(process.env.PORT ?? 5000, () =>
  console.info(`[Server] Running on port ${process.env.PORT ?? 5000}`)
);