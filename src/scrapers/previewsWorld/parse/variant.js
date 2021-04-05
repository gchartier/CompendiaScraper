const {
  getTitleAsPaddedArray,
  getStringFromPaddedArray,
  removeSegmentFromTitle
} = require("./util.js")
const patterns = require("../patterns.js")
const logger = require("../../../utils/logger.js")
const convertToProperCasing = require("../../../utils/convertToProperCasing.js")

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

function getVariantSegmentFromTitle(
  title,
  segmentDelimiterPatterns,
  searchDirection
) {
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
    ? getVariantSegmentFromTitle(title, [patterns.variant], "backwards")
    : ""
}

function getCoverDescriptionFromTitle(title) {
  return title.match(patterns.coverAsEnd) !== null
    ? getVariantSegmentFromTitle(title, [patterns.cover], "backwards")
    : ""
}

function getCoverLetterDescriptionFromTitle(title) {
  return title.match(patterns.coverLetter) !== null
    ? getVariantSegmentFromTitle(
        title,
        [patterns.cover, patterns.letter],
        "forwards"
      )
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
    { pattern: patterns.years, replacement: " Years " }
  ]

  const cleanedDescriptions = []
  descriptions.forEach((description) => {
    let newDescription = description
    newDescription = ` ${newDescription} `
    itemsToClean.forEach(
      (item) =>
        (newDescription = newDescription.replace(item.pattern, item.replacement))
    )
    newDescription = convertToProperCasing(newDescription)
    newDescription = newDescription.trim()
    if (newDescription !== "") cleanedDescriptions.push(newDescription)
  })

  return cleanedDescriptions.join("; ")
}

function getCoverLetterFromTitle(title) {
  let coverLetter = null
  const coverLetterMatch = title.match(patterns.coverLetter)
  if (coverLetterMatch !== null) {
    const matchString = coverLetterMatch.toString()
    const letter =
      matchString !== null ? matchString.substring(5, matchString.length - 1) : ""
    coverLetter = letter
    if (coverLetter.length < 1)
      logger.error(
        "! Cover letter from title was expected but not found. Potential error in title"
      )
  }

  return coverLetter
}

function getVariantTypesFromTitle(title) {
  const variantTypes = []
  if (
    title.match(patterns.coverLetter) ||
    title.match(patterns.cover) ||
    title.match(patterns.variant)
  )
    variantTypes.push("cvr")
  if (title.match(patterns.reprint)) variantTypes.push("rpr")
  if (title.match(patterns.subsequentPrintingNum)) variantTypes.push("spr")

  return variantTypes.length > 0 ? variantTypes : null
}

function parseVariantDescriptionFromTitle(comic) {
  comic.unparsedVariantDescription = getVariantDescriptionFromTitle(comic.title)
  comic.title = removeSegmentFromTitle(comic.title, comic.unparsedVariantDescription)
  comic.unparsedCoverDescription = getCoverDescriptionFromTitle(comic.title)
  comic.title = removeSegmentFromTitle(comic.title, comic.unparsedCoverDescription)
  comic.unparsedCoverLetterDescription = getCoverLetterDescriptionFromTitle(
    comic.title
  )
  comic.title = removeSegmentFromTitle(
    comic.title,
    comic.unparsedCoverLetterDescription
  )
  comic.unparsedAdditionalDescriptions = getAdditionalDescriptionsFromTitle(
    comic.title
  )
  comic.unparsedAdditionalDescriptions.forEach((description) => {
    comic.title = removeSegmentFromTitle(comic.title, description)
  })

  const variantDescription = getCleanedVariantDescription([
    comic.unparsedVariantDescription,
    comic.unparsedCoverDescription,
    ...comic.unparsedAdditionalDescriptions
  ])

  return variantDescription ? variantDescription : null
}

module.exports = {
  getCoverLetterFromTitle,
  getVariantTypesFromTitle,
  parseVariantDescriptionFromTitle
}
