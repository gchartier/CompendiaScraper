const { format } = require("date-fns")
const patterns = require("../patterns.js")
const logger = require("../../../utils/logger.js")
const getParsedCreatorsFromNodes = require("./creator.js")
const toProperCasing = require("../../../utils/toProperCasing.js")
const getMonthFromAbbreviation = require("../../../utils/getMonth.js")

function getPublisher(publisher) {
    if (!publisher)
        logger.error("! No publisher found from parsed data. Manual addition of publisher needed.")

    return { id: null, name: publisher && publisher.name ? publisher.name : "" }
}

function prepareTitleForParsing(title) {
    return ` ${title.replace(patterns.spacesBeginningAndEnd, "").replace(patterns.spaces, " ")} `
}

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
        logger.warn("! Item number not found from title. Setting as blank.")
        itemNumbers.push("")
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
    cleanedItemNum = toProperCasing(cleanedItemNum).trim()
    return cleanedItemNum
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
    if (
        title.match(patterns.coverLetter) ||
        title.match(patterns.cover) ||
        title.match(patterns.variant)
    )
        variantTypes.push("cvr")
    if (title.match(patterns.reprint)) variantTypes.push("rpr")
    if (title.match(patterns.subsequentPrintingNum)) variantTypes.push("spr")

    if (variantTypes.length > 1) logger.error("! More than one variant type found for this comic.")

    return variantTypes.length < 1 ? null : variantTypes[0]
}

function getTitleAsPaddedArray(title, reversed) {
    const paddedTitleArray = title
        .split(" ")
        .filter((word) => word !== "")
        .map((word) => ` ${word} `)
    return reversed ? paddedTitleArray.reverse() : paddedTitleArray
}

function getStringFromPaddedArray(words, reversed) {
    return reversed
        ? ` ${words
              .reverse()
              .map((word) => word.trim())
              .join(" ")} `
        : ` ${words.map((word) => word.trim()).join(" ")} `
}

function getSegmentFromTitle(title, segmentDelimiterPatterns, searchDirection) {
    function isLastWord(index, words) {
        return index === words.length - 1
    }

    function isCoverLetter({ word, index, words, searchDirection }) {
        return searchDirection === "forwards"
            ? word.match(patterns.cover) &&
                  !isLastWord(index, words) &&
                  words[index + 1].match(patterns.letter)
            : word.match(patterns.letter) &&
                  !isLastWord(index, words) &&
                  words[index + 1].match(patterns.cover)
    }

    function isSubsequentPrinting({ word, index, words, searchDirection }) {
        return searchDirection === "forwards"
            ? word.match(patterns.printingNum) &&
                  !isLastWord(index, words) &&
                  words[index + 1].match(patterns.printing)
            : word.match(patterns.printing) &&
                  !isLastWord(index, words) &&
                  words[index + 1].match(patterns.printingNum)
    }

    function isReprint({ word, index, words, searchDirection }) {
        return searchDirection === "forwards"
            ? word.match(patterns.reprintNew) &&
                  !isLastWord(index, words) &&
                  words[index + 1].match(patterns.reprintPrinting)
            : word.match(patterns.reprintPrinting) &&
                  !isLastWord(index, words) &&
                  words[index + 1].match(patterns.reprintNew)
    }

    function isFormatNumber({ word, index, words }) {
        return (
            word.match(patterns.number) ||
            (word.match(patterns.formatNumber) &&
                index < words.length - 1 &&
                words[index + 1].match(patterns.formatAndNumberTypes))
        )
    }

    function isFormat({ word }) {
        return word.match(patterns.formatAndNumberTypes)
    }

    function isMiniSeries({ word, index, words }) {
        return (
            word.match(patterns.miniSeriesNumber) &&
            index < words.length - 1 &&
            words[index + 1].match(patterns.miniSeriesInd)
        )
    }

    function isMature({ word }) {
        return word.match(patterns.mature)
    }

    function isEndOfTitleSegment(word, index, words, searchDirection) {
        const searchDetails = { word, index, words, searchDirection }
        return searchDirection === "forwards"
            ? isReprint(searchDetails) !== null ||
                  isSubsequentPrinting(searchDetails) !== null ||
                  isMature(searchDetails) ||
                  isFormat(searchDetails) !== null
            : isCoverLetter(searchDetails) !== null ||
                  isFormatNumber(searchDetails) !== null ||
                  isMiniSeries(searchDetails) !== null ||
                  isReprint(searchDetails) !== null ||
                  isSubsequentPrinting(searchDetails) !== null ||
                  isFormat(searchDetails) !== null
    }

    const words = getTitleAsPaddedArray(title, searchDirection === "backwards")
    const titleWordsStartingWithDelimiter = []
    let foundDelimiter = false
    const firstPattern = segmentDelimiterPatterns[0]
    const secondPattern = segmentDelimiterPatterns[1]
    words.forEach((word, index, words) => {
        if (segmentDelimiterPatterns.length === 1) {
            if (word.match(segmentDelimiterPatterns[0])) foundDelimiter = true
            if (foundDelimiter) titleWordsStartingWithDelimiter.push(word)
        } else if (segmentDelimiterPatterns.length === 2) {
            if (
                word.match(firstPattern) &&
                !isLastWord(index, words) &&
                words[index + 1].match(secondPattern)
            )
                foundDelimiter = true
            if (foundDelimiter) titleWordsStartingWithDelimiter.push(word)
        }
    })

    const segmentWords = []
    let isEndFound = false
    titleWordsStartingWithDelimiter.forEach((word, index, words) => {
        if (isEndOfTitleSegment(word, index, words, searchDirection)) isEndFound = true
        if (!isEndFound) segmentWords.push(word)
    })

    return getStringFromPaddedArray(segmentWords, searchDirection === "backwards")
}

