const logger = require("../utils/logger")

function getExistingVersionOf(comics) {
    const comicMatchesFound = comics.filter((comic) => comic.version_of !== null)
    return comicMatchesFound.length > 0 ? comicMatchesFound[0].version_of : null
}

function getBaseComicID(comics) {
    const baseComicMatches = comics.filter(
        (comic) =>
            comic.printing === 1 &&
            (comic.cover_letter === "A" || comic.cover_letter === "") &&
            comic.variant_type === null &&
            comic.variant_description === ""
    )
    if (baseComicMatches.length > 1)
        logger.error(
            `! More than one potential base comic was found when searching for version_of ID for comic with ID ${comic.id}`
        )
    if (baseComicMatches.length === 0)
        throw new Error(
            `! Base comic was not found when searching for version_of ID for comic with ID of ${comic.id}`
        )
    return baseComicMatches[0].comic_id
}

async function getVersionOf(client, comic) {
    const query = `SELECT comic_id, printing, version_of, variant_type, cover_letter, variant_description, subtitle 
    FROM comics WHERE title = $1 AND item_number = $2 AND series_id = $3`
    const params = [comic.title, comic.itemNumber, comic.series.id]
    const result = await client.query(query, params)
    const foundComics = result.rows
    const existingVersionOf = getExistingVersionOf(foundComics)

    return existingVersionOf !== null ? existingVersionOf : getBaseComicID(comic, foundComics)
}

async function insertComicAndGetID(client, comic) {
    const insert = `INSERT INTO comics(age_rating, cover_letter, cover_price, description, diamond_id, format, 
        is_mini_series, is_one_shot, item_number, mini_series_limit, printing, release_date, series_id, 
        solicitation_date, subtitle, title, variant_description, variant_types, version_of) 
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING comic_id`
    const params = [
        comic.ageRating,
        comic.coverLetter,
        comic.coverPrice,
        comic.description,
        comic.diamondID,
        comic.format,
        comic.isMiniSeries,
        comic.isOneShot,
        comic.itemNumber,
        comic.miniSeriesLimit,
        comic.printingNumber,
        comic.releaseDate,
        comic.series.id,
        comic.solicitationDate,
        comic.subtitle,
        comic.title,
        comic.variantDescription,
        comic.variantTypes,
        comic.versionOf,
    ]
    const result = await client.query(insert, params)
    if (result.rows.length < 1) logger.error("! Comic was not inserted into DB")
    else logger.info(`# Inserted new comic into DB`)
    return result.rows[0].comic_id
}

async function getComicCoverURL(comic) {
    await parseCover(comic.cover, comic.id)
}

async function updateComicCover(client, comic) {
    const update = `UPDATE comics SET cover = $1 WHERE comic_id = $2 RETURNING comic_id`
    const params = [comic.cover, comic.id]
    const result = await client.query(update, params)
    if (result.rows.length < 1)
        logger.error(`! Could not update cover for comic with ID ${comic.id}`)
}

async function commitComic(client, comic) {
    comic.versionOf = comic.versionType ? await getVersionOf(client, comic) : null
    comic.id = await insertComicAndGetID(client, comic)
    comic.cover = await getComicCoverURL(comic)
    await updateComicCover(client, comic)
    return comic.id
}

module.exports = commitComic
