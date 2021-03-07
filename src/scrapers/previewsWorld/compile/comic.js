const { format } = require("date-fns")
const getCreatorsFromNodes = require("./creator.js")
const { infoLogger } = require("../../../utils/logger.js")
const toProperCasing = require("../../../utils/toProperCasing.js")
const getMonthFromAbbreviation = require("../../../utils/getMonth.js")
const patterns = require("../patterns.js")

function getSolicitDateFromDiamondID(diamondID) {
    let solicitationDate = ""
    if (!diamondID || diamondID.length < 5)
        infoLogger.error(`! Could not get the the solicitation date from Diamond ID`)
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
        const titleParts = title.split(" ")
        titleParts.forEach((part, index) => {
            if (index > 0 && part.match(/PTG/i))
                printingNums.push(titleParts[index - 1].match(/\d+/g))
        })
        if (printingNums.length < 1)
            infoLogger.error("! Expected printing numbers from title but didn't find any")
    }
    const printingNum = printingNums.reduce((acc, curr) => acc + curr, "")

    return printingNum !== "" ? parseInt(printingNum) : 1
}

function getFormattedReleaseDate(dateString) {
    return format(new Date(dateString), "yyyy-MM-dd")
}

function getFormatFromTitle(title) {
    let format = ""

    if (title.match(patterns.graphicNovelHardcover)) format = "Graphic Novel Hardcover"
    else if (title.match(patterns.graphicNovel)) format = "Graphic Novel"
    else if (title.match(patterns.omnibusHardcover)) format = "Omnibus Hardcover"
    else if (title.match(patterns.omnibus)) format = "Omnibus"
    else if (title.match(patterns.tradePaperback)) format = "Trade Paperback"
    else if (title.match(patterns.hardcover)) format = "Hardcover"
    else format = "Comic"

    return format
}

function getMiniSeriesLimitFromTitle(title) {
    let miniSeriesLimit = ""
    const miniSeriesMatch = title.match(patterns.miniSeries)
    if (miniSeriesMatch !== null) {
        const miniSeriesInfo = miniSeriesMatch[0].toString()
        miniSeriesLimit = miniSeriesInfo.substring(5, miniSeriesInfo.length - 2)

        if (!miniSeriesLimit || isNaN(miniSeriesLimit)) {
            infoLogger.error("! Expected to find mini series limit from title but didn't find it")
            miniSeriesLimit = "0"
        }
    }

    return parseInt(miniSeriesLimit)
}

