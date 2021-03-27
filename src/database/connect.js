const { Pool } = require("pg")

const isProduction = process.env.NODE_ENV === "PRODUCTION"
const connectionString = `postgres://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`

// Use a symbol to store a global instance of a connection, and to access it from the singleton.
const DB_KEY = Symbol.for("Compendia.db")
const globalSymbols = Object.getOwnPropertySymbols(global)
const hasDb = globalSymbols.includes(DB_KEY)

if (!hasDb) {
    global[DB_KEY] = new Pool({
        connectionString,
        ssl: isProduction,
    })
}

// Create and freeze the singleton object so that it has an instance property.
const singleton = {}
Object.defineProperty(singleton, "instance", {
    get: function () {
        return global[DB_KEY]
    },
})
Object.freeze(singleton)

module.exports = singleton
