const fs = require("fs")
const path = require("path")
require("winston-daily-rotate-file")
const { createLogger, format, transports } = require("winston")
const logDir = "log"

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
}

const logger = createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: format.combine(
        format.label({ label: path.basename(process.mainModule.filename) }),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.splat()
    ),
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf(
                    (info) => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
                )
            ),
        }),
        new transports.DailyRotateFile({
            filename: `${logDir}/%DATE%-results.log`,
            datePattern: "YYYY-MM-DD",
            format: format.combine(
                format.printf(
                    (info) => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
                )
            ),
        }),
    ],
})

module.exports = logger
