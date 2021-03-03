require("dotenv").config()
const logger = require("../utils/logger.js")
const connect = require("../database/connect.js")
const commitComics = require("../database/commit.js")
const getScrapedPreviewsWorldReleases = require("./previewsWorld/scrape.js")

module.exports = (async () => {
    try {
        const comics = []

        await connect()
        comics.push.apply(comics, await getScrapedPreviewsWorldReleases())
        await commitComics(comics)
    }
    catch(error) {
        logger.error(`! ${error.message}`)
    }
    finally {
        process.exit()
    }
})()
