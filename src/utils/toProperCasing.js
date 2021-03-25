function toProperCasing(str) {
    let i, j, lowers, uppers
    str = str.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    })

    // Certain minor words should be left lowercase unless
    // they are the first or last words in the string
    lowers = [
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
        "With",
    ]
    for (i = 0, j = lowers.length; i < j; i++)
        str = str.replace(new RegExp("\\s" + lowers[i] + "\\s", "ig"), function (txt) {
            return txt.toLowerCase()
        })

    // Certain words such as initialisms or acronyms should be left uppercase
    uppers = ["ID", "TV", "B&W", "BPRD", "TMNT", "CGC", "AD", "BC"]
    for (i = 0, j = uppers.length; i < j; i++)
        str = str.replace(new RegExp("\\b" + uppers[i] + "\\b", "ig"), uppers[i].toUpperCase())

    // Make roman numerals uppercase
    str = str.replace(
        / (?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3}) /i,
        function (match) {
            return match.toUpperCase()
        }
    )

    return str
}

module.exports = toProperCasing
