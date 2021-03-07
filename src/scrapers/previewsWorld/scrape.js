const $ = require("cheerio")
const axios = require("axios")
const sleep = require("../../utils/sleep")
const getCompiledComic = require("./compile/comic.js")
const toProperCasing = require("../../utils/toProperCasing")
const { infoLogger, dataLogger } = require("../../utils/logger.js")

const SLEEP_SECONDS = 5

async function getScrapedReleaseLinksAndFormats() {
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

    const linksAndFormats = []
    for (let i = 0; i < newReleaseLinks.length; i++)
        linksAndFormats.push({
            link: newReleaseLinks[i].attribs.href,
            format: newReleaseFormats[i],
        })

    return linksAndFormats
}

async function getScrapedSeriesName(seriesLink) {
    await sleep(SLEEP_SECONDS)
    const { data: seriesNameHTML } = await axios.get(seriesLink)
    if (!seriesNameHTML)
        infoLogger.warn(`! Failed HTML request to ${seriesLink} and could not retrieve series name`)

    return toProperCasing($(".Title", seriesNameHTML).text().slice(8))
}

async function getScrapedRelease(releaseLink, releaseFormat) {
    const baseURL = "https://www.previewsworld.com"
    const url = `${baseURL}${releaseLink}`

    infoLogger.info(`# Getting new release from ${url}`)
    await sleep(SLEEP_SECONDS)
    const { data: newReleaseResponse } = await axios.get(url)

    const title = " " + $(".Title", newReleaseResponse).text() + " "
    const seriesLink = $(".ViewSeriesItemsLink", newReleaseResponse).attr("href")
    const seriesName = seriesLink ? await getScrapedSeriesName(baseURL + seriesLink) : ""
    if (!seriesLink)
        infoLogger.warn(
            "! Could not retrieve series name from series link. Series name will be retrieved from title."
        )

    dataLogger.info(`# Scraped from ${url} with title ${title}:`)

    const scrapedRelease = {
        title: title,
        series: {
            name: seriesName,
            link: seriesLink,
        },
        publisher: { name: toProperCasing($(".Publisher", newReleaseResponse).text()) },
        releaseDate: $(".ReleaseDate", newReleaseResponse).text().slice(10),
        coverPrice: $(".SRP", newReleaseResponse).text().slice(5),
        cover: baseURL + $(".mainContentImage .ImageContainer", newReleaseResponse).attr("href"),
        description: $("div.Text", newReleaseResponse)
            .first()
            .contents()
            .filter(function () {
                return this.type === "text"
            })
            .text()
            .replace(/\s+/g, " ")
            .trim(),
        creators: $(".Creators", newReleaseResponse).text().replace(/\s+/g, " ").trim().split(" "),
        diamondID: $(".ItemCode", newReleaseResponse).text(),
        format: releaseFormat === 1 ? "Comic" : "",
    }

    const compiledComic = await getCompiledComic(scrapedRelease)
    dataLogger.info(JSON.stringify(compiledComic, null, " "))
    infoLogger.info(`# Finished new release from ${url}`)

    return compiledComic
}

async function getScrapedPreviewsWorldReleases() {
    infoLogger.info(`# Started retrieving Previews World new releases`)

    const releases = []
    const scrapedLinksAndFormats = await getScrapedReleaseLinksAndFormats()
    for (const { link, format } of scrapedLinksAndFormats)
        releases.push(await getScrapedRelease(link, format))

    infoLogger.info(`# Finished retrieving Previews World new releases`)
    return releases
}

module.exports = getScrapedPreviewsWorldReleases
