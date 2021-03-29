const patterns = require("../patterns.js")

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

function removeSegmentFromTitle(title, segment) {
    return title.replace(segment, " ")
}

function isFilterOut(comic) {
    return comic.title.match(patterns.atlasSignatureEdition) !== null
}

module.exports = {
    getTitleAsPaddedArray,
    getStringFromPaddedArray,
    removeSegmentFromTitle,
    isFilterOut,
}
