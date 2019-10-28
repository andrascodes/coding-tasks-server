import express from "express";
import net from "net";
import dotenv from "dotenv";
import createApp from "./app";
import createDB from "./db";

interface MainReturnType {
  app: express.Application;
  server: net.Server;
  getPort(): string;
}

dotenv.config();

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
    console.log(`Server is listening on ${getPort()}`);
  })
  .catch(console.error);
