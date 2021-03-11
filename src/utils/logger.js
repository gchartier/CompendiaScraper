const fs = require("fs")
require("winston-daily-rotate-file")
const { createLogger, format, transports } = require("winston")

const logDir = "log"
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
}

const logger = createLogger({
    level: "info",
    format: format.combine(format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), format.splat()),
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
            ),
        }),
        new transports.DailyRotateFile({
            filename: "log/%DATE%.log",
            datePattern: "YYYY-MM-DD",
            format: format.combine(
                format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
            ),
        }),
    ],
})

module.exports = logger
