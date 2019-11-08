import express from "express";
import net from "net";
import createApp from "./app";
import createDB from "./db";

import { logger } from "./config";

interface MainReturnType {
  app: express.Application;
  server: net.Server;
  getPort(): string;
}

async function main(): Promise<MainReturnType> {
  const db = await createDB();
  const app = createApp({ port: process.env.PORT, db });
  const server = await app.listen(app.get("port"));

  return {
    app,
    server,
    getPort(): string {
      const serverAddress = server.address();
      if (!serverAddress) return "unknown";
      if (typeof serverAddress === "string") return serverAddress;
      return `${serverAddress.port}`;
    },
  };
}

main()
  .then(({ getPort }) => {
    logger.info(`Server is listening on ${getPort()}`);
  })
  .catch(logger.error);
