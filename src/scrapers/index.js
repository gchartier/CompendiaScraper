require("dotenv").config()
const logger = require("../utils/logger.js")
const dbConnect = require("../database/dbConnect.js")
const scrapePreviewsWorldNewReleases = require("./previewsWorld/scraper.js")

module.exports = (async () => {
    try {
        await dbConnect()
        await scrapePreviewsWorldNewReleases()
    }
    catch(error) {
        logger.error(`! ${error.message}`)
        process.exit()
    }
    process.exit()
})()
