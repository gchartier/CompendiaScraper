const logger = require("../utils/logger.js")

function getVariantFilters(comic) {
  const variantFilters = []
  if (comic.variantTypes) {
    if (comic.variantTypes.includes("spr"))
      variantFilters.push("include_subsequent_printings = true")
    if (comic.variantTypes.includes("rpr"))
      variantFilters.push("include_reprints = true")
    if (
      comic.variantTypes.includes("cvr") ||
      (comic.variantTypes.includes("cvl") &&
        !(comic.coverLetter === "A" && comic.isVariantRoot))
    )
      variantFilters.push("include_cover_variants = true")
  }

  return variantFilters
}

function getFormatFilters(comic) {
  const formatFilters = []
  if (comic.format === "Single Issue")
    formatFilters.push("include_single_issues = true")
  else if (comic.format === "Trade Paperback")
    formatFilters.push("include_tpbs = true")
  else if (comic.format === "Hardcover")
    formatFilters.push("include_hardcovers = true")
  else if (comic.format === "Omnibus" || comic.format === "Omnibus Hardcover")
    formatFilters.push("include_omnibuses = true")
  else if (comic.format === "Compendium" || comic.format === "Compendium Hardcover")
    formatFilters.push("include_compendia = true")
  else if (
    comic.format === "Graphic Novel" ||
    comic.format === "Graphic Novel Hardcover"
  )
    formatFilters.push("include_graphic_novels = true")

  return formatFilters
}

function getPullListFilters(comic) {
  const pullListFilters = []
  pullListFilters.push.apply(pullListFilters, getFormatFilters(comic))
  pullListFilters.push.apply(pullListFilters, getVariantFilters(comic))
  return `(${
    pullListFilters && pullListFilters.length > 0
      ? `(${pullListFilters.join(" AND ")}) OR include_all = true`
      : "include_all = true"
  })`
}

async function getCollectionIDs(client, comic) {
  const pullListFilters = getPullListFilters(comic)
  const query = `SELECT collection_id FROM pull_list_series 
    WHERE series_id = $1 AND $2`
  const params = [comic.series.id, pullListFilters]
  const result = await client.query(query, params)
  return result.rows
}

function getInsertValues(collectionIDs, comicID) {
  return collectionIDs.map((id) => `(${id}, ${comicID})`).join(", ")
}

async function insertPullListComics(client, insertValues) {
  const insert = `INSERT INTO pull_list_comics (collection_id, comic_id) VALUES $1 RETURNING pull_list_comic_id`
  const params = [insertValues]
  const result = await client.query(insert, params)
  if (result.rows < 1)
    logger.warn(`! Expected to insert pull list comics but did not`)
}

async function commitPullListComics(client, comic) {
  const collectionIDs = await getCollectionIDs(client, comic)
  const insertValues = getInsertValues(collectionIDs, comic.id)
  if (insertValues) await insertPullListComics(client, insertValues)
}

module.exports = commitPullListComics
