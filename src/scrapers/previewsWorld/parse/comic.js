const { format } = require("date-fns")
const patterns = require("../patterns.js")
const logger = require("../../../utils/logger.js")
const getParsedCreatorsFromNodes = require("./creator.js")
const toProperCasing = require("../../../utils/toProperCasing.js")
const getMonthFromAbbreviation = require("../../../utils/getMonth.js")

function getSolicitDateFromDiamondID(diamondID) {
    let solicitationDate = ""
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
        const titleParts = title.split(" ")
        titleParts.forEach((part, index) => {
            if (index > 0 && part.match(/PTG/i))
                printingNums.push(titleParts[index - 1].match(/\d+/g))
        })
        if (printingNums.length < 1)
            logger.error("! Expected printing numbers from title but didn't find any")
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
            logger.error("! Expected to find mini series limit from title but didn't find it")
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
        logger.warn("! Item number not found from title. Setting as blank.")
        itemNumbers.push("")
    } else if (itemNumbers.length > 1)
        logger.error("! More than one item number match was found from the title.")

    return itemNumbers[0].replace(patterns.leadingZeros, "")
}

function getCoverLetterFromTitle(title) {
    let coverLetter = ""
    const coverLetterMatch = title.match(patterns.coverLetter)
    if (coverLetterMatch !== null) {
        const matchString = coverLetterMatch.toString()
        const letter = matchString !== null ? matchString.substring(5, matchString.length - 1) : ""
        coverLetter = letter
        if (coverLetter.length < 1)
            logger.error(
                "! Cover letter from title was expected but not found. Potential error in title"
            )
    }

    return coverLetter
}

function getVariantTypeFromTitle(title) {
    const variantTypes = []
    if (title.match(patterns.coverLetter)) variantTypes.push("cvr")
    if (title.match(patterns.reprint)) variantTypes.push("rpr")
    if (title.match(patterns.subsequentPrintingNum)) variantTypes.push("spr")

    if (variantTypes.length > 1) logger.error("! More than one variant type found for this comic.")

    return variantTypes.length < 1 ? null : variantTypes[0]
}

function removeVariantFromTitle(title) {
    function getTitleAsReversedArrayOfPaddedWords(title) {
        return title
            .split(" ")
            .reverse()
            .filter((word) => word !== "")
            .map((word) => ` ${word} `)
    }

    function isCoverLetter({ word, index, words }) {
        return (
            word.match(patterns.letter) &&
            index < words.length - 1 &&
            words[index + 1].match(patterns.cover)
        )
    }

    function isSubsequentPrinting({ word, index, words }) {
        return (
            word.match(patterns.printing) &&
            index < words.length - 1 &&
            words[index + 1].match(patterns.printingNum)
        )
    }

    function isReprint({ word, index, words }) {
        return (
            word.match(patterns.reprintPrinting) &&
            index < words.length - 1 &&
            words[index + 1].match(patterns.reprintNew)
        )
    }

    function isFormatNumber({ word, index, words }) {
        return (
            word.match(patterns.number) ||
            (word.match(patterns.formatNumber) &&
                index < words.length - 1 &&
                words[index + 1].match(patterns.formatType))
        )
    }

    function isFormat({ word }) {
        logger.warn(
            "! Variant found in title stopped at a format. There may be an issue with the title."
        )
        return word.match(patterns.formatType)
    }

    function isMiniSeries({ word, index, words }) {
        return (
            word.match(patterns.miniSeriesNumber) &&
            index < words.length - 1 &&
            words[index + 1].match(patterns.miniSeriesInd)
        )
    }

    function isEndOfVariantString(word, index, words) {
        const searchDetails = { word, index, words }
        return (
            isCoverLetter(searchDetails) !== null ||
            isFormatNumber(searchDetails) !== null ||
            isMiniSeries(searchDetails) !== null ||
            isReprint(searchDetails) !== null ||
            isSubsequentPrinting(searchDetails) !== null ||
            isFormat(searchDetails) !== null
        )
    }

    function getVariantSegmentOfTitle(words) {
        return ` ${words
            .reverse()
            .map((word) => word.trim())
            .join(" ")} `
    }

    let cleanedTitle = title
    if (title.match(patterns.variant)) {
        const words = getTitleAsReversedArrayOfPaddedWords(cleanedTitle)

        const titleWordsStartingWithVariant = []
        let foundVariant = false
        words.forEach((word) => {
            if (word.match(patterns.variant)) foundVariant = true
            if (foundVariant) titleWordsStartingWithVariant.push(word)
        })

        const variantWords = []
        let isEndFound = false
        titleWordsStartingWithVariant.forEach((word, index, words) => {
            if (!isEndFound) {
                if (isEndOfVariantString(word, index, words)) {
                    isEndFound = true
                } else variantWords.push(word)
            }
        })
        const variantSegment = getVariantSegmentOfTitle(variantWords)
        cleanedTitle = cleanedTitle.replace(variantSegment, " ")
    }

    if (cleanedTitle.length < 1)
        logger.error("! Title was cleared in error when attempting to remove the variant from it.")

    return cleanedTitle
}

