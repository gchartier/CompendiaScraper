const logger = require("../utils/logger.js")

function isOnlyBaseCoverLetterVariant(comic) {
  return (
    comic.variantTypes.length === 1 &&
    comic.variantTypes[0] === "cvr" &&
    comic.coverLetter === "A"
  )
}

function isVariant(comic) {
  return (
    comic.variantTypes &&
    comic.variantTypes.length > 0 &&
    !isOnlyBaseCoverLetterVariant(comic) &&
    comic.variantDescription
  )
}

async function getComicsWithSameTitleNumberFormat(client, comic) {
  const query = `SELECT comic_id, is_variant_root, is_temp_variant_root 
    FROM comics WHERE series_id = $1 AND title = $2 AND item_number = $3 AND format = $4`
  const params = [comic.series.id, comic.title, comic.itemNumber, comic.format]
  const result = await client.query(query, params)
  return result.rows
}

function getExistingVariantRootComicID(comics) {
  const variantRoot = comics.filter((comic) => comic.is_variant_root !== null)
  if (variantRoot.length > 1) throw new Error(`! More than one variant root found`)
  if (variantRoot.length < 1)
    throw new Error(`! Could not find variant root of comics`)
  return variantRoot[0].comic_id
}

async function setVariantDetails(client, comic) {
  const matchingComics = await getComicsWithSameTitleNumberFormat(client, comic)
  if (matchingComics.length < 1) {
    comic.versionOf = null
    comic.isTempVariantRoot = isVariant(comic) ? true : false
    comic.isVariantRoot = true
    logger.warn(
      `! Comic marked as temp variant root. No comics found with same title, number and format`
    )
  } else if (matchingComics.length > 0) {
    comic.versionOf = getExistingVariantRootComicID(matchingComics)
    comic.isTempVariantRoot = false
    comic.isVariantRoot = false
  }
}

module.exports = { setVariantDetails }
