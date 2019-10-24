import express from "express";
import { ExpressError } from "../../types/utils";

export default function createApiRouter(): express.Router {
  const apiRouter = express.Router();

  apiRouter.get("/healthcheck", (req, res): void => {
    res.status(200).json({
      result: "success",
    });
  });

  apiRouter.get("/errorcheck", (req, res): void => {
    throw new ExpressError(500);
  });

  return apiRouter;
}
