import express from "express";
import net from "net";
import dotenv from "dotenv";
import createApp from "./app";

dotenv.config();

interface MainArguments {
  app: express.Application;
}

interface MainReturnType {
  app: express.Application;
  server: net.Server;
  getPort(): string;
}

async function main({ app }: MainArguments): Promise<MainReturnType> {
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

main({ app: createApp({ port: process.env.PORT }) })
  .then(({ getPort }) => {
    console.log(`Server is listening on ${getPort()}`);
  })
  .catch(console.error);
