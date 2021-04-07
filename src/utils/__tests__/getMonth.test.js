const getMonthFromAbbreviation = require("../getMonth")
const cases = require("jest-in-case")

cases(
  "getMonthFromAbbreviation",
  (opts) => {
    expect(getMonthFromAbbreviation(opts.input)).toBe(opts.output)
  },
  [
    { name: "Blank abbreviation returns empty string", input: "", output: "" },
    {
      name: "Undefined abbreviation returns empty string",
      input: undefined,
      output: ""
    },
    {
      name: "JAN returns January",
      input: "JAN",
      output: "January"
    },
    {
      name: "FEB returns February",
      input: "FEB",
      output: "February"
    },
    {
      name: "MAR returns March",
      input: "MAR",
      output: "March"
    },
    {
      name: "APR returns April",
      input: "APR",
      output: "April"
    },
    {
      name: "MAY returns May",
      input: "MAY",
      output: "May"
    },
    {
      name: "JUN returns June",
      input: "JUN",
      output: "June"
    },
    {
      name: "JUL returns July",
      input: "JUL",
      output: "July"
    },
    {
      name: "AUG returns August",
      input: "AUG",
      output: "August"
    },
    {
      name: "SEP returns September",
      input: "SEP",
      output: "September"
    },
    {
      name: "OCT returns October",
      input: "OCT",
      output: "October"
    },
    {
      name: "NOV returns November",
      input: "NOV",
      output: "November"
    },
    {
      name: "DEC returns December",
      input: "DEC",
      output: "December"
    }
  ]
)
