const { dir } = require("console")
const fs = require("fs")
const path = require("path")
require("winston-daily-rotate-file")
const { createLogger, format, transports } = require("winston")

const logDirs = [
    { name: "log", path: "log" },
    { name: "info", path: "log/info" },
    { name: "data", path: "log/data" },
]
logDirs.forEach((dir) => {
    if (!fs.existsSync(dir.path)) {
        fs.mkdirSync(dir.path)
    }
})

const infoLogger = createLogger({
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
            filename: `${logDirs.find((dir) => dir.name === "info").path}/%DATE%.log`,
            datePattern: "YYYY-MM-DD",
            format: format.combine(
                format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
            ),
        }),
    ],
})

const dataLogger = createLogger({
    level: "info",
    format: format.combine(
        format.label({ label: path.basename(process.mainModule.filename) }),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.splat()
    ),
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf((info) => `${info.timestamp}: ${info.message}`)
            ),
        }),
        new transports.DailyRotateFile({
            filename: `${logDirs.find((dir) => dir.name === "data").path}/%DATE%.log`,
            datePattern: "YYYY-MM-DD",
            format: format.combine(format.printf((info) => `${info.timestamp}: ${info.message}`)),
        }),
    ],
})

module.exports = { infoLogger, dataLogger }
