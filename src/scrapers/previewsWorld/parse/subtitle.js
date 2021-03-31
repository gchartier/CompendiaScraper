const patterns = require("../patterns.js")
const logger = require("../../../utils/logger.js")
const { removeSegmentFromTitle } = require("./util.js")
const convertToProperCasing = require("../../../utils/convertToProperCasing.js")
const { getTitleAsPaddedArray, getStringFromPaddedArray } = require("./util.js")

function getTitleOverflowFromTitle(title, itemNumber) {
    let trailingWords = ""
    if (!itemNumber)
        logger.error("! Item Number expected but not found, skipping retrieval of title overflow.")
    else {
        const regExpItemNumber = itemNumber.replace("(", "\\(").replace(")", "\\)").trim()
        const match = new RegExp(` ${regExpItemNumber} ((\\w+ )+)`, "gi")
        const itemNumberWithTrailingWords = title.match(match)
        trailingWords =
            itemNumberWithTrailingWords !== null
                ? itemNumberWithTrailingWords[0].replace(itemNumber, " ").trim()
                : ""
        if (trailingWords)
            logger.warn(
                "! There were trailing words found in the title, they may need to be manually parsed."
            )
    }

    return trailingWords
}

function getAdditionalSubtitle(title) {
    const subtitles = []
    const progPack = title.match(patterns.progPack)
    if (progPack !== null) subtitles.push(progPack[0])

    const seasonSpecialYear = title.match(patterns.seasonSpecialYear)
    if (seasonSpecialYear !== null) subtitles.push(seasonSpecialYear[0])

    if (subtitles.length < 1) subtitles.push("")
    if (subtitles.length > 1)
        logger.warn("! Multiple subtitles found for comic, needs manual parsing")

    return subtitles[0]
}

function getSubtitleFromTitle(title) {
    function isFormatOrNumber(word) {
        return (
            word.match(patterns.formatNumber) !== null ||
            word.match(patterns.formatAndNumberTypes) !== null ||
            word.match(patterns.number) !== null
        )
    }

    const words = getTitleAsPaddedArray(title, true)
    const subtitleWords = []
    let isEndReached = false
    words.forEach((word) => {
        if (isFormatOrNumber(word)) isEndReached = true
        if (!isEndReached) subtitleWords.push(word)
    })

    return getStringFromPaddedArray(subtitleWords, true)
}

function getCleanedSubtitle(subtitle, creators) {
    function removeTrailingCreatorNamesFromSubtitle(creators, subtitleArray) {
        const joinedCreatorNames = creators
            .reduce((acc, curr) => {
                const nameParts = curr.name.split(" ")
                nameParts.forEach((part) => acc.push(part))
                return acc
            }, [])
            .join("|")
        return getStringFromPaddedArray(
            subtitleArray.filter(
                (word) => word.match(new RegExp(` (${joinedCreatorNames}) `, "ig")) === null
            )
        )
    }

    const wordsToClean = [
        { pattern: patterns.adventure, replacement: " Adventure " },
        { pattern: patterns.collection, replacement: " Collection " },
        { pattern: patterns.directMarket, replacement: " " },
        { pattern: patterns.finalOrderCutoff, replacement: " " },
        { pattern: patterns.kingInBlack, replacement: " King in Black " },
        { pattern: patterns.ofThe, replacement: " of the " },
        { pattern: patterns.original, replacement: " Original " },
        { pattern: patterns.years, replacement: " Years " },
    ]

    const subtitleArray = getTitleAsPaddedArray(subtitle, false)
    let cleanedSubtitle =
        creators && creators.length > 0
            ? removeTrailingCreatorNamesFromSubtitle(creators, subtitleArray)
            : ""
    wordsToClean.forEach(
        (word) => (cleanedSubtitle = cleanedSubtitle.replace(word.pattern, word.replacement))
    )
    cleanedSubtitle = convertToProperCasing(cleanedSubtitle)

    return cleanedSubtitle ? cleanedSubtitle.trim() : null
}

function parseSubtitleFromTitle(comic) {
    if (comic.format === "Comic") {
        comic.titleOverflow = getTitleOverflowFromTitle(comic.title, comic.unparsedItemNumber)
        comic.title = removeSegmentFromTitle(comic.title, comic.titleOverflow)
        comic.unparsedSubtitle = getAdditionalSubtitle(comic.title)
        comic.title = removeSegmentFromTitle(comic.title, comic.unparsedSubtitle)
        comic.subtitle = getCleanedSubtitle(comic.unparsedSubtitle, comic.creators)
    } else {
        comic.unparsedSubtitle = getSubtitleFromTitle(comic.title)
        comic.title = removeSegmentFromTitle(comic.title, comic.unparsedSubtitle)
        comic.subtitle = getCleanedSubtitle(comic.unparsedSubtitle, comic.creators)
    }

    return comic.subtitle
}

module.exports = { parseSubtitleFromTitle, getAdditionalSubtitle }
