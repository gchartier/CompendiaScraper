const patterns = require("../patterns.js")

function prepareTitleForParsing(title) {
  return ` ${title
    .replace(patterns.spacesBeginningAndEnd, "")
    .replace(patterns.spaces, " ")} `.toUpperCase()
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

function removeSegmentFromTitle(title, segment) {
  return title.replace(segment, " ")
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
    { pattern: patterns.useOtherDiamondID, replacement: " " }
  ]

  let cleanedTitle = title
  itemsToRemove.forEach(
    (item) => (cleanedTitle = cleanedTitle.replace(item.pattern, item.replacement))
  )

  return cleanedTitle
}

module.exports = {
  prepareTitleForParsing,
  getTitleAsPaddedArray,
  getStringFromPaddedArray,
  removeSegmentFromTitle,
  removeUnneededWordsFromTitle
}
