function capitalizeAllWords(str) {
  let stringToConvert = str && typeof str === "string" ? str : ""
  return stringToConvert.replace(
    /([^\W_]+[^\s-]*) */g,
    (match) => match.charAt(0).toUpperCase() + match.substr(1).toLowerCase()
  )
}

function formatLowercaseWords(str) {
  let lowercasedStr = str && typeof str === "string" ? str : ""
  const lowers = [
    "An",
    "The",
    "And",
    "But",
    "Or",
    "Nor",
    "As",
    "At",
    "By",
    "For",
    "From",
    "In",
    "Into",
    "Near",
    "Of",
    "On",
    "Onto",
    "To",
    "With"
  ]
  lowers.forEach((lower) => {
    lowercasedStr = lowercasedStr.replace(new RegExp(` ${lower} `, "ig"), (match) =>
      match.toLowerCase()
    )
  })

  return lowercasedStr
}

function formatUppercaseWords(str) {
  let uppercasedStr = str && typeof str === "string" ? str : ""
  const uppers = ["ID", "TV", "B&W", "B.P.R.D", "TMNT", "CGC", "AD", "BC"]
  uppers.forEach((upper) => {
    uppercasedStr = uppercasedStr.replace(new RegExp(` ${upper} `, "ig"), (match) =>
      match.toUpperCase()
    )
  })

  return uppercasedStr
}

function formatRomanNumerals(str) {
  let stringToConvert = str && typeof str === "string" ? str : ""
  return stringToConvert.replace(
    / (?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3}) /i,
    (match) => match.toUpperCase()
  )
}

function formatFirstWordAndWordsAfterColon(str) {
  let stringToConvert = str && typeof str === "string" ? str : ""

  stringToConvert = stringToConvert.replace(
    /^ \w+ /gi,
    (word) => ` ${word.charAt(1).toUpperCase()}${word.substr(2).toLowerCase()}`
  )
  stringToConvert = stringToConvert.replace(
    /: \w+ /gi,
    (word) => `: ${word.charAt(2).toUpperCase()}${word.substr(3).toLowerCase()}`
  )

  return stringToConvert
}

function convertToTitleCasing(str) {
  let properlyCasedStr = str && typeof str === "string" ? str : ""
  properlyCasedStr = capitalizeAllWords(properlyCasedStr)
  properlyCasedStr = formatLowercaseWords(properlyCasedStr)
  properlyCasedStr = formatUppercaseWords(properlyCasedStr)
  properlyCasedStr = formatRomanNumerals(properlyCasedStr)
  properlyCasedStr = formatFirstWordAndWordsAfterColon(properlyCasedStr)
  return properlyCasedStr
}

module.exports = {
  capitalizeAllWords,
  formatLowercaseWords,
  formatUppercaseWords,
  formatRomanNumerals,
  formatFirstWordAndWordsAfterColon,
  convertToTitleCasing
}