function getVariantDescriptionFromTitle(title) {
    return title.match(patterns.variant) !== null
        ? getSegmentFromTitle(title, [patterns.variant], "backwards")
        : ""
}

function getCoverDescriptionFromTitle(title) {
    return title.match(patterns.coverAsEnd) !== null
        ? getSegmentFromTitle(title, [patterns.cover], "backwards")
        : ""
}

function getCoverLetterDescriptionFromTitle(title) {
    return title.match(patterns.coverLetter) !== null
        ? getSegmentFromTitle(title, [patterns.cover, patterns.letter], "forwards")
        : ""
}

function getAdditionalDescriptionsFromTitle(title) {
    const descriptions = []
    const marvelSelect = title.match(patterns.marvelSelect)
    const slipcaseEdition = title.match(patterns.slipcaseEdition)
    const slipcase = title.match(patterns.slipcase)
    if (marvelSelect !== null) descriptions.push(marvelSelect[0])
    if (slipcaseEdition !== null) descriptions.push(slipcaseEdition[0])
    if (slipcase !== null && slipcaseEdition === null) descriptions.push(slipcase[0])
    return descriptions
}

function getAdditionalSubtitle(title) {
    const subtitles = []
    const monthYearPack = title.match(patterns.monthYearPack)
    if (monthYearPack !== null) subtitles.push(monthYearPack[0])

    const seasonSpecialYear = title.match(patterns.seasonSpecialYear)
    if (seasonSpecialYear !== null) subtitles.push(seasonSpecialYear[0])

    if (subtitles.length < 1) subtitles.push("")
    if (subtitles.length > 1)
        logger.warn("! Multiple subtitles found for comic, needs manual parsing")

    return subtitles[0]
}

function getCleanedVariantDescription(descriptions) {
    const itemsToClean = [
        { pattern: patterns.adventure, replacement: " Adventure " },
        { pattern: patterns.anniversary, replacement: " Anniversary " },
        { pattern: patterns.blackAndWhite, replacement: " Black & White " },
        { pattern: patterns.collection, replacement: " Collection " },
        { pattern: patterns.cover, replacement: " Cover " },
        { pattern: patterns.directMarket, replacement: " Direct Market " },
        { pattern: patterns.deluxe, replacement: " Deluxe " },
        { pattern: patterns.edition, replacement: " Edition " },
        { pattern: patterns.editionWithParen, replacement: " Edition) " },
        { pattern: patterns.finalOrderCutoff, replacement: " " },
        { pattern: patterns.kingInBlack, replacement: " King in Black " },
        { pattern: patterns.limited, replacement: " Limited " },
        { pattern: patterns.marvelSelect, replacement: " Marvel Select Edition " },
        { pattern: patterns.ofThe, replacement: " of the " },
        { pattern: patterns.original, replacement: " Original " },
        { pattern: patterns.r, replacement: " " },
        { pattern: patterns.signature, replacement: " Signature " },
        { pattern: patterns.trailingParentheses, replacement: " " },
        { pattern: patterns.variant, replacement: " Variant " },
        { pattern: patterns.years, replacement: " Years " },
    ]

    const cleanedDescriptions = []
    descriptions.forEach((description) => {
        let newDescription = description
        newDescription = ` ${newDescription} `
        itemsToClean.forEach(
            (item) => (newDescription = newDescription.replace(item.pattern, item.replacement))
        )
        newDescription = toProperCasing(newDescription)
        newDescription = newDescription.trim()
        if (newDescription !== "") cleanedDescriptions.push(newDescription)
    })

    return cleanedDescriptions.join("; ")
}

function removeSegmentFromTitle(title, description) {
    return title.replace(description, " ")
}

function removeItemNumberFromTitle(title, itemNumber) {
    return title.replace(itemNumber, " ")
}

