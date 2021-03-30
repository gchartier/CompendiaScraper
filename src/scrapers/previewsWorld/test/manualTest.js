const testComics = require("../../../../test/testComics")
const logger = require("../../../utils/logger")
const getParsedComic = require("../parse/comic")

module.exports = (() => {
    try {
        const comics = testComics
        logger.info("### BEGIN TEST DATA ###")
        comics.forEach((comic) => {
            console.log(getParsedComic(comic))
        })
        logger.info("### END TEST DATA ###")
    } catch (error) {
        logger.error(`! ${error.message}`)
    } finally {
        process.exit()
    }
})()
