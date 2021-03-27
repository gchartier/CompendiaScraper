const logger = require("../utils/logger")

async function insertComicAndGetID(
    client,
    {
        ageRating,
        coverLetter,
        coverPrice,
        description,
        diamondID,
        format,
        isMiniSeries,
        isOneShot,
        itemNumber,
        miniSeriesLimit,
        printingNumber,
        releaseDate,
        series,
        solicitationDate,
        subtitle,
        title,
        variantType,
        variantDescription,
    }
) {
    const insert = `INSERT INTO comics(age_rating, cover_letter, cover_price, description, diamond_id, format, 
        is_mini_series, is_one_shot, item_number, mini_series_limit, printing, release_date, series_id, 
        solicitation_date, subtitle, title, variant_description, variant_type, version_of) 
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`
    const params = [
        ageRating,
        coverLetter,
        coverPrice,
        description,
        diamondID,
        format,
        isMiniSeries,
        isOneShot,
        itemNumber,
        miniSeriesLimit,
        printingNumber,
        releaseDate,
        series.ID,
        solicitationDate,
        subtitle,
        title,
        variantDescription,
        variantType,
        versionOf,
    ]
    const result = await client.query(insert, params)
    if (result.rows.length !== 1 || !result.rows[0].creator_id)
        throw new Error("Creator was not inserted")
    logger.info(`# Inserted new creator to database with name ${creatorName}`)
    return result.rows[0].creator_id
}

module.exports = insertComicAndGetID
