const insertComic = require("./comic.js")
const insertOrUpdateSeries = require("./series.js")
const parseCover = require("../utils/parseCover.js")
const insertOrUpdateCreators = require("./creator.js")

async function commitComics(comics) {
    for (const comic of comics) {
        //comic.seriesID = await insertOrUpdateSeries(comic)
        //await insertOrUpdateCreators(comic)
        const coverURL = comic.cover
        comic.cover = ""
        ///const comicID = await insertComic(comic)
        const uploadedCover = await parseCover(coverURL, Math.random())
        // update comic cover in db
    }
}

module.exports = commitComics
