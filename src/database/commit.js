require("dotenv").config()
const commitComic = require("./comic.js")
const db = require("./connect.js").instance
const commitSeries = require("./series.js")
const logger = require("../utils/logger.js")
const commitCreators = require("./creator.js")
const commitPublisher = require("./publisher.js")
const commitComicCreators = require("./comicCreators.js")
const { readReleasesFromStagingFile } = require("../utils/stagedReleases.js")

module.exports = (async () => {
    const client = await db.connect()
    if (client) logger.info("### Connected to DB\n")
    try {
        const comics = readReleasesFromStagingFile()
        logger.info(`### Started committing releases\n`)
        for (const [index, comic] of comics.entries()) {
            logger.info(`# Started committing release ${index + 1} of ${comics.length}`)
            try {
                comic.publisher.id = await commitPublisher(client, comic.publisher.name)
                comic.series.id = await commitSeries(
                    client,
                    comic.series.name,
                    comic.publisher.id,
                    comic.format === "Graphic Novel" || comic.format === "Graphic Novel Hardcover"
                )
                comic.creators =
                    comic.creators && comic.creators.length > 0
                        ? await commitCreators(client, comic.creators)
                        : []
                comic.id = await commitComic(client, comic)
                await commitComicCreators(client, comic.creators, comic.id)
            } catch (error) {
                logger.error(
                    `! Error in commiting release with title ${comic.title} to DB: ${error.message}\n`
                )
            }
            logger.info(`# Finished committing release ${index + 1} of ${comics.length}\n`)
        }
        logger.info(`### Finished committing releases\n`)
    } catch (error) {
        logger.error(`! Error in commiting releases to DB: ${error.message}\n`)
    } finally {
        await client.end()
        await client.release()
        logger.info("### Disconnected from DB")
        process.exit()
    }
})()
