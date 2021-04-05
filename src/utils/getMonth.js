function getMonthFromAbbreviation(abbreviation) {
  switch (abbreviation) {
    case "JAN":
      return "January"
    case "FEB":
      return "February"
    case "MAR":
      return "March"
    case "APR":
      return "April"
    case "MAY":
      return "May"
    case "JUN":
      return "June"
    case "JUL":
      return "July"
    case "AUG":
      return "August"
    case "SEP":
      return "September"
    case "OCT":
      return "October"
    case "NOV":
      return "November"
    case "DEC":
      return "December"
  }
}

module.exports = getMonthFromAbbreviation
