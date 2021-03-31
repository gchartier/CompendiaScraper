const SLEEP_SECONDS = 4
const $ = require("cheerio")
const axios = require("axios")
const patterns = require("./patterns")
const sleep = require("../../utils/sleep")
const logger = require("../../utils/logger.js")
const getParsedComic = require("./parse/comic.js")
const convertToProperCasing = require("../../utils/convertToProperCasing")

async function getScrapedReleaseLinksAndFormats() {
    const newReleasesURL = "https://www.previewsworld.com/NewReleases"
    const { data: newReleasesResponse } = await axios.get(newReleasesURL)
    const newReleaseLinks = $(
        '.nrGalleryItem[dmd-cat="1"] .nrGalleryItemDmdNo a, .nrGalleryItem[dmd-cat="3"] .nrGalleryItemDmdNo a',
        newReleasesResponse
    ).toArray()
    const newReleaseFormats = $(
        '.nrGalleryItem[dmd-cat="1"], .nrGalleryItem[dmd-cat="3"]',
        newReleasesResponse
    ).map((i, el) => $(el).attr("dmd-cat"))

    if (newReleaseLinks.length !== newReleaseFormats.length)
        throw new Error("! Retrieved links and formats do not have equal lengths")

    const linksAndFormats = newReleaseLinks.map((link, index) => {
        return { link: link.attribs.href, format: newReleaseFormats[index] }
    })

    return linksAndFormats
}

async function getScrapedSeriesName(seriesLink) {
    await sleep(SLEEP_SECONDS)
    const { data: seriesNameHTML } = await axios.get(seriesLink)
    if (!seriesNameHTML)
        logger.warn(`! Failed request to ${seriesLink} and could not retrieve series name`)
    logger.info(`# Scraped series from ${seriesLink}`)
    let seriesName = $(".Title", seriesNameHTML).text()
    const seriesIndicator = seriesName.match(patterns.seriesIndicator)
    if (seriesIndicator === null)
        logger.warn(
            `! Expected series indicator in scraped series name, there may be an error in series name parsing`
        )
    else seriesName = seriesName.replace(seriesIndicator, "")
    return seriesName
}

async function getScrapedRelease(releaseLink, releaseFormat) {
    const baseURL = "https://www.previewsworld.com"
    const url = `${baseURL}${releaseLink}`
    await sleep(SLEEP_SECONDS)
    const { data: newReleaseResponse } = await axios.get(url)
    const title = $(".Title", newReleaseResponse).text()
    const seriesLink = $(".ViewSeriesItemsLink", newReleaseResponse).attr("href")
    const seriesName = seriesLink ? `${await getScrapedSeriesName(baseURL + seriesLink)}` : ""
    if (!seriesLink || !seriesName)
        logger.warn(
            "! Could not retrieve series name from series link. Series name will be retrieved from title."
        )
    logger.info(`# Scraped ${url} with title ${title}\n`)

    const scrapedRelease = {
        link: url,
        title: title,
        series: {
            name: seriesName,
            link: seriesLink,
        },
        publisher: { name: convertToProperCasing($(".Publisher", newReleaseResponse).text()) },
        releaseDate: $(".ReleaseDate", newReleaseResponse).text().slice(10),
        coverPrice: $(".SRP", newReleaseResponse).text().slice(5),
        coverURL: baseURL + $(".mainContentImage .ImageContainer", newReleaseResponse).attr("href"),
        description: $("div.Text", newReleaseResponse)
            .first()
            .contents()
            .filter((i, el) => el.type === "text")
            .text()
            .replace(/\s+/g, " ")
            .trim(),
        creators: $(".Creators", newReleaseResponse).text().replace(/\s+/g, " ").trim().split(" "),
        diamondID: $(".ItemCode", newReleaseResponse).text(),
        format: releaseFormat === 1 ? "Comic" : "",
    }

    return scrapedRelease
}

function filterOutReleasesWithFlaggedPublishers(releases) {
    const flaggedPublishers = [
        "DESIGN STUDIO PRESS",
        "DIGITAL MANGA DISTRIBUTION",
        "DYNAMIC FORCES",
        "FANFARE PRESENTS PONENT MON",
        "GHOST SHIP",
        "J-NOVEL CLUB",
        "J-NOVEL HEART",
        "JY",
        "KODANSHA AMERICA",
        "KODANSHA COMICS",
        "ONE PEACE BOOKS",
        "PIE INTERNATIONAL",
        "SEVEN SEAS ENTERTAINMENT LLC",
        "SQUARE ENIX MANGA",
        "SUBLIME",
        "TOHAN CORPORATION",
        "TOKYOPOP",
        "UDON ENTERTAINMENT INC",
        "VERTICAL COMICS",
        "VIZ LLC",
        "YEN ON",
        "YEN PRESS",
    ]

    const filteredReleases = releases.filter(
        (release) => flaggedPublishers.includes(release.publisher.name.toUpperCase()) === false
    )

    logger.info(
        `### Filtered out ${
            releases.length - filteredReleases.length
        } releases with flagged publishers.\n`
    )

    return filteredReleases
}

async function getScrapedPreviewsWorldReleases() {
    logger.info(`### Started Previews World scraper\n`)

    const scrapedLinksAndFormats = await getScrapedReleaseLinksAndFormats()
    const scrapedReleases = []

    logger.info(`### Started scraping releases\n`)
    for (const [index, { link, format }] of scrapedLinksAndFormats.entries()) {
        logger.info(`# Started scraping release ${index + 1} of ${scrapedLinksAndFormats.length}`)
        scrapedReleases.push(await getScrapedRelease(link, format))
        logger.info(
            `# Finished scraping release ${index + 1} of ${scrapedLinksAndFormats.length}\n`
        )
    }
    logger.info(`### Finished scraping releases\n`)

    const filteredScrapedReleases = filterOutReleasesWithFlaggedPublishers(scrapedReleases)
    const releases = []
    logger.info(`### Started parsing releases\n`)
    filteredScrapedReleases.forEach((release, index) => {
        try {
            logger.info(`# Parsing release ${index + 1} of ${filteredScrapedReleases.length}`)
            const parsedRelease = getParsedComic(release)
            parsedRelease._releaseNumber = index + 1
            if (parsedRelease.filterOut) logger.info("# Filtered out this release.")
            else releases.push(parsedRelease)
            logger.info(
                `# Finished parsing release ${index + 1} of ${filteredScrapedReleases.length} \n`
            )
        } catch (error) {
            logger.error(
                `! Error occurred while parsing comic from ${release.link}: ${error.message}\n`
            )
        }
    })
    logger.info(`### Finished parsing releases\n`)

    logger.info(`### Finished Previews World scraper\n`)
    return releases
}

module.exports = getScrapedPreviewsWorldReleases