function removeCreatorNamesFromTitle(title, creators) {
    let cleanedTitle = title
    const coverLetterMatch = title.match(patterns.coverLetter)

    if (coverLetterMatch !== null && creators) {
        const creatorNames = creators.reduce((acc, curr) => {
            const nameParts = curr.name.split(" ")
            nameParts.forEach((part) => acc.push(part))
            return acc
        }, [])
        const joinedNames = creatorNames.join("|")
        const creatorNameWithAmpRegex = new RegExp(` CVR [A-Z] ${joinedNames} & [A-Z]+ `, "gi")
        const creatorNameRegex = new RegExp(` CVR [A-Z] ${joinedNames}`, "gi")
        cleanedTitle = cleanedTitle.replace(creatorNameWithAmpRegex, " ")
        cleanedTitle = cleanedTitle.replace(creatorNameRegex, " ")
    }

    return cleanedTitle
}

function getCleanedTitle(title, creators) {
    const itemsToClean = [
        { pattern: patterns.anniversary, replacement: " Anniversary " },
        { pattern: patterns.blankCover, replacement: " " },
        { pattern: patterns.collection, replacement: " Collection " },
        { pattern: patterns.cosplayPhotoCover, replacement: " " },
        { pattern: patterns.coverLetter, replacement: " " },
        { pattern: patterns.deluxe, replacement: " Deluxe " },
        { pattern: patterns.edition, replacement: " Edition " },
        { pattern: patterns.graphicNovel, replacement: " " },
        { pattern: patterns.hardcover, replacement: " " },
        { pattern: patterns.limited, replacement: " Limited " },
        { pattern: patterns.mature, replacement: " " },
        { pattern: patterns.miniSeries, replacement: " " },
        { pattern: patterns.number, replacement: " " },
        { pattern: patterns.ofThe, replacement: " of the " },
        { pattern: patterns.omnibus, replacement: " " },
        { pattern: patterns.operatingAs, replacement: " " },
        { pattern: patterns.original, replacement: " Original " },
        { pattern: patterns.reprint, replacement: " " },
        { pattern: patterns.resolicit, replacement: " " },
        { pattern: patterns.signature, replacement: " Signature " },
        { pattern: patterns.subsequentPrintingNum, replacement: " " },
        { pattern: patterns.theNextGeneration, replacement: " The Next Generation " },
        { pattern: patterns.tradePaperback, replacement: " " },
        { pattern: patterns.trailingParentheses, replacement: " " },
        { pattern: patterns.useOtherDiamondID, replacement: " " },
        { pattern: patterns.variant, replacement: " " },
        { pattern: patterns.volume, replacement: " " },
        { pattern: patterns.years, replacement: " Years " },
    ]

    let cleanedTitle = title
    cleanedTitle = removeVariantFromTitle(cleanedTitle)
    cleanedTitle = removeCreatorNamesFromTitle(cleanedTitle, creators)

    itemsToClean.forEach(
        (item) => (cleanedTitle = cleanedTitle.replace(item.pattern, item.replacement))
    )

    cleanedTitle = toProperCasing(cleanedTitle)
    cleanedTitle = cleanedTitle.trim()

    return cleanedTitle
}

async function getParsedComic(comic) {
    logger.info(`# Parsing ${comic.title} scraped from ${comic.url}`)
    const parsedComic = {}

    parsedComic.diamondID = comic.diamondID
    parsedComic.publisher = { id: null, name: comic.publisher.name }
    parsedComic.releaseDate = getFormattedReleaseDate(comic.releaseDate)
    parsedComic.coverPrice = comic.coverPrice
    parsedComic.cover = comic.coverURL
    parsedComic.description = comic.description
    parsedComic.creators = getParsedCreatorsFromNodes(comic.creators)
    parsedComic.format = comic.format
    parsedComic.solicitationDate = getSolicitDateFromDiamondID(parsedComic.diamondID)
    if (!comic.title) logger.error(`! The comic title was not found`)
    else {
        parsedComic.title = comic.title
        parsedComic.printingNumber = getPrintingNumberFromTitle(comic.title)
        parsedComic.coverLetter = getCoverLetterFromTitle(comic.title)
        parsedComic.versionOf = null
        parsedComic.variantType = getVariantTypeFromTitle(parsedComic.title)
        parsedComic.ageRating = parsedComic.title.match(patterns.mature) ? "MA" : ""
        parsedComic.isMiniSeries = parsedComic.title.match(patterns.miniSeries) !== null
        if (parsedComic.isMiniSeries)
            parsedComic.miniSeriesLimit = getMiniSeriesLimitFromTitle(parsedComic.title)
        else parsedComic.miniSeriesLimit = 0
        parsedComic.isOneShot = parsedComic.title.match(patterns.oneShot) !== null
        if (parsedComic.format !== "Comic") parsedComic.format = getFormatFromTitle(comic.title)
        parsedComic.itemNumber = getItemNumberFromTitle(parsedComic.title, parsedComic.format)
        parsedComic.title = getCleanedTitle(parsedComic.title, parsedComic.creators)
        parsedComic.series = {
            id: null,
            name: comic.series.link
                ? getCleanedTitle(comic.series.name, parsedComic.creators)
                : parsedComic.title,
        }
    }
    logger.info(JSON.stringify(parsedComic, null, " "))

    return parsedComic
}

module.exports = getParsedComic
