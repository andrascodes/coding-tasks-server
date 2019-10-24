import express from "express";
import createApiRouter from "./api";

interface ExpressError extends Error {
  status?: number;
}

interface CreateAppArguments {
  port: string | undefined;
}

export default function createApp({ port }: CreateAppArguments): express.Application {
  const app = express();
  app.set("port", port);

  const apiRouter = createApiRouter();
  app.use("/api", apiRouter);

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
