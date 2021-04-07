const releases = require("./releases")
const logger = require("../src/utils/logger")
const { getParsedComic } = require("../src/scrapers/previewsWorld/parse/comic")

module.exports = (() => {
  try {
    logger.info("### BEGIN TEST DATA ###")
    releases.forEach((release) => {
      console.log(getParsedComic(release))
    })
    logger.info("### END TEST DATA ###")
  } catch (error) {
    logger.error(`! ${error.message}`)
  } finally {
    process.exit()
  }
})()
