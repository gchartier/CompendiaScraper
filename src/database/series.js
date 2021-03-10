const mongoose = require("mongoose")
const logger = require("../utils/logger.js")
const seriesModel = require("../models/series.js")

async function updateExistingSeries(doc, query, comicID, comicTitle) {
    if (query.entries.includes(doc.entries[0]) === false) {
        query.entries.push(doc.entries[0])
        await query.save()
        logger.info(
            `+ Existing Series: ${seriesNameQuery.name} with id = ${seriesNameQuery._id} updated with new entry ${comicTitle} with id = ${comicID} in database`
        )
    }
}

async function insertNewSeries(seriesDoc) {
    await seriesDoc.save()
    logger.info(`+ New Series: ${seriesDoc.name} with id = ${seriesDoc._id} saved to database`)
}

async function insertOrUpdateSeries(comicDoc) {
    const seriesDoc = new seriesModel({
        _id: new mongoose.Types.ObjectId(),
        name: comicDoc.seriesName,
        entries: [comicDoc._id],
    })

    const seriesNameQuery = await seriesModel.findOne({ name: seriesDoc.name })
    if (seriesNameQuery)
        await updateExistingSeries(seriesDoc, seriesNameQuery, comicDoc._id, comicDoc.title)
    else await insertNewSeries(seriesDoc)
    return seriesNameQuery ? seriesNameQuery._id : seriesDoc._id
}

module.exports = insertOrUpdateSeries
