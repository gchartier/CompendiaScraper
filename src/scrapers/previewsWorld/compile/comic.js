const mongoose = require("mongoose")
const getCreatorsFromNodes = require("./creator.js")
const { infoLogger } = require("../../../utils/logger.js")
const comicModel = require("../../../models/comic.js")
const toProperCasing = require("../../../utils/toProperCasing.js")
const getMonthFromAbbreviation = require("../../../utils/getMonth.js")

function getSolicitDateFromDiamondID(diamondID) {
    const solicitationTag = diamondID.slice(0, 5)
    return `${getMonthFromAbbreviation(solicitationTag.slice(0, 3))} 20${solicitationTag.slice(3)}`
}

function getPrintingNumberFromTitle(title) {
    const titleArray = title.split(" ")
    let printingNumber = "1"
    for (let i = 0; i < titleArray.length; i++)
        if (titleArray[i].match(/PTG/i))
            if (i > 0) {
                const printingNums = titleArray[i - 1].match(/\d+/g).map(Number)
                for (let i = 0; i < printingNums.length; i++)
                    printingNumber.concat(printingNums[i].toString)
            }

    return printingNumber
}

function getFormatFromTitle(title) {
    let format
    if (title.match(/ TP /i)) format = 2
    else if (title.match(/ HC /i)) format = 3
    else format = 1

    return format
}

function getCollectionTypeFromTitle(title) {
    let collectionType
    if (title.match(/ VOL /i)) collectionType = 1
    else if (title.match(/ BOOK /i)) collectionType = 2
    else if (title.match(/ OMNIBUS /i)) collectionType = 3
    else if (title.match(/ GN /)) collectionType = 4
    else if (title.match(/ PART /i)) collectionType = 5
    else collectionType = 0
    return collectionType
}

function getMiniSeriesLimitFromTitle(title) {
    return title.match(/ \(OF \d+\) /i)[1].substring(5, title.match(/ \(OF \d+\) /i).length)
}

