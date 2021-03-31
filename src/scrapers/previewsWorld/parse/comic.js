const {
    getTitleAsPaddedArray,
    getStringFromPaddedArray,
    removeSegmentFromTitle,
} = require("./util.js")
const {
    getCoverLetterFromTitle,
    getVariantTypesFromTitle,
    parseVariantDescriptionFromTitle,
} = require("./variant.js")
const { format } = require("date-fns")
const patterns = require("../patterns.js")
const logger = require("../../../utils/logger.js")
const getParsedCreatorsFromNodes = require("./creator.js")
const { parseSubtitleFromTitle } = require("./subtitle.js")
const convertToProperCasing = require("../../../utils/convertToProperCasing.js")
const getMonthFromAbbreviation = require("../../../utils/getMonth.js")

function getParsedPublisher(publisher) {
    if (!publisher)
        logger.error("! No publisher found from parsed data. Manual addition of publisher needed.")

    return { id: null, name: publisher && publisher.name ? publisher.name : null }
}

function prepareTitleForParsing(title) {
    return ` ${title.replace(patterns.spacesBeginningAndEnd, "").replace(patterns.spaces, " ")} `
}

function getSolicitDateFromDiamondID(diamondID) {
    let solicitationDate = null
    if (!diamondID || diamondID.length < 5)
        logger.error(`! Could not get the the solicitation date from Diamond ID`)
    else {
        const solicitationTag = diamondID.slice(0, 5)
        solicitationDate = `${getMonthFromAbbreviation(
            solicitationTag.slice(0, 3)
        )} 20${solicitationTag.slice(3)}`
    }

    return solicitationDate
}

function getPrintingNumberFromTitle(title) {
    const printingNums = []
    const reprintMatch = title.match(patterns.reprint)
    const subPrintingNumMatch = title.match(patterns.subsequentPrintingNum)
    if (reprintMatch === null && subPrintingNumMatch !== null) {
        const titleParts = title.split(" ").map((part) => ` ${part} `)
        titleParts.forEach((part, index) => {
            if (index > 0 && part.match(patterns.subsequentPrinting))
                printingNums.push(titleParts[index - 1].match(/\d+/g))
        })
        if (printingNums.length < 1)
            logger.error("! Expected printing numbers from title but didn't find any")
    }
    const printingNum = printingNums.reduce((acc, curr) => acc + curr, "")

    return printingNum !== "" ? parseInt(printingNum) : 1
}

function getAgeRatingFromTitle(title) {
    return title.match(patterns.mature) !== null ? "MA" : null
}

function getIsMiniSeriesFromTitle(title) {
    return title.match(patterns.miniSeries) !== null
}

