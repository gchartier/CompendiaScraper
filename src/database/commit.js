const insertComic = require("./comic.js")
const insertOrUpdateSeries = require("./series.js")
const insertOrUpdateCreators = require("./creator.js")
const hostCoverAndGetURL = require("../utils/hostCoverAndGetURL.js")

async function commitComics(comics) {
    for (const comic of comics) {
        comic.seriesID = await insertOrUpdateSeries(comic)
        await insertOrUpdateCreators(comic)
        const coverURL = comic.cover
        comic.cover = ""
        const comicID = await insertComic(comic)
        const uploadedCover = await hostCoverAndGetURL(coverURL, comicID)
        // update comic cover in db
    }
}

module.exports = commitComics
