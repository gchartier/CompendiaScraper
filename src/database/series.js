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

async function insertNewSeries(doc) {
    await doc.save()
    logger.info(`+ New Series: ${doc.name} with id = ${doc._id} saved to database`)
}

async function insertOrUpdateSeries(seriesDoc, comicTitle, comicID) {
    const seriesNameQuery = await seriesModel.findOne({ name: seriesDoc.name })
    if (seriesNameQuery) updateExistingSeries(seriesDoc, seriesNameQuery, comicID, comicTitle)
    else insertNewSeries(seriesDoc)
    return seriesNameQuery ? seriesNameQuery._id : seriesDoc._id
}

module.exports = insertOrUpdateSeries
