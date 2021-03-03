const mongoose = require("mongoose")
const logger = require("../utils/logger.js")
const comicModel = require("../models/comic.js")
const insertOrUpdateCreator = require("./creator.js")
const { creatorModel } = require("../models/creator.js")

async function insertOrUpdateCreators(doc) {
    for (const creator of doc.creators) {
        const newCreatorModel = new creatorModel({
            _id: new mongoose.Types.ObjectId(),
            name: creator.name,
            type: creator.type,
            entries: [doc._id],
        })

        creator._id = await insertOrUpdateCreator(newCreatorModel, doc._id, doc.title)
    }
}

async function insertComic(comicDoc) {
    await insertOrUpdateCreators(comicDoc)
    const comicTitleQuery = await comicModel.findOne({ title: comicDoc.title })
    if (comicTitleQuery)
        logger.warn(
            `! Comic: ${comicDoc.title} might already exist in the database as id = ${comicTitleQuery._id}`
        )
    await comicDoc.save()
    logger.info(`+ New Comic: ${comicDoc.title} saved to database with id = ${comicDoc._id}`)
}

module.exports = insertComic
