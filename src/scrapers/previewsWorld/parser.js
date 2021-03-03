const $ = require("cheerio")
const axios = require("axios")
const sleep = require("../../utils/sleep.js")
const toProperCasing = require("../../utils/toProperCasing.js")

const SLEEP_SECONDS = 3

async function getSeriesName(seriesLink) {
    await sleep(SLEEP_SECONDS)
    const { data: seriesNameHTML } = await axios.get(seriesLink)
    if (!seriesNameHTML)
        throw new Error(`Failed HTML request to ${seriesLink} and could not retrieve series name`)

    return toProperCasing($(".Title", seriesNameHTML).text().slice(8))
}

async function getParsedComic(baseURL, url) {
    logger.info(`# Getting new release from ${url}`)
    await sleep(SLEEP_SECONDS)
    const { data: newReleaseResponse } = await axios.get(url)

    return {
        title: " " + $(".Title", newReleaseResponse).text() + " ",
        seriesName: await getSeriesName(
            baseURL + $(".ViewSeriesItemsLink", newReleaseResponse).attr("href")
        ),
        publisherName: toProperCasing($(".Publisher", newReleaseResponse).text()),
        releaseDate: $(".ReleaseDate", newReleaseResponse).text().slice(10),
        coverPrice: $(".SRP", newReleaseResponse).text().slice(6),
        currency: $(".SRP", newReleaseResponse).text().slice(5, 6),
        cover: baseURL + $(".mainContentImage .ImageContainer", newReleaseResponse).attr("href"),
        description: $("div.Text", newReleaseResponse)
            .first()
            .contents()
            .filter(() => this.type === "text")
            .text()
            .replace(/\s+/g, " ")
            .trim(),
        creators: $(".Creators", newReleaseResponse).text().replace(/\s+/g, " ").trim().split(" "),
        diamondID: $(".ItemCode", newReleaseResponse).text(),
    }
}

module.exports = getParsedComic
