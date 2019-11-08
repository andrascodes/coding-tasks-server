import express from "express";

interface CreateErrorResponseArguments {
  message: string;
  statusCode: number;
  code: string;
}

export default function sendErrorResponse(
  { message, statusCode, code }: CreateErrorResponseArguments,
  res: express.Response,
): express.Response {
  return res.status(statusCode).format({
    json() {
      res.json({ error: message, code });
    },
    default() {
      res.type("txt").send(message);
    },
  });
}
