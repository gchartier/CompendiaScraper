const { infoLogger } = require("../utils/logger.js")
const comicModel = require("../models/comic.js")

async function insertComic(comicDoc) {
    const comicTitleQuery = await comicModel.findOne({ title: comicDoc.title })
    if (comicTitleQuery)
        infoLogger.warn(
            `! Comic: ${comicDoc.title} might already exist in the database as id = ${comicTitleQuery._id}`
        )
    await comicDoc.save()
    infoLogger.info(`+ New Comic: ${comicDoc.title} saved to database with id = ${comicDoc._id}`)
}

module.exports = insertComic