function getItemNumberFromTitle(title, format) {
    const numberMatchesByFormat = [
        {
            format: "Comic",
            numberMatches: [
                {
                    name: "Standard Issue",
                    isMatchOf: (title) => title.match(patterns.number) !== null,
                    getNumber: (title) => {
                        const number = title.match(patterns.number).toString()
                        return number.substring(1, number.length - 1)
                    },
                },
            ],
        },
        {
            format: "Trade Paperback",
            numberMatches: [
                {
                    name: "Volume",
                    isMatchOf: (title) =>
                        title.match(patterns.tradePaperbackVolumeWithNum) !== null,
                    getNumber: (title) => {
                        const number = title.match(patterns.tradePaperbackVolumeWithNum).toString()
                        return `Volume ${number.substring(8, number.length - 1)}`
                    },
                },
                {
                    name: "Book",
                    isMatchOf: (title) => title.match(patterns.tradePaperbackBookWithNum) !== null,
                    getNumber: (title) => {
                        const number = title.match(patterns.tradePaperbackBookWithNum).toString()
                        return `Book ${number.substring(9, number.length - 1)}`
                    },
                },
                {
                    name: "Part",
                    isMatchOf: (title) => title.match(patterns.tradePaperbackPartWithNum) !== null,
                    getNumber: (title) => {
                        const number = title.match(patterns.tradePaperbackPartWithNum).toString()
                        return `Part ${number.substring(9, number.length - 1)}`
                    },
                },
                {
                    name: "TP",
                    isMatchOf: (title) => title.match(patterns.tradePaperbackWithNum) !== null,
                    getNumber: (title) => {
                        const number = title.match(patterns.tradePaperbackWithNum).toString()
                        return `#${number.substring(4, number.length - 1)}`
                    },
                },
            ],
        },
        {
            format: "Hardcover",
            numberMatches: [
                {
                    name: "Volume",
                    isMatchOf: (title) => title.match(patterns.hardcoverVolumeWithNum) !== null,
                    getNumber: (title) => {
                        const number = title.match(patterns.hardcoverVolumeWithNum).toString()
                        return `Volume ${number.substring(8, number.length - 1)}`
                    },
                },
                {
                    name: "Book",
                    isMatchOf: (title) => title.match(patterns.hardcoverBookWithNum) !== null,
                    getNumber: (title) => {
                        const number = title.match(patterns.hardcoverBookWithNum).toString()
                        return `Book ${number.substring(9, number.length - 1)}`
                    },
                },
                {
                    name: "Part",
                    isMatchOf: (title) => title.match(patterns.hardcoverPartWithNum) !== null,
                    getNumber: (title) => {
                        const number = title.match(patterns.hardcoverPartWithNum).toString()
                        return `Part ${number.substring(9, number.length - 1)}`
                    },
                },
                {
                    name: "HC",
                    isMatchOf: (title) => title.match(patterns.hardcoverWithNum) !== null,
                    getNumber: (title) => {
                        const number = title.match(patterns.hardcoverWithNum).toString()
                        return `#${number.substring(4, number.length - 1)}`
                    },
                },
            ],
        },
        {
            format: "Graphic Novel",
            numberMatches: [
                {
                    name: "Trade Paperback",
                    isMatchOf: (title) =>
                        title.match(patterns.graphicNovelTradePaperbackWithNum) !== null,
                    getNumber: (title) => {
                        const number = title
                            .match(patterns.graphicNovelTradePaperbackWithNum)
                            .toString()
                        return `#${number.substring(7, number.length - 1)}`
                    },
                },
                {
                    name: "Volume",
                    isMatchOf: (title) => title.match(patterns.graphicNovelVolumeWithNum) !== null,
                    getNumber: (title) => {
                        const number = title.match(patterns.graphicNovelVolumeWithNum).toString()
                        return `Volume ${number.substring(8, number.length - 1)}`
                    },
                },
                {
                    name: "Trade Paperback Volume",
                    isMatchOf: (title) =>
                        title.match(patterns.graphicNovelTradePaperbackVolumeWithNum) !== null,
                    getNumber: (title) => {
                        const number = title
                            .match(patterns.graphicNovelTradePaperbackVolumeWithNum)
                            .toString()
                        return `Volume ${number.substring(11, number.length - 1)}`
                    },
                },
            ],
        },
        {
            format: "Graphic Novel Hardcover",
            numberMatches: [
                {
                    name: "Hardcover",
                    isMatchOf: (title) =>
                        title.match(patterns.hardcoverGraphicNovelWithNum) !== null,
                    getNumber: (title) => {
                        const number = title.match(patterns.hardcoverGraphicNovelWithNum).toString()
                        return `#${number.substring(7, number.length - 1)}`
                    },
                },
                {
                    name: "Hardcover Volume",
                    isMatchOf: (title) =>
                        title.match(patterns.hardcoverGraphicNovelVolumeWithNum) !== null,
                    getNumber: (title) => {
                        const number = title
                            .match(patterns.hardcoverGraphicNovelVolumeWithNum)
                            .toString()
                        return `Volume ${number.substring(11, number.length - 1)}`
                    },
                },
            ],
        },
        {
            format: "Omnibus",
            numberMatches: [
                {
                    name: "Volume",
                    isMatchOf: (title) => title.match(patterns.omnibusVolumeWithNum) !== null,
                    getNumber: (title) => {
                        const number = title.match(patterns.omnibusVolumeWithNum).toString()
                        return `Volume ${number.substring(13, number.length - 1)}`
                    },
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
                    getNumber: (title) => {
                        const number = title
                            .match(patterns.omnibusHardcoverVolumeWithNum)
                            .toString()
                        return `Volume ${number.substring(16, number.length - 1)}`
                    },
                },
            ],
        },
    ]

    const itemNumbers = []
    numberMatchesByFormat.forEach((matchesByFormat) => {
        if (format === matchesByFormat.format) {
            matchesByFormat.numberMatches.forEach((numberMatch) => {
                if (numberMatch.isMatchOf(title)) itemNumbers.push(numberMatch.getNumber(title))
            })
        }
    })

    if (itemNumbers.length === 0) {
        infoLogger.warn("! Item number not found from title. Setting as blank.")
        itemNumbers.push("")
    } else if (itemNumbers.length > 1)
        infoLogger.error("! More than one item number match was found from the title.")

    return itemNumbers[0]
}

function getCoverLetterFromTitle(title) {
    let coverLetter = ""
    const coverLetterMatch = title.match(patterns.coverLetter)
    if (coverLetterMatch !== null) {
        const matchString = coverLetterMatch.toString()
        const letter = matchString.substring(5, matchString.length - 1)
        coverLetter = letter
        if (coverLetter.length < 1)
            infoLogger.error("! Cover letter from title was expected but not found")
    }

    return coverLetter
}

function getVariantTypeFromTitle(title) {
    const variantTypes = []
    if (title.match(patterns.coverLetter)) variantTypes.push("cvr")
    if (title.match(patterns.reprint)) variantTypes.push("rpr")
    if (title.match(patterns.subsequentPrintingNum)) variantTypes.push("spr")

    if (variantTypes.length > 1)
        infoLogger.error("! More than one variant type found for this comic.")

    return variantTypes.length < 1 ? null : variantTypes[0]
}

