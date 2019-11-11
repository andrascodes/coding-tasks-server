import express from "express";
import morgan from "morgan";
import cors from "cors";
import { ExpressError } from "../types/utils";
import createEncryptedRouter from "./encrypted";
import createApiRouter from "./api";
import { Database } from "../types/database";
import { logger, clientUrl } from "../config";

interface CreateAppArguments {
  port: string | undefined;
  db: Database;
}

export default function createApp({ port, db }: CreateAppArguments): express.Application {
  const app = express();
  app.set("port", port);

  app.use(
    cors({
      origin: clientUrl,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 200,
      exposedHeaders: ["Authorization"],
      credentials: true,
    }),
  );

  app.use(
    morgan(process.env.NODE_ENV !== "development" ? "combined" : "dev", {
      skip: (req, res) => res.statusCode < 400,
      stream: { write: message => logger.error(message.trim()) },
    }),
  );

  app.use(
    morgan(process.env.NODE_ENV !== "development" ? "combined" : "dev", {
      skip: (req, res) => res.statusCode >= 400,
      stream: { write: message => logger.info(message.trim()) },
    }),
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use("/api", createApiRouter({ db }));
  app.use("/encrypted", createEncryptedRouter({ db }));

  // Non-existing route handler
  app.use((req, res, next) => {
    res.status(404);

    res.format({
      // html() {
      //   res.render("404", { url: req.url });
      // },
      json() {
        res.json({ error: "Not found" });
      },
      default() {
        res.type("txt").send("Not found");
      },
    });
  });

  // Error handler
  app.use((err: ExpressError, req: express.Request, res: express.Response, next: express.NextFunction): void => {
    // we may use properties of the error object
    // here and next(err) appropriately, or if
    // we possibly recovered from the error, simply next().
    logger.error(err);
    res.status(err.status || 500).format({
      // html() {
      //  res.render("500", { error: err });
      // },
      json() {
        res.json({ error: "Server error" });
      },
      default() {
        res.type("txt").send("Server error");
      },
    });
    next();
  });

  return app;
}
