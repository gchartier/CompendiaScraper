require("dotenv").config()
const getSeriesID = require("./series.js")
const db = require("./connect.js").instance
const logger = require("../utils/logger.js")
const getPublisherID = require("./publisher.js")
const insertComicAndGetID = require("./comic.js")
const getCreatorsWithIDs = require("./creator.js")
const { readReleasesFromStagingFile } = require("../utils/stagedReleases.js")

module.exports = (async () => {
    const client = await db.connect()
    if (client) logger.info("# Connected to DB")
    try {
        const comics = readReleasesFromStagingFile()
        for (const comic of comics) {
            const publisherID = await getPublisherID(client, comic.publisher.name)
            const seriesID = await getSeriesID(client, comic.series.name, publisherID)
            comic.series.ID = seriesID
            const creators =
                comic.creators && comic.creators.length > 0
                    ? await getCreatorsWithIDs(client, comic.creators)
                    : []
            comic.creators = creators
            const comicID = await insertComicAndGetID(client, comic)
            //const coverURL = comic.cover
            // comic.cover = ""
            // const uploadedCover = await parseCover(coverURL, Math.random())
            // update comic cover in db
        }
    } catch (error) {
        logger.error(`! Error in commiting to DB: ${error}`)
    } finally {
        await client.end()
        await client.release()
        process.exit()
    }
})()