function getFormattedReleaseDate(dateString) {
    if (!dateString) logger.error("! No release date found from parsed data, using today's date.")

    return dateString
        ? format(new Date(dateString), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd")
}

function getFormatFromTitle(title) {
    let format = ""

    if (title.match(patterns.graphicNovelHardcover)) format = "Graphic Novel Hardcover"
    else if (title.match(patterns.graphicNovel)) format = "Graphic Novel"
    else if (title.match(patterns.omnibusHardcover)) format = "Omnibus Hardcover"
    else if (title.match(patterns.omnibus)) format = "Omnibus"
    else if (title.match(patterns.tradePaperback)) format = "Trade Paperback"
    else if (title.match(patterns.hardcover)) format = "Hardcover"
    else if (title.match(patterns.softcover)) format = "Softcover"
    else format = "Comic"

    return format
}

function getMiniSeriesLimitFromTitle(title, isMiniSeries) {
    let miniSeriesLimit = null
    const miniSeriesMatch = title.match(patterns.miniSeries)
    if (miniSeriesMatch !== null) {
        const miniSeriesInfo = miniSeriesMatch[0].toString()
        miniSeriesLimit = miniSeriesInfo.substring(5, miniSeriesInfo.length - 2)

        if (!miniSeriesLimit || isNaN(miniSeriesLimit))
            logger.error("! Expected to find mini series limit from title but didn't")
    }

    return isMiniSeries && miniSeriesLimit ? parseInt(miniSeriesLimit) : null
}

function getIsOneShotFromTitle(title) {
    const isOneShot = title.match(patterns.oneShot) !== null
    if (isOneShot) logger.warn("! Comic is one shot, there may be a one shot subtitle to parse.")
    return isOneShot
}

function getItemNumberFromTitle(title, format) {
    function getCleanedItemNumber(title, pattern) {
        const itemNumberParts = getTitleAsPaddedArray(title.match(pattern).toString().trim(), false)
        const itemNumberPartsWithoutFormats = itemNumberParts.filter(
            (part) => part.match(patterns.formatTypes) === null
        )
        return getStringFromPaddedArray(itemNumberPartsWithoutFormats)
    }

    const numberMatchesByFormat = [
        {
            format: "Comic",
            numberMatches: [
                {
                    name: "Volume Number",
                    isMatchOf: (title) => title.match(patterns.volumeWithNums) !== null,
                    getNumber: (title) => getCleanedItemNumber(title, patterns.volumeWithNums),
                },
                {
                    name: "Season Issue",
                    isMatchOf: (title) => title.match(patterns.season) !== null,
                    getNumber: (title) => getCleanedItemNumber(title, patterns.season),
                },
                {
                    name: "Prog",
                    isMatchOf: (title) => title.match(patterns.progWithNum) !== null,
                    getNumber: (title) => getCleanedItemNumber(title, patterns.progWithNum),
                },
                {
                    name: "Standard Issue",
                    isMatchOf: (title) => title.match(patterns.number) !== null,
                    getNumber: (title) => getCleanedItemNumber(title, patterns.number),
                },
            ],
        },
        {
            format: "Softcover",
            numberMatches: [
                {
                    name: "Volume",
                    isMatchOf: (title) => title.match(patterns.softcoverVolumeWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.softcoverVolumeWithNum),
                },
                {
                    name: "Book",
                    isMatchOf: (title) => title.match(patterns.softcoverBookWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.softcoverBookWithNum),
                },
                {
                    name: "Part",
                    isMatchOf: (title) => title.match(patterns.softcoverPartWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.softcoverPartWithNum),
                },
                {
                    name: "SC",
                    isMatchOf: (title) => title.match(patterns.softcoverWithNum) !== null,
                    getNumber: (title) => getCleanedItemNumber(title, patterns.softcoverWithNum),
                },
            ],
        },
        {
            format: "Trade Paperback",
            numberMatches: [
                {
                    name: "Volume Episode",
                    isMatchOf: (title) =>
                        title.match(patterns.tradePaperbackVolumeSeasonWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.tradePaperbackVolumeSeasonWithNum),
                },
                {
                    name: "Volume",
                    isMatchOf: (title) =>
                        title.match(patterns.tradePaperbackVolumeWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.tradePaperbackVolumeWithNum),
                },
                {
                    name: "Book",
                    isMatchOf: (title) => title.match(patterns.tradePaperbackBookWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.tradePaperbackBookWithNum),
                },
                {
                    name: "Part",
                    isMatchOf: (title) => title.match(patterns.tradePaperbackPartWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.tradePaperbackPartWithNum),
                },
                {
                    name: "TP",
                    isMatchOf: (title) => title.match(patterns.tradePaperbackWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.tradePaperbackWithNum),
                },
            ],
        },
        {
            format: "Hardcover",
            numberMatches: [
                {
                    name: "Volume",
                    isMatchOf: (title) => title.match(patterns.hardcoverVolumeWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.hardcoverVolumeWithNum),
                },
                {
                    name: "Book",
                    isMatchOf: (title) => title.match(patterns.hardcoverBookWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.hardcoverBookWithNum),
                },
                {
                    name: "Part",
                    isMatchOf: (title) => title.match(patterns.hardcoverPartWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.hardcoverPartWithNum),
                },
                {
                    name: "HC",
                    isMatchOf: (title) => title.match(patterns.hardcoverWithNum) !== null,
                    getNumber: (title) => getCleanedItemNumber(title, patterns.hardcoverWithNum),
                },
            ],
        },
        {
            format: "Graphic Novel",
            numberMatches: [
                {
                    name: "Trade Paperback Volume Episode",
                    isMatchOf: (title) =>
                        title.match(patterns.graphicNovelTradePaperbackVolumeEpisodeWithNum) !==
                        null,
                    getNumber: (title) =>
                        getCleanedItemNumber(
                            title,
                            patterns.graphicNovelTradePaperbackVolumeEpisodeWithNum
                        ),
                },
                {
                    name: "Trade Paperback Volume",
                    isMatchOf: (title) =>
                        title.match(patterns.graphicNovelTradePaperbackVolumeWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(
                            title,
                            patterns.graphicNovelTradePaperbackVolumeWithNum
                        ),
                },
                {
                    name: "Trade Paperback",
                    isMatchOf: (title) =>
                        title.match(patterns.graphicNovelTradePaperbackWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.graphicNovelTradePaperbackWithNum),
                },
                {
                    name: "Volume Episode",
                    isMatchOf: (title) =>
                        title.match(patterns.graphicNovelVolumeEpisodeWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.graphicNovelVolumeEpisodeWithNum),
                },
                {
                    name: "Volume",
                    isMatchOf: (title) => title.match(patterns.graphicNovelVolumeWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.graphicNovelVolumeWithNum),
                },
            ],
        },
        {
            format: "Graphic Novel Hardcover",
            numberMatches: [
                {
                    name: "Hardcover Volume Episode",
                    isMatchOf: (title) =>
                        title.match(patterns.hardcoverGraphicNovelVolumeEpisodeWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(
                            title,
                            patterns.hardcoverGraphicNovelVolumeEpisodeWithNum
                        ),
                },
                {
                    name: "Hardcover Volume",
                    isMatchOf: (title) =>
                        title.match(patterns.hardcoverGraphicNovelVolumeWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.hardcoverGraphicNovelVolumeWithNum),
                },
                {
                    name: "Hardcover",
                    isMatchOf: (title) =>
                        title.match(patterns.hardcoverGraphicNovelWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.hardcoverGraphicNovelWithNum),
                },
            ],
        },
        {
            format: "Omnibus",
            numberMatches: [
                {
                    name: "Volume",
                    isMatchOf: (title) => title.match(patterns.omnibusVolumeWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.omnibusVolumeWithNum),
                },
            ],
        },
        {
            format: "Omnibus Hardcover",
            numberMatches: [
                {
                    name: "Volume",
                    isMatchOf: (title) =>
                        title.match(patterns.omnibusHardcoverVolumeWithNum) !== null,
                    getNumber: (title) =>
                        getCleanedItemNumber(title, patterns.omnibusHardcoverVolumeWithNum),
                },
            ],
        },
    ]

    function isException(itemNumbers, format) {
        const isSeason =
            format === "Comic" &&
            itemNumbers.find((num) => ` ${num} `.match(patterns.season) !== null)
        return isSeason
    }

    const itemNumbers = []
    numberMatchesByFormat.forEach((matchesByFormat) => {
        if (format === matchesByFormat.format)
            matchesByFormat.numberMatches.forEach((numberMatch) => {
                if (numberMatch.isMatchOf(title)) itemNumbers.push(numberMatch.getNumber(title))
            })
    })

    if (itemNumbers.length === 0) {
        itemNumbers.push("")
        logger.warn("! Item number not found from title. Setting as blank.")
    } else if (itemNumbers.length > 1 && isException(itemNumbers, format) === false)
        logger.error("! More than one item number match was found from the title.")

    return itemNumbers[0]
}

function getCleanedItemNumber(itemNumber) {
    let cleanedItemNum = itemNumber
        .replace(patterns.leadingZeros, "")
        .replace(patterns.volume, " Volume ")
    const formatNumbers = cleanedItemNum.match(patterns.formatNumber)
    if (formatNumbers !== null)
        formatNumbers.forEach(
            (num) => (cleanedItemNum = cleanedItemNum.replace(num, ` #${num.trim()} `))
        )
    cleanedItemNum = convertToProperCasing(cleanedItemNum).trim()
    return cleanedItemNum ? cleanedItemNum : null
}

function removeUnneededWordsFromTitle(title) {
    const itemsToRemove = [
        { pattern: patterns.mature, replacement: " " },
        { pattern: patterns.miniSeries, replacement: " " },
        { pattern: patterns.net, replacement: " " },
        { pattern: patterns.oneShot, replacement: " " },
        { pattern: patterns.operatingAs, replacement: " " },
        { pattern: patterns.psArtbooksMagazine, replacement: " " },
        { pattern: patterns.psArtbooks, replacement: " " },
        { pattern: patterns.r, replacement: " " },
        { pattern: patterns.reprint, replacement: " " },
        { pattern: patterns.resolicit, replacement: " " },
        { pattern: patterns.softee, replacement: " " },
        { pattern: patterns.subsequentPrintingNum, replacement: " " },
        { pattern: patterns.trailingParentheses, replacement: " " },
        { pattern: patterns.useOtherDiamondID, replacement: " " },
    ]

    let cleanedTitle = title
    itemsToRemove.forEach(
        (item) => (cleanedTitle = cleanedTitle.replace(item.pattern, item.replacement))
    )

    return cleanedTitle
}

function getCleanedTitle(title) {
    const itemsToClean = [
        { pattern: patterns.adventure, replacement: " Adventure " },
        { pattern: patterns.bprd, replacement: " B.P.R.D " },
        { pattern: patterns.anniversary, replacement: " Anniversary " },
        { pattern: patterns.collection, replacement: " Collection " },
        { pattern: patterns.deluxe, replacement: " Deluxe " },
        { pattern: patterns.edition, replacement: " Edition " },
        { pattern: patterns.editionWithParen, replacement: " Edition) " },
        { pattern: patterns.originalGraphicNovel, replacement: " " },
        { pattern: patterns.graphicNovel, replacement: " " },
        { pattern: patterns.hardcover, replacement: " " },
        { pattern: patterns.kingInBlack, replacement: " King in Black " },
        { pattern: patterns.limited, replacement: " Limited " },
        { pattern: patterns.marvelMasterworks, replacement: " Marvel Masterworks " },
        { pattern: patterns.ofThe, replacement: " of the " },
        { pattern: patterns.omnibus, replacement: " " },
        { pattern: patterns.original, replacement: " Original " },
        { pattern: patterns.signature, replacement: " Signature " },
        { pattern: patterns.softcover, replacement: " " },
        { pattern: patterns.theNextGeneration, replacement: " The Next Generation " },
        { pattern: patterns.tradePaperback, replacement: " " },
        { pattern: patterns.years, replacement: " Years " },
    ]

    let cleanedTitle = title
    itemsToClean.forEach(
        (item) => (cleanedTitle = cleanedTitle.replace(item.pattern, item.replacement))
    )
    cleanedTitle = convertToProperCasing(cleanedTitle.trim())

    if (cleanedTitle.length < 1) logger.error(`! Title is missing.`)
    if (cleanedTitle.match(/\s{2,}/gi))
        logger.error(`! Found extra space in title indicating an error in title parsing.`)

    return cleanedTitle
}

function getCleanedSeriesName(name, comic) {
    let parsedName = prepareTitleForParsing(name)
    parsedName = removeSegmentFromTitle(parsedName, comic.unparsedVariantDescription)
    parsedName = removeSegmentFromTitle(parsedName, comic.unparsedCoverDescription)
    parsedName = removeSegmentFromTitle(parsedName, comic.unparsedCoverLetterDescription)
    if (comic.unparsedAdditionalDescriptions)
        comic.unparsedAdditionalDescriptions.forEach((description) => {
            parsedName = removeSegmentFromTitle(parsedName, description)
        })
    parsedName = removeSegmentFromTitle(parsedName, comic.titleOverflow)
    parsedName = removeUnneededWordsFromTitle(parsedName)
    parsedName = removeSegmentFromTitle(parsedName, comic.unparsedSubtitle)
    parsedName = removeSegmentFromTitle(parsedName, comic.unparsedItemNumber)

    return getCleanedTitle(parsedName)
}

function getParsedSeries(series, comic) {
    const parsedSeries = {
        id: null,
        link: series && series.link ? series.link : null,
        name: series && series.name ? getCleanedSeriesName(series.name, comic) : comic.title,
    }
    return parsedSeries
}

function isFilterOut(title) {
    return title.match(patterns.atlasSignatureEdition) !== null
}

function getParsedComic(comic) {
    logger.info(`# Parsing ${comic.title} scraped from ${comic.link}`)
    const parsedComic = {}
    parsedComic.unparsedCreators = comic.creators
    parsedComic.unparsedTitle = comic.title
    parsedComic.unparsedFormat = comic.format
    parsedComic.link = comic.link
    parsedComic.diamondID = comic.diamondID
    parsedComic.coverPrice = comic.coverPrice
    parsedComic.cover = comic.coverURL
    parsedComic.description = comic.description
    parsedComic.publisher = getParsedPublisher(comic.publisher)
    parsedComic.releaseDate = getFormattedReleaseDate(comic.releaseDate)
    parsedComic.creators = getParsedCreatorsFromNodes(comic.creators)
    parsedComic.solicitationDate = getSolicitDateFromDiamondID(parsedComic.diamondID)
    if (!comic.title)
        throw new Error(`! The comic title was not found for comic with link ${parsedComic.link}`)
    parsedComic.title = prepareTitleForParsing(comic.title)
    parsedComic.printingNumber = getPrintingNumberFromTitle(parsedComic.title)
    parsedComic.coverLetter = getCoverLetterFromTitle(parsedComic.title)
    parsedComic.variantTypes = getVariantTypesFromTitle(parsedComic.title)
    parsedComic.ageRating = getAgeRatingFromTitle(parsedComic.title)
    parsedComic.isMiniSeries = getIsMiniSeriesFromTitle(parsedComic.title)
    parsedComic.miniSeriesLimit = getMiniSeriesLimitFromTitle(
        parsedComic.title,
        parsedComic.isMiniSeries
    )
    parsedComic.isOneShot = getIsOneShotFromTitle(parsedComic.title)
    parsedComic.format =
        parsedComic.unparsedFormat !== "Comic" ? getFormatFromTitle(parsedComic.title) : "Comic"
    parsedComic.unparsedItemNumber = getItemNumberFromTitle(parsedComic.title, parsedComic.format)
    parsedComic.variantDescription = parseVariantDescriptionFromTitle(parsedComic)
    parsedComic.title = removeUnneededWordsFromTitle(parsedComic.title)
    parsedComic.subtitle = parseSubtitleFromTitle(parsedComic)
    parsedComic.title = removeSegmentFromTitle(parsedComic.title, parsedComic.unparsedItemNumber)
    parsedComic.itemNumber = getCleanedItemNumber(parsedComic.unparsedItemNumber)
    parsedComic.filterOut = isFilterOut(parsedComic.title)
    parsedComic.title = getCleanedTitle(parsedComic.title)
    parsedComic.series = getParsedSeries(comic.series, parsedComic)

    return parsedComic
}

module.exports = getParsedComic
