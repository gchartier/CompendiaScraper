const { format } = require("date-fns")
const getCreatorsFromNodes = require("./creator.js")
const { infoLogger } = require("../../../utils/logger.js")
const toProperCasing = require("../../../utils/toProperCasing.js")
const getMonthFromAbbreviation = require("../../../utils/getMonth.js")

function getSolicitDateFromDiamondID(diamondID) {
    const solicitationTag = diamondID.slice(0, 5)
    return `${getMonthFromAbbreviation(solicitationTag.slice(0, 3))} 20${solicitationTag.slice(3)}`
}

function getSeriesNameFromTitle(title) {
    return getCleanedTitle(title)
}

function getPrintingNumberFromTitle(title) {
    const printingNums = []
    if (title.match(/ NEW PTG /i) === null && title.match(/\d+\w+ PTG /i)) {
        const titleParts = title.split(" ")
        titleParts.forEach((part, index) => {
            if (index > 0 && part.match(/PTG/i))
                printingNums.push(titleParts[index - 1].match(/\d+/g))
        })
    }
    const printingNum = printingNums.reduce((acc, curr) => acc + curr, "")

    return printingNum !== "" ? parseInt(printingNum) : 1
}

function getFormattedReleaseDate(dateString) {
    return format(new Date(dateString), "yyyy-MM-dd")
}

function getFormatFromTitle(title) {
    let format = ""

    if (title.match(/ GN HC /i)) format = "Graphic Novel Hardcover"
    else if (title.match(/ GN /i)) format = "Graphic Novel"
    else if (title.match(/ OMNIBUS HC /i)) format = "Omnibus Hardcover"
    else if (title.match(/ OMNIBUS /i)) format = "Omnibus"
    else if (title.match(/ TP /i)) format = "Trade Paperback"
    else if (title.match(/ HC /i)) format = "Hardcover"
    else format = "Comic"

    return format
}

function getMiniSeriesLimitFromTitle(title) {
    return title.match(/ \(OF \d+\) /i)[1].substring(5, title.match(/ \(OF \d+\) /i).length)
}

