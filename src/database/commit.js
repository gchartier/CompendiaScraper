const insertComic = require("./comic.js")
const insertOrUpdateSeries = require("./series.js")
const insertOrUpdateCreators = require("./creator.js")

async function commitComics(comics) {
    for (const comic of comics) {
        comic.seriesID = await insertOrUpdateSeries(comic)
        await insertOrUpdateCreators(comic)
        await insertComic(comic)
    }
}

module.exports = commitComics
