function convertToTitleCasing(str) {
  return str.replace(
    /([^\W_]+[^\s-]*) */g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

function formatLowercaseWords(str) {
  let lowercasedStr = str
  const lowers = [
    "An",
    "The",
    "And",
    "But",
    "Or",
    "For",
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
    lowercasedStr = lowercasedStr.replace(new RegExp(` ${lower} `, "ig"), (txt) =>
      txt.toLowerCase()
    )
  })

  return lowercasedStr
}

function formatUppercaseWords(str) {
  let uppercasedStr = str
  const uppers = ["ID", "TV", "B&W", "B.P.R.D", "TMNT", "CGC", "AD", "BC"]
  uppers.forEach((upper) => {
    uppercasedStr = uppercasedStr.replace(
      new RegExp(`\\b${upper}\\b`, "ig"),
      upper.toUpperCase()
    )
  })

  return uppercasedStr
}

function formatRomanNumerals(str) {
  return str.replace(
    / (?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3}) /i,
    (match) => match.toUpperCase()
  )
}

function convertToProperCasing(str) {
  let properlyCasedStr = convertToTitleCasing(str)
  properlyCasedStr = formatLowercaseWords(properlyCasedStr)
  properlyCasedStr = formatUppercaseWords(properlyCasedStr)
  properlyCasedStr = formatRomanNumerals(properlyCasedStr)
  return properlyCasedStr
}

module.exports = convertToProperCasing
