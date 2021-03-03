const $ = require("cheerio")
const axios = require("axios")
const mongoose = require("mongoose")
const getParsedComic = require("./parser.js")
const getCompiledComic = require("./compiler/comic.js")
const logger = require("../../utils/logger.js")
const seriesModel = require("../../models/series.js")
const insertComic = require("../../database/comic.js")
const insertOrUpdateSeries = require("../../database/series.js")

async function getNewReleaseLinksAndFormats() {
    const newReleasesURL = "https://www.previewsworld.com/NewReleases"
    const { data: newReleasesResponse } = await axios.get(newReleasesURL)
    const newReleaseLinks = $(
        '.nrGalleryItem[dmd-cat="1"] .nrGalleryItemDmdNo a, .nrGalleryItem[dmd-cat="3"] .nrGalleryItemDmdNo a',
        newReleasesResponse
    )
    const newReleaseFormats = $(
        '.nrGalleryItem[dmd-cat="1"], .nrGalleryItem[dmd-cat="3"]',
        newReleasesResponse
    )

    if (newReleaseLinks.length !== newReleaseFormats.length)
        throw new Error("Retrieved links and formats do not have equal lengths")

    // Change to newReleaseLinks.length for prod
    const linksAndFormats = []
    for (let i = 0; i < 1; i++)
        linksAndFormats.push({
            link: newReleaseLinks[i].attribs.href,
            format: newReleaseFormats[i],
        })

    return linksAndFormats
}

async function scrapeNewRelease(releaseLink, releaseFormat) {
    const baseURL = "https://www.previewsworld.com"
    const newReleaseURL = `${baseURL}${releaseLink}`
    logger.info(`# Getting new release from ${newReleaseURL}`)

    const comic = await getParsedComic(baseURL, newReleaseURL)
    const compiledComic = await getCompiledComic(comic, $(releaseFormat).attr("dmd-cat"))
    const series = new seriesModel({
        _id: new mongoose.Types.ObjectId(),
        name: compiledComic.seriesName,
        entries: [compiledComic._id],
    })
    compiledComic.seriesID = await insertOrUpdateSeries(
        series,
        compiledComic.title,
        compiledComic._id
    )

    await insertComic(compiledComic)
}

async function scrapePreviewsWorldNewReleases() {
    logger.info(`# Started retrieving Previews World new releases`)

    const linksAndFormats = await getNewReleaseLinksAndFormats()
    for (const { link, format } of linksAndFormats) {
        await scrapeNewRelease(link, format)
        logger.info(`# End of New Release ${link}`)
    }

    logger.info(`# Finished retrieving Previews World new releases`)
}

module.exports = scrapePreviewsWorldNewReleases
