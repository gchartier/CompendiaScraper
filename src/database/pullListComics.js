const logger = require("../utils/logger.js")
const { isOnlyCoverAVariant } = require("./variant.js")

function getPullListFilters(comic) {
  const pullListFilters = []
  if (comic.format === "Comic") {
    pullListFilters.push("include_single_issues = true")
  }
  if (comic.variantTypes && comic.variantTypes.includes("spr"))
    pullListFilters.push("include_subsequent_printings = true")
  if (comic.variantTypes && comic.variantTypes.includes("rpr"))
    pullListFilters.push("include_reprints = true")
  if (
    comic.variantTypes &&
    comic.variantTypes.includes("cvr") &&
    !isOnlyCoverAVariant(comic)
  )
    pullListFilters.push("include_cover_variants = true") //TODO finish this if

  return pullListFilters
}

async function getCollectionIDs(client, comic) {
  const pullListFilters = getPullListFilters(comic)
  const query = `SELECT collection_id FROM pull_list_series 
    WHERE series_id = $1 AND ((${pullListFilters}) OR include_all = true)`
}

async function commitPullListComics(client, comic) {
  await getCollectionIDs(client, comic)
}

module.exports = commitPullListComics
