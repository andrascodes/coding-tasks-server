import express from "express";
import { ExpressError } from "../types/utils";
import createEncryptedRouter from "./encrypted";
import createApiRouter from "./api";
import { Database } from "../types/database";

interface CreateAppArguments {
  port: string | undefined;
  db: Database;
}

export default function createApp({ port, db }: CreateAppArguments): express.Application {
  const app = express();
  app.set("port", port);

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
  app.use((err: ExpressError, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // we may use properties of the error object
    // here and next(err) appropriately, or if
    // we possibly recovered from the error, simply next().
    res.status(err.status || 500);
    res.format({
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
  });

  return app;
}
