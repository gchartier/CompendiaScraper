require("dotenv").config()
const commitSeries = require("./series.js")
const db = require("./connect.js").instance
const logger = require("../utils/logger.js")
const commitPublisher = require("./publisher.js")
const commitComic = require("./comic.js")
const commitCreators = require("./creator.js")
const { readReleasesFromStagingFile } = require("../utils/stagedReleases.js")

module.exports = (async () => {
    const client = await db.connect()
    if (client) logger.info("# Connected to DB")
    try {
        const comics = readReleasesFromStagingFile()
        for (const comic of comics) {
            try {
                comic.publisher.id = await commitPublisher(client, comic.publisher.name)
                comic.series.id = await commitSeries(client, comic.series.name, publisherID)
                comic.creators =
                    comic.creators && comic.creators.length > 0
                        ? await commitCreators(client, comic.creators)
                        : []
                comic.id = await commitComic(client, comic)
                await commitComicCreators(client, comic.creators, comic.id)
            } catch (error) {
                logger.error(
                    `! Error in commiting release with title ${comic.title} to DB: ${error.message}`
                )
            }
        }
    } catch (error) {
        logger.error(`! Error in commiting releases to DB: ${error.message}`)
    } finally {
        await client.end()
        await client.release()
        logger.info("# Disconnected from DB")
        process.exit()
    }
})()
