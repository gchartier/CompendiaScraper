const logger = require("../utils/logger")

async function getExistingSeriesIDByName(client, seriesName, isGraphicNovelSeries) {
    const query = `SELECT series_id, is_graphic_novel_series FROM series WHERE name = $1`
    const params = [seriesName]
    const result = await client.query(query, params)
    if (result.rows.length > 1)
        throw new Error(`! More than one series was found with name ${seriesName}`)
    if (result.rows.length === 1 && result.rows[0].is_graphic_novel_series !== isGraphicNovelSeries)
        throw new Error(`! Graphic novel series mismatch, this needs to be manually reviewed`)
    return result.rows.length === 1 ? result.rows[0].series_id : null
}

async function insertNewSeriesAndGetID(client, seriesName, publisherID, isGraphicNovelSeries) {
    const insert = `INSERT INTO series(name, publisher_id, is_graphic_novel_series) VALUES($1, $2, $3) RETURNING series_id`
    const params = [seriesName, publisherID, isGraphicNovelSeries]
    const result = await client.query(insert, params)
    if (result.rows.length < 1) throw new Error("! Series was not inserted into DB")
    logger.info(`# Inserted new series to DB with name ${seriesName}`)
    return result.rows[0].series_id
}

async function commitSeries(client, seriesName, publisherID, isGraphicNovelSeries) {
    if (!seriesName) throw new Error(`! Series name "${seriesName}" was not valid`)
    if (!publisherID) throw new Error(`! Publisher ID "${publisherID}" was not valid`)
    const seriesID = await getExistingSeriesIDByName(client, seriesName, isGraphicNovelSeries)
    return seriesID
        ? seriesID
        : await insertNewSeriesAndGetID(client, seriesName, publisherID, isGraphicNovelSeries)
}

module.exports = commitSeries