function getItemNumberFromTitle(title) {
    const itemNumber = title.match(/ #\d+ /).toString()
    return itemNumber.substring(2, itemNumber.length - 1)
}

function getCleanedTitle(title) {
    let cleanedTitle = title

    cleanedTitle = cleanedTitle.replace(/ \(MR\) /i, "")
    cleanedTitle = cleanedTitle.replace(/ \( $/, "")
    cleanedTitle = cleanedTitle.replace(/ \(OF \d+\) /, "")
    cleanedTitle = cleanedTitle.replace(/ \(USE [A-Z]{3}\d+\) /i, "")
    cleanedTitle = cleanedTitle.replace(/ \(C /i, "")
    cleanedTitle = cleanedTitle.replace(/ \(RES\) /i, "")
    cleanedTitle = cleanedTitle.replace(/ VOL /i, " Vol. ")
    cleanedTitle = cleanedTitle.replace(/ CVR /i, " Cover ")
    cleanedTitle = cleanedTitle.replace(/ VAR /i, " Variant ")
    cleanedTitle = cleanedTitle.replace(/ LMT /i, " Limited ")
    cleanedTitle = cleanedTitle.replace(/ LT /i, " Limited ")
    cleanedTitle = cleanedTitle.replace(/ LTD /i, " Limited ")
    cleanedTitle = cleanedTitle.replace(/ ED /i, " Edition ")
    cleanedTitle = cleanedTitle.replace(/ PTG /i, " Printing ")
    cleanedTitle = cleanedTitle.replace(/ ANNIV /i, " Anniversary ")
    cleanedTitle = cleanedTitle.replace(/ GN /i, " Graphic Novel ")
    cleanedTitle = cleanedTitle.replace(/ DLX /i, " Deluxe ")
    cleanedTitle = cleanedTitle.replace(/ O\/T /i, " of the ")
    cleanedTitle = cleanedTitle.replace(/ ORIG /i, " Original ")
    cleanedTitle = cleanedTitle.replace(/ YRS /i, " Years ")
    cleanedTitle = cleanedTitle.replace(/ WR /i, " ")
    cleanedTitle = cleanedTitle.replace(/ \(NEW PTG\) /i, " New Printing ")
    cleanedTitle = cleanedTitle.replace(/ TNG /i, " The Next Generation ")
    cleanedTitle = cleanedTitle.replace(/ SGN /i, " Signature ")
    cleanedTitle = cleanedTitle.trim()
    cleanedTitle = toProperCasing(cleanedTitle)

    return cleanedTitle
}

async function getCompiledComic(comic, format) {
    const compiledComic = new comicModel({ _id: new mongoose.Types.ObjectId() })

    compiledComic.diamondID = comic.diamondID
    compiledComic.publisherName = comic.publisherName
    compiledComic.publisherID = null
    compiledComic.releaseDate = comic.releaseDate
    compiledComic.coverPrice = comic.coverPrice
    compiledComic.currency = comic.currency
    compiledComic.cover = comic.cover
    compiledComic.description = comic.description
    compiledComic.imprintName = ""
    compiledComic.imprintID = null
    compiledComic.pageCount = 0
    compiledComic.synopsis = ""
    compiledComic.arc = ""
    compiledComic.arcID = null
    compiledComic.characters = null
    compiledComic.collectedIn = null
    compiledComic.age = 4
    compiledComic.barcode = ""
    compiledComic.totalWant = 0
    compiledComic.totalFavorited = 0
    compiledComic.totalOwned = 0
    compiledComic.totalRead = 0
    compiledComic.avgRating = 0
    compiledComic.totalRatings = 0
    compiledComic.totalReviews = 0
    compiledComic.seriesName = comic.seriesName
    compiledComic.seriesID = null
    compiledComic.creators = getCreatorsFromNodes(comic.creators)

    if (!comic.diamondID || comic.diamondID.length < 5)
        infoLogger.error(`! Cannot set the solicitation date`)
    else compiledComic.solicitationDate = getSolicitDateFromDiamondID(comic.diamondID)

    if (!comic.title) infoLogger.error(`! The comic title was not found`)
    else {
        compiledComic.title = comic.title
        compiledComic.printingNumber = getPrintingNumberFromTitle(comic.title)
        // TODO variantOf and versionOf
        compiledComic.variantOf = null
        compiledComic.versionOf = null
        compiledComic.variant = "A"

        if (compiledComic.title.match(/ CVR [A-Z]/i) !== null)
            compiledComic.variant = compiledComic.title.match(/ CVR [A-Z]/i)[0].substring(5)

        compiledComic.isMature = compiledComic.title.match(/ \(MR\) /i) !== null
        compiledComic.isMiniSeries = compiledComic.title.match(/ \(OF \d+\) /i) !== null
        compiledComic.isReprint =
            compiledComic.title.match(/ \(NEW PTG\) /i) !== null ||
            compiledComic.title.match(/ NEW PTG /i) !== null
        compiledComic.isOneShot = compiledComic.title.match(/ ONE SHOT /i) !== null

        if (comic.isMiniSeries)
            compiledComic.miniSeriesLimit = getMiniSeriesLimitFromTitle(comic.title)
        else compiledComic.miniSeriesLimit = 0

        if (format === 1) compiledComic.format = 1
        else compiledComic.format = getFormatFromTitle(comic.title)

        compiledComic.collectionType = getCollectionTypeFromTitle(comic.title)

        // TODO: include this stuff -> VOL, HC, TP VOL 01, TP BOOK 01, HC BOOK 03, TP PART 01, HC VOL 04, OMNIBUS HC VOL 04, GN, GN VOL 03,
        if (compiledComic.format === 1)
            if (compiledComic.title.match(/ #\d+ /) !== null) {
                compiledComic.itemNumber = getItemNumberFromTitle(comic.title)
            } else compiledComic.itemNumber = 1

        compiledComic.title = getCleanedTitle(comic.title)
    }

    return compiledComic
}

module.exports = getCompiledComic
