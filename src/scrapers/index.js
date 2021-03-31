require("dotenv").config()
const logger = require("../utils/logger.js")
const { writeReleasesToStagingFile } = require("../utils/stagedReleases.js")
const getScrapedPreviewsWorldReleases = require("./previewsWorld/scrape.js")

module.exports = (async () => {
    try {
        const releases = []
        releases.push.apply(releases, await getScrapedPreviewsWorldReleases())
        writeReleasesToStagingFile(releases)
    }
    catch (error) {
        logger.error(`! ${error.message}`)
    }
    finally {
        logger.on('finish', (info) => {
            process.exit()
        })
    }
})()