function getItemNumberFromTitle(title, format) {
    const numberMatchesByFormat = [
        {
            format: "Comic",
            numberMatches: [
                {
                    name: "Standard Issue",
                    isMatchOf: (title) => title.match(/ #\d+ /) !== null,
                    getNumber: (title) => {
                        const number = title.match(/ #\d+ /).toString()
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
                    isMatchOf: (title) => title.match(/ TP VOL \d+ /) !== null,
                    getNumber: (title) => {
                        const number = title.match(/ TP VOL \d+ /).toString()
                        return `#${number.substring(8, number.length - 1)}`
                    },
                },
                {
                    name: "Book",
                    isMatchOf: (title) => title.match(/ TP BOOK \d+ /) !== null,
                    getNumber: (title) => {
                        const number = title.match(/ TP BOOK \d+ /).toString()
                        return `#${number.substring(9, number.length - 1)}`
                    },
                },
                {
                    name: "Part",
                    isMatchOf: (title) => title.match(/ TP PART \d+ /) !== null,
                    getNumber: (title) => {
                        const number = title.match(/ TP PART \d+ /).toString()
                        return `#${number.substring(9, number.length - 1)}`
                    },
                },
            ],
        },
        {
            format: "Hardcover",
            numberMatches: [
                {
                    name: "Volume",
                    isMatchOf: (title) => title.match(/ HC VOL \d+ /) !== null,
                    getNumber: (title) => {
                        const number = title.match(/ HC VOL \d+ /).toString()
                        return `#${number.substring(8, number.length - 1)}`
                    },
                },
                {
                    name: "Book",
                    isMatchOf: (title) => title.match(/ HC BOOK \d+ /) !== null,
                    getNumber: (title) => {
                        const number = title.match(/ HC BOOK \d+ /).toString()
                        return `#${number.substring(9, number.length - 1)}`
                    },
                },
                {
                    name: "Part",
                    isMatchOf: (title) => title.match(/ HC PART \d+ /) !== null,
                    getNumber: (title) => {
                        const number = title.match(/ HC PART \d+ /).toString()
                        return `#${number.substring(9, number.length - 1)}`
                    },
                },
            ],
        },
        {
            format: "Graphic Novel",
            numberMatches: [
                {
                    name: "Trade Paperback",
                    isMatchOf: (title) => title.match(/ GN TP \d+ /) !== null,
                    getNumber: (title) => {
                        const number = title.match(/ GN TP \d+ /).toString()
                        return `#${number.substring(7, number.length - 1)}`
                    },
                },
                {
                    name: "Volume",
                    isMatchOf: (title) => title.match(/ GN VOL \d+ /) !== null,
                    getNumber: (title) => {
                        const number = title.match(/ GN VOL \d+ /).toString()
                        return `#${number.substring(8, number.length - 1)}`
                    },
                },
            ],
        },
        {
            format: "Graphic Novel Hardcover",
            numberMatches: [
                {
                    name: "Hardcover",
                    isMatchOf: (title) => title.match(/ GN HC \d+ /) !== null,
                    getNumber: (title) => {
                        const number = title.match(/ GN HC \d+ /).toString()
                        return `#${number.substring(7, number.length - 1)}`
                    },
                },
            ],
        },
        {
            format: "Omnibus",
            numberMatches: [
                {
                    name: "Volume",
                    isMatchOf: (title) => title.match(/ OMNIBUS VOL \d+ /) !== null,
                    getNumber: (title) => {
                        const number = title.match(/ OMNIBUS VOL \d+ /).toString()
                        return `#${number.substring(13, number.length - 1)}`
                    },
                },
            ],
        },
        {
            format: "Omnibus Hardcover",
            numberMatches: [
                {
                    name: "Volume",
                    isMatchOf: (title) => title.match(/ OMNIBUS HC VOL \d+ /) !== null,
                    getNumber: (title) => {
                        const number = title.match(/ OMNIBUS HC VOL \d+ /).toString()
                        return `#${number.substring(16, number.length - 1)}`
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
        infoLogger.warn("! Item number not found from title. Setting as #1")
        itemNumbers.push("#1")
    } else if (itemNumbers.length > 1)
        infoLogger.error("! More than one item number match was found from the title.")

    return itemNumbers[0]
}

function getCoverLetterFromTitle(title) {
    let coverLetter = ""
    if (title.match(/ CVR \w+ /i) !== null) {
        const coverLetterMatch = title.match(/ CVR \w+ /i).toString()
        const letter = coverLetterMatch.substring(5, coverLetterMatch.length - 1)
        coverLetter = letter
    }
    return coverLetter
}

function removeCreatorNamesFromTitle(title, creators) {
    let cleanedTitle = title

    if (title.match(/ CVR \w+ /i) !== null)
        creators.forEach(({ name }) => {
            const nameParts = name.split(" ")
            const lastName = nameParts[nameParts.length - 1]
            const creatorNameRegex = new RegExp(` ${lastName}( &)? `, "i")
            cleanedTitle = cleanedTitle.replace(creatorNameRegex, " ")
        })

    return cleanedTitle
}

function getCleanedTitle(title, creators) {
    const itemsToClean = [
        { pattern: / #\d+ /, replacement: " " },
        { pattern: / \(MR\) /i, replacement: " " },
        { pattern: / \( $/, replacement: " " },
        { pattern: / \(OF \d+\) /, replacement: " " },
        { pattern: / \(USE [A-Z]{3}\d+\) /i, replacement: " " },
        { pattern: / \(C /i, replacement: " " },
        { pattern: / \(RES\) /i, replacement: " " },
        { pattern: / VOL /i, replacement: " Vol. " },
        { pattern: / CVR \w+ /i, replacement: " " },
        { pattern: / BLANK CVR /i, replacement: " " },
        { pattern: / VAR /i, replacement: " Variant " },
        { pattern: / LMT /i, replacement: " Limited " },
        { pattern: / LT /i, replacement: " Limited " },
        { pattern: / LTD /i, replacement: " Limited " },
        { pattern: / ED /i, replacement: " Edition " },
        { pattern: / \(NEW PTG\) /i, replacement: " New Printing " },
        { pattern: / PTG /i, replacement: " Printing " },
        { pattern: / ANNIV /i, replacement: " Anniversary " },
        { pattern: / GN /i, replacement: " Graphic Novel " },
        { pattern: / DLX /i, replacement: " Deluxe " },
        { pattern: / O\/T /i, replacement: " of the " },
        { pattern: / ORIG /i, replacement: " Original " },
        { pattern: / YRS /i, replacement: " Years " },
        { pattern: / TNG /i, replacement: " The Next Generation " },
        { pattern: / SGN /i, replacement: " Signature " },
    ]

    let cleanedTitle = title
    itemsToClean.forEach(
        (item) => (cleanedTitle = cleanedTitle.replace(item.pattern, item.replacement))
    )
    cleanedTitle = removeCreatorNamesFromTitle(title, creators)
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
    if (!comic.diamondID || comic.diamondID.length < 5)
        infoLogger.error(`! Cannot set the solicitation date`)
    else compiledComic.solicitationDate = getSolicitDateFromDiamondID(comic.diamondID)
    if (!comic.title) infoLogger.error(`! The comic title was not found`)
    else {
        compiledComic.title = comic.title
        compiledComic.printingNumber = getPrintingNumberFromTitle(comic.title)
        compiledComic.coverLetter = getCoverLetterFromTitle(comic.title)
        compiledComic.versionOf = null
        compiledComic.variantType = null
        if (compiledComic.title.match(/ CVR [A-Z]/i)) compiledComic.variantType = "cvr"
        if (compiledComic.title.match(/ \(NEW PTG\) /i) || compiledComic.title.match(/ NEW PTG /i))
            compiledComic.variantType = "spr"
        compiledComic.ageRating = compiledComic.title.match(/ \(MR\) /i) ? "MA" : ""
        compiledComic.isMiniSeries = compiledComic.title.match(/ \(OF \d+\) /i) !== null
        if (comic.isMiniSeries)
            compiledComic.miniSeriesLimit = getMiniSeriesLimitFromTitle(comic.title)
        else compiledComic.miniSeriesLimit = 0
        compiledComic.isOneShot = compiledComic.title.match(/ ONE SHOT /i) !== null
        if (compiledComic.format !== "Comic") compiledComic.format = getFormatFromTitle(comic.title)
        compiledComic.itemNumber = getItemNumberFromTitle(compiledComic.title, compiledComic.format)
        compiledComic.title = getCleanedTitle(comic.title, compiledComic.creators)
        compiledComic.series = {
            id: null,
            name: comic.series.link ? comic.series.name : compiledComic.title,
        }
    }

    return compiledComic
}

module.exports = getCompiledComic
