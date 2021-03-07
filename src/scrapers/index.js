require("dotenv").config()
const connect = require("../database/connect.js")
const commitComics = require("../database/commit.js")
const { infoLogger } = require("../utils/logger.js")
const getScrapedPreviewsWorldReleases = require("./previewsWorld/scrape.js")

module.exports = (async () => {
    try {
        const comics = []

        await connect()
        comics.push.apply(comics, await getScrapedPreviewsWorldReleases())
        //await commitComics(comics)
    }
    catch(error) {
        infoLogger.error(`! ${error.message}`)
    }
    finally {
        process.exit()
    }
})()
