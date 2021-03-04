const mongoose = require("mongoose")
const getCreatorsFromNodes = require("./creator.js")
const comicModel = require("../../../models/comic.js")
const { infoLogger } = require("../../../utils/logger.js")
const toProperCasing = require("../../../utils/toProperCasing.js")
const getMonthFromAbbreviation = require("../../../utils/getMonth.js")

function getSolicitDateFromDiamondID(diamondID) {
    const solicitationTag = diamondID.slice(0, 5)
    return `${getMonthFromAbbreviation(solicitationTag.slice(0, 3))} 20${solicitationTag.slice(3)}`
}

function getPrintingNumberFromTitle(title) {
    const titleParts = title.split(" ")
    let printingNumber = "1"
    titleParts.forEach((part, index) => {
        if (part.match(/PTG/i))
            if (index > 0) {
                const printingNums = titleParts[index - 1].match(/\d+/g).map(Number)
                printingNums.forEach((num) => printingNumber.concat(num.toString))
            }
    })

    return printingNumber
}

function getFormatFromTitle(title) {
    let format = ""

    if (title.match(/ GN /i)) format = "Graphic Novel"
    else if (title.match(/ OMNIBUS HC /i)) format = "Omnibus Hardcover"
    else if (title.match(/ OMNIBUS /i)) format = "Omnibus"
    else if (title.match(/ TP /i)) format = "Trade Paperback"
    else if (title.match(/ HC /i) || title.match(/ HC Book /i)) format = "Hardcover"
    else format = "Comic"

    return format
}

function getMiniSeriesLimitFromTitle(title) {
    return title.match(/ \(OF \d+\) /i)[1].substring(5, title.match(/ \(OF \d+\) /i).length)
}

function getItemNumberFromTitle(title, format) {
    //TODO get item numbers for other types
    let itemNumber = ""

    if (format === "Comic") {
        if (title.match(/ #\d+ /)) {
            compiledComic.itemNumber = getItemNumberFromTitle(comic.title)
        } else compiledComic.itemNumber = "#1"
    }

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
    //cleanedTitle = cleanedTitle.replace(/ WR /i, " ")
    cleanedTitle = cleanedTitle.replace(/ \(NEW PTG\) /i, " New Printing ")
    cleanedTitle = cleanedTitle.replace(/ TNG /i, " The Next Generation ")
    cleanedTitle = cleanedTitle.replace(/ SGN /i, " Signature ")
    cleanedTitle = cleanedTitle.trim()
    cleanedTitle = toProperCasing(cleanedTitle)

    return cleanedTitle
}

async function getCompiledComic(comic) {
    const compiledComic = new comicModel({ _id: new mongoose.Types.ObjectId() })

    compiledComic.diamondID = comic.diamondID
    compiledComic.publisher = { id: null, name: comic.publisher.name }
    compiledComic.series = { id: null, name: comic.series.name }
    compiledComic.releaseDate = comic.releaseDate
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
        compiledComic.versionOf = null
        compiledComic.variantType = null
        if (compiledComic.title.match(/ CVR [A-Z]/i)) compiledComic.variantType = "cvr"
        if (compiledComic.title.match(/ \(NEW PTG\) /i) || compiledComic.title.match(/ NEW PTG /i))
            compiledComic.variantType = "spr"
        compiledComic.ageRating = compiledComic.title.match(/ \(MR\) /i) ? "MA" : ""
        compiledComic.isMiniSeries = compiledComic.title.match(/ \(OF \d+\) /i)
        if (comic.isMiniSeries)
            compiledComic.miniSeriesLimit = getMiniSeriesLimitFromTitle(comic.title)
        else compiledComic.miniSeriesLimit = 0
        compiledComic.isOneShot = compiledComic.title.match(/ ONE SHOT /i)
        if (compiledComic.format !== "Comic") compiledComic.format = getFormatFromTitle(comic.title)
        compiledComic.itemNumber = getItemNumberFromTitle(comic.title, comic.format)
        compiledComic.title = getCleanedTitle(comic.title)
    }

    return compiledComic
}

module.exports = getCompiledComic