function removeCreatorNamesFromTitle(title, creators) {
    let cleanedTitle = title
    const coverLetterMatch = title.match(patterns.coverLetter)
    const variantMatch = title.match(patterns.variantWithType)

    if (coverLetterMatch !== null || variantMatch !== null)
        creators.forEach(({ name }) => {
            const nameParts = name.split(" ")
            nameParts.forEach((part) => {
                const creatorNameRegex = new RegExp(` ${part}( &)? `, "i")
                cleanedTitle = cleanedTitle.replace(creatorNameRegex, " ")
            })
        })

    return cleanedTitle
}

function getCleanedTitle(title, creators) {
    const itemsToClean = [
        { pattern: patterns.number, replacement: " " },
        { pattern: patterns.mature, replacement: " " },
        { pattern: patterns.trailingParentheses, replacement: " " },
        { pattern: patterns.miniSeries, replacement: " " },
        { pattern: patterns.useOtherDiamondID, replacement: " " },
        { pattern: patterns.trailingParenthesesC, replacement: " " },
        { pattern: patterns.resolicit, replacement: " " },
        { pattern: patterns.volume, replacement: " " },
        { pattern: patterns.coverLetter, replacement: " " },
        { pattern: patterns.blankCover, replacement: " " },
        { pattern: patterns.variant, replacement: " " },
        { pattern: patterns.limited, replacement: " Limited " },
        { pattern: patterns.edition, replacement: " Edition " },
        { pattern: patterns.reprint, replacement: " " },
        { pattern: patterns.subsequentPrintingNum, replacement: " " },
        { pattern: patterns.anniversary, replacement: " Anniversary " },
        { pattern: patterns.graphicNovel, replacement: " " },
        { pattern: patterns.tradePaperback, replacement: " " },
        { pattern: patterns.deluxe, replacement: " Deluxe " },
        { pattern: patterns.ofThe, replacement: " of the " },
        { pattern: patterns.original, replacement: " Original " },
        { pattern: patterns.years, replacement: " Years " },
        { pattern: patterns.theNextGeneration, replacement: " The Next Generation " },
        { pattern: patterns.signature, replacement: " Signature " },
    ]

    let cleanedTitle = title
    cleanedTitle = removeCreatorNamesFromTitle(cleanedTitle, creators)
    itemsToClean.forEach(
        (item) => (cleanedTitle = cleanedTitle.replace(item.pattern, item.replacement))
    )
    cleanedTitle = cleanedTitle.trim()
    cleanedTitle = toProperCasing(cleanedTitle)

    return cleanedTitle
}

async function getCompiledComic(comic) {
    const compiledComic = {}

    compiledComic.diamondID = comic.diamondID
    compiledComic.publisher = { id: null, name: comic.publisher.name }
    compiledComic.releaseDate = getFormattedReleaseDate(comic.releaseDate)
    compiledComic.coverPrice = comic.coverPrice
    compiledComic.cover = comic.cover
    compiledComic.description = comic.description
    compiledComic.creators = getCreatorsFromNodes(comic.creators)
    compiledComic.format = comic.format
    compiledComic.solicitationDate = getSolicitDateFromDiamondID(compiledComic.diamondID)
    if (!comic.title) infoLogger.error(`! The comic title was not found`)
    else {
        compiledComic.title = comic.title
        compiledComic.printingNumber = getPrintingNumberFromTitle(comic.title)
        compiledComic.coverLetter = getCoverLetterFromTitle(comic.title)
        compiledComic.versionOf = null
        compiledComic.variantType = getVariantTypeFromTitle(compiledComic.title)
        compiledComic.ageRating = compiledComic.title.match(patterns.mature) ? "MA" : ""
        compiledComic.isMiniSeries = compiledComic.title.match(patterns.miniSeries) !== null
        if (comic.isMiniSeries)
            compiledComic.miniSeriesLimit = getMiniSeriesLimitFromTitle(compiledComic.title)
        else compiledComic.miniSeriesLimit = 0
        compiledComic.isOneShot = compiledComic.title.match(patterns.oneShot) !== null
        if (compiledComic.format !== "Comic") compiledComic.format = getFormatFromTitle(comic.title)
        compiledComic.itemNumber = getItemNumberFromTitle(compiledComic.title, compiledComic.format)
        compiledComic.title = getCleanedTitle(compiledComic.title, compiledComic.creators)
        compiledComic.series = {
            id: null,
            name: comic.series.link
                ? getCleanedTitle(comic.series.name, compiledComic.creators)
                : compiledComic.title,
        }
    }

    return compiledComic
}

module.exports = getCompiledComic
