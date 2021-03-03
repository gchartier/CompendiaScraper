const mongoose = require("mongoose")
const logger = require("../utils/logger.js")
const comicModel = require("../models/comic.js")
const seriesModel = require("../models/series.js")
const { creatorModel } = require("../models/creator.js")

function connectCallback(error, client) {
    if (error) throw error
    else {
        const db = client.db
        // TODO Shouldn't I close this?
    }
}

async function dbConnect() {
    const connectionString = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_SERVER}/${process.env.DB}`
    const options = {
        useNewUrlParser: true,
        useCreateIndex: true,
    }
    try {
        mongoose.connect(connectionString, options, connectCallback)
        await comicModel.deleteMany({})
        await creatorModel.deleteMany({})
        await seriesModel.deleteMany({})
    } catch (error) {
        logger.error(`! MongoDB error: ${error.message}`)
    }
}

module.exports = dbConnect
