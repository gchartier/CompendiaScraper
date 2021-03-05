const $ = require("cheerio")
const axios = require("axios")
const sleep = require("../../utils/sleep")
const { infoLogger } = require("../../utils/logger.js")
const getCompiledComic = require("./compile/comic.js")
const toProperCasing = require("../../utils/toProperCasing")

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

    // Change to newReleaseLinks.length for prod
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
        throw new Error(`Failed HTML request to ${seriesLink} and could not retrieve series name`)

    return toProperCasing($(".Title", seriesNameHTML).text().slice(8))
}

async function getScrapedRelease(releaseLink, releaseFormat) {
    const baseURL = "https://www.previewsworld.com"
    const url = `${baseURL}${releaseLink}`

    infoLogger.info(`# Getting new release from ${url}`)
    await sleep(SLEEP_SECONDS)
    const { data: newReleaseResponse } = await axios.get(url)
    const scrapedRelease = {
        title: " " + $(".Title", newReleaseResponse).text() + " ",
        series: {
            name: await getScrapedSeriesName(
                baseURL + $(".ViewSeriesItemsLink", newReleaseResponse).attr("href")
            ),
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

    return await getCompiledComic(scrapedRelease)
}

async function getScrapedPreviewsWorldReleases() {
    infoLogger.info(`# Started retrieving Previews World new releases`)

    const releases = []
    const scrapedLinksAndFormats = await getScrapedReleaseLinksAndFormats()
    for (const [index, { link, format }] of scrapedLinksAndFormats.entries()) {
        releases.push(await getScrapedRelease(link, format))
        infoLogger.info(`# End of New Release ${index + 1} from ${link}`)
    }

    infoLogger.info(`# Finished retrieving Previews World new releases`)
    return releases
}

module.exports = getScrapedPreviewsWorldReleases
