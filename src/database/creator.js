const mongoose = require("mongoose")
const logger = require("../utils/logger.js")
const { creatorModel } = require("../models/creator.js")

async function updateExistingCreator(doc, query, comicID, comicTitle) {
    query.type = doc.type
    await query.save()
    logger.info(
        `+ Existing Creator: ${query.name} with id = ${query._id} updated with new creator type ${doc.type} in database`
    )

    if (query.entries.includes(comicID) === false) {
        query.entries.push(comicID)
        await query.save()
        logger.info(
            `+ Existing Creator: ${query.name} with id = ${query._id} updated with new comic entry ${comicTitle} with id = ${comicID} in database`
        )
    }
}

async function insertNewCreator(doc) {
    await doc.save()
    logger.info(`+ New Creator: ${doc.name} with id = ${doc._id} saved to database`)
}

async function insertOrUpdateCreator(creatorDoc, comicID, comicTitle) {
    const creatorQuery = await creatorModel.findOne({ name: creatorDoc.name })

    if (creatorQuery) await updateExistingCreator(creatorDoc, creatorQuery, comicID, comicTitle)
    else await insertNewCreator(creatorDoc)

    return creatorQuery ? creatorQuery._id : creatorDoc._id
}

async function insertOrUpdateCreators(comicDoc) {
    for (const creator of comicDoc.creators) {
        const newCreatorModel = new creatorModel({
            _id: new mongoose.Types.ObjectId(),
            name: creator.name,
            type: creator.type,
            entries: [comicDoc._id],
        })

        creator._id = await insertOrUpdateCreator(newCreatorModel, comicDoc._id, comicDoc.title)
    }
}

module.exports = insertOrUpdateCreators
