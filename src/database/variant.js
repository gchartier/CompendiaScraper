const logger = require("../utils/logger.js")

function isOnlyCoverAVariant(comic) {
  return (
    comic.variantTypes &&
    comic.variantTypes.length === 1 &&
    comic.variantTypes[0] === "cvl" &&
    comic.coverLetter === "A"
  )
}

function isVariant(comic) {
  return (
    comic.variantTypes &&
    comic.variantTypes.length > 0 &&
    !isOnlyCoverAVariant(comic)
  )
}

function getComicsWithCamelCasedProperties(comics) {
  return comics.map((comic) => {
    return {
      id: comic.comic_id,
      isVariantRoot: comic.is_variant_root,
      isTempVariantRoot: comic.is_temp_variant_root,
      coverLetter: comic.cover_letter,
      variantTypes: comic.variant_types
    }
  })
}

async function getComicsWithSameTitleNumberFormat(client, comic) {
  const query = `SELECT comic_id, cover_letter, variant_types, is_variant_root, is_temp_variant_root 
    FROM comics WHERE series_id = $1 AND title = $2 AND item_number = $3 AND format = $4`
  const params = [comic.series.id, comic.title, comic.itemNumber, comic.format]
  const result = await client.query(query, params)
  return getComicsWithCamelCasedProperties(result.rows)
}

function getVariantRootComic(comics) {
  const variantRoot = comics.filter((comic) => comic.isVariantRoot === true)
  if (variantRoot.length > 1) throw new Error(`! More than one variant root found`)
  if (variantRoot.length < 1)
    throw new Error(`! Could not find variant root of comics`)
  return variantRoot[0]
}

function isBaseComic(comic) {
  return !isVariant(comic) && !isOnlyCoverAVariant(comic)
}

function comicShouldBeVariantRoot(comic, variantRoot) {
  const isVariantRootAVariant = isVariant(variantRoot)
  const isVariantRootOnlyCoverA = isOnlyCoverAVariant(variantRoot)
  const isComicOnlyCoverA = isOnlyCoverAVariant(comic)
  const isVariantRootBaseComic = isBaseComic(variantRoot)
  const isComicBaseComic = isBaseComic(comic)

  if (isVariantRootBaseComic && isComicBaseComic)
    throw new Error("! Both the variant root and new variant are base comics")
  if (isVariantRootOnlyCoverA && isComicOnlyCoverA)
    throw new Error(
      "! Both the variant root and new variant are cover A variant comics"
    )

  return (
    (isComicBaseComic && !isVariantRootBaseComic) ||
    (isComicOnlyCoverA && isVariantRootAVariant)
  )
}

async function updateExistingVariants(client, comicID, variantRootID) {
  const query = `UPDATE comics SET version_of = $1, is_variant_root = $2, is_temp_variant_root = $2
      WHERE version_of = $3 OR comic_id = $3 RETURNING comic_id`
  const params = [comicID, false, variantRootID]
  const result = await client.query(query, params)
  if (result.rows.length < 1)
    logger.warn("! Expected to have updated existing variants but none were updated")
}

async function getVariantDetails(client, comic) {
  const variantDetails = {}
  const matchingComics = await getComicsWithSameTitleNumberFormat(client, comic)
  if (matchingComics.length < 1) {
    variantDetails.existingVariantRootID = null
    variantDetails.versionOf = null
    variantDetails.isTempVariantRoot = isVariant(comic) ? true : false
    variantDetails.isVariantRoot = true
    if (variantDetails.isTempVariantRoot)
      logger.warn(
        `! Comic marked as temp variant root. No comics found with same title, number and format`
      )
  } else if (matchingComics.length > 0) {
    const variantRoot = getVariantRootComic(matchingComics)
    variantDetails.existingVariantRootID = variantRoot.id
    if (comicShouldBeVariantRoot(comic, variantRoot)) {
      variantDetails.versionOf = null
      variantDetails.isTempVariantRoot = false
      variantDetails.isVariantRoot = true
    } else {
      variantDetails.versionOf = variantRoot.id
      variantDetails.isTempVariantRoot = false
      variantDetails.isVariantRoot = false
    }
  }

  return variantDetails
}

module.exports = { getVariantDetails, updateExistingVariants, isOnlyCoverAVariant }
