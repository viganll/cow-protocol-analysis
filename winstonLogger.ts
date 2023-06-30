import { createLogger, format, transports } from "winston";

const winstonLogger = createLogger({
  level: "info",
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
