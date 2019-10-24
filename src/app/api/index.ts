import express from "express";

export default function createApiRouter(): express.Router {
  const apiRouter = express.Router();

  apiRouter.get("/healthcheck", (req, res): void => {
    res.status(200).json({
      result: "success",
    });
  });

  apiRouter.get("/errorcheck", (req, res): void => {
    throw { status: 500 };
  });

  return apiRouter;
}
