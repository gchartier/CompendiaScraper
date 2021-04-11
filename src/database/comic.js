const logger = require("../utils/logger.js")
const parseCover = require("../utils/parseCover.js")
const { getVariantDetails, updateExistingVariants } = require("./variant.js")

async function insertComicAndGetID(client, comic) {
  const insert = `INSERT INTO comics(age_rating, cover_letter, cover_price, description, diamond_id, format, 
        is_mini_series, is_one_shot, is_temp_variant_root, is_variant_root, item_number, mini_series_limit, printing, 
        release_date, series_id, solicitation_date, subtitle, title, variant_description, variant_types, version_of) 
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
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
    comic.isTempVariantRoot,
    comic.isVariantRoot,
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
    comic.versionOf
  ]
  const result = await client.query(insert, params)
  if (result.rows.length < 1) logger.error("! Comic was not inserted into DB")
  else logger.info(`# Inserted new comic into DB`)
  return result.rows[0].comic_id
}

async function getComicCoverURL(comic) {
  return await parseCover(comic.cover, comic.id)
}

async function updateComicCover(client, comic) {
  const update = `UPDATE comics SET cover = $1 WHERE comic_id = $2 RETURNING comic_id`
  const params = [comic.cover, comic.id]
  const result = await client.query(update, params)
  if (result.rows.length < 1)
    logger.error(`! Could not update cover for comic with ID ${comic.id}`)
}

async function commitComic(client, comic) {
  const {
    versionOf,
    isVariantRoot,
    isTempVariantRoot,
    existingVariantRootID
  } = await getVariantDetails(client, comic)
  comic.versionOf = versionOf
  comic.isVariantRoot = isVariantRoot
  comic.isTempVariantRoot = isTempVariantRoot
  comic.id = await insertComicAndGetID(client, comic)
  //comic.cover = await getComicCoverURL(comic)
  await updateComicCover(client, comic)
  if (comic.isVariantRoot && existingVariantRootID !== null)
    await updateExistingVariants(client, comic.id, existingVariantRootID)
  return comic.id
}

module.exports = commitComic
