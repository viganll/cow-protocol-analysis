import { createLogger, format, transports } from "winston";

const winstonLogger = createLogger({
  level: "info",
  transports: [new transports.File({ filename: "log/error.log", level: "error" }), new transports.File({ filename: "log/warn.log", level: "warn" })],
});

let consoleTransport: transports.ConsoleTransportInstance;

consoleTransport = new transports.Console({
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    format.colorize(),
    format.printf(({ level, message, timestamp }) => `${timestamp} - ${level}: ${message}`)
  ),
  level: "debug",
});

winstonLogger.add(consoleTransport);

export const logger = winstonLogger;
