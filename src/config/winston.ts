import { createLogger, format, transports } from "winston";

const level = process.env.LOG_LEVEL || "debug";

const logger = createLogger({
  level,
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.Console({
      silent: process.env.LOG_LEVEL === "none",
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});

export default logger;