function getTrailingWordsFromTitle(title, itemNumber) {
    let trailingWords = ""
    if (!itemNumber)
        logger.error(
            "! Item Number expected but not found, skipping retrieval of trailing words from title."
        )
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

function getSubtitleFromTitle(title) {
    function isFormatOrNumber(word) {
        return (
            word.match(patterns.formatNumber) !== null ||
            word.match(patterns.formatAndNumberTypes) !== null ||
            word.match(patterns.number) !== null
        )
    }

    const words = getTitleAsPaddedArray(title, true)
    const subtitle = []
    let isEndReached = false
    words.forEach((word) => {
        if (isFormatOrNumber(word)) isEndReached = true
        if (!isEndReached) subtitle.push(word)
    })

    return getStringFromPaddedArray(subtitle, true)
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
    let cleanedSubtitle = removeTrailingCreatorNamesFromSubtitle(creators, subtitleArray)
    wordsToClean.forEach(
        (word) => (cleanedSubtitle = cleanedSubtitle.replace(word.pattern, word.replacement))
    )
    cleanedSubtitle = toProperCasing(cleanedSubtitle)

    return cleanedSubtitle.trim()
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
    cleanedTitle = toProperCasing(cleanedTitle).trim()

    if (cleanedTitle.length < 1) logger.error(`! Title is missing.`)
    if (cleanedTitle.match(/\s{2,}/gi))
        logger.error(`! Found extra space in title indicating an error in title parsing.`)

    return cleanedTitle
}

function isFilterOut(comic) {
    const test = comic.title.match(patterns.atlasSignatureEdition)
    return comic.title.match(patterns.atlasSignatureEdition) !== null
}

function getParsedComic(comic) {
    logger.info(`# Parsing ${comic.title} scraped from ${comic.url}`)
    const parsedComic = {}

    parsedComic.diamondID = comic.diamondID
    parsedComic.publisher = getPublisher(comic.publisher)
    parsedComic.releaseDate = getFormattedReleaseDate(comic.releaseDate)
    parsedComic.coverPrice = comic.coverPrice
    parsedComic.cover = comic.coverURL
    parsedComic.description = comic.description
    parsedComic.unparsedCreators = comic.creators
    parsedComic.unparsedTitle = comic.title
    parsedComic.creators = getParsedCreatorsFromNodes(comic.creators)
    parsedComic.format = comic.format
    parsedComic.solicitationDate = getSolicitDateFromDiamondID(parsedComic.diamondID)
    if (!comic.title) logger.error(`! The comic title was not found`)
    else {
        parsedComic.title = prepareTitleForParsing(comic.title)
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
        if (parsedComic.isOneShot)
            logger.warn("! Comic is one shot, there may be a one shot subtitle to parse.")
        if (parsedComic.format !== "Comic")
            parsedComic.format = getFormatFromTitle(parsedComic.title)
        parsedComic.itemNumber = getItemNumberFromTitle(parsedComic.title, parsedComic.format)
        parsedComic.variantDescription = getVariantDescriptionFromTitle(parsedComic.title)
        parsedComic.title = removeSegmentFromTitle(
            parsedComic.title,
            parsedComic.variantDescription
        )
        parsedComic.coverDescription = getCoverDescriptionFromTitle(parsedComic.title)
        parsedComic.title = removeSegmentFromTitle(parsedComic.title, parsedComic.coverDescription)
        parsedComic.coverLetterDescription = getCoverLetterDescriptionFromTitle(parsedComic.title)
        parsedComic.title = removeSegmentFromTitle(
            parsedComic.title,
            parsedComic.coverLetterDescription
        )
        parsedComic.additionalDescriptions = getAdditionalDescriptionsFromTitle(parsedComic.title)
        parsedComic.additionalDescriptions.forEach((description) => {
            parsedComic.title = removeSegmentFromTitle(parsedComic.title, description)
        })
        parsedComic.variantDescription = getCleanedVariantDescription([
            parsedComic.coverLetterDescription,
            parsedComic.variantDescription,
            parsedComic.coverDescription,
            ...parsedComic.additionalDescriptions,
        ])
        parsedComic.title = removeUnneededWordsFromTitle(parsedComic.title)
        if (parsedComic.format === "Comic") {
            parsedComic.titleOverflow = getTrailingWordsFromTitle(
                parsedComic.title,
                parsedComic.itemNumber
            )
            parsedComic.title = removeSegmentFromTitle(parsedComic.title, parsedComic.titleOverflow)
            parsedComic.subtitle = getAdditionalSubtitle(parsedComic.title)
            parsedComic.title = removeSegmentFromTitle(parsedComic.title, parsedComic.subtitle)
            parsedComic.subtitle = getCleanedSubtitle(parsedComic.subtitle, parsedComic.creators)
        } else {
            parsedComic.subtitle = getSubtitleFromTitle(parsedComic.title)
            parsedComic.title = removeSegmentFromTitle(parsedComic.title, parsedComic.subtitle)
            parsedComic.subtitle = getCleanedSubtitle(parsedComic.subtitle, parsedComic.creators)
        }
        parsedComic.title = removeItemNumberFromTitle(parsedComic.title, parsedComic.itemNumber)
        parsedComic.itemNumber = getCleanedItemNumber(parsedComic.itemNumber)
        parsedComic.title = getCleanedTitle(parsedComic.title)
        parsedComic.filterOut = isFilterOut(parsedComic)
        parsedComic.series = {
            id: null,
        }
        if (comic.series && comic.series.link) {
            parsedComic.series.name = comic.series.name
            //TODO finish cleaning this
        } else parsedComic.series.name = parsedComic.title
    }
    if (parsedComic.filterOut) logger.info("# Filtered out this release.")
    else logger.info(JSON.stringify(parsedComic, null, " "))

    return parsedComic
}

module.exports = getParsedComic
