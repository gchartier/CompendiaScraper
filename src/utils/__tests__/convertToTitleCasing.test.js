const {
  capitalizeAllWords,
  formatUppercaseWords,
  formatLowercaseWords,
  formatRomanNumerals,
  formatFirstWordAndWordsAfterColon,
  convertToTitleCasing
} = require("../convertToTitleCasing")
const cases = require("jest-in-case")

cases(
  "capitalizeAllWords",
  (opts) => {
    expect(capitalizeAllWords(opts.input)).toBe(opts.output)
  },
  [
    { name: "Blank string returns blank string", input: "", output: "" },
    { name: "no input returns blank string", input: undefined, output: "" },
    {
      name: "Single word returns capitalized single word",
      input: "title",
      output: "Title"
    },
    {
      name: "Uncapitalized title returns capitalized title",
      input: "this is my title",
      output: "This Is My Title"
    }
  ]
)

cases(
  "formatLowercaseWords",
  (opts) => {
    expect(formatLowercaseWords(opts.input)).toBe(opts.output)
  },
  [
    { name: "Blank string returns blank string", input: "", output: "" },
    { name: "No input returns blank string", input: undefined, output: "" },
    {
      name: "All words are properly lowercased",
      input:
        " Title An The And But Or Nor As At By For From In Into Near Of On Onto To With ",
      output:
        " Title an the and but or nor as at by for from in into near of on onto to with "
    }
  ]
)

cases(
  "formatUppercaseWords",
  (opts) => {
    expect(formatUppercaseWords(opts.input)).toBe(opts.output)
  },
  [
    { name: "Blank string returns blank string", input: "", output: "" },
    { name: "No input returns blank string", input: undefined, output: "" },
    {
      name: "All words are properly uppercased",
      input: " Title id tv b&w b.p.r.d tmnt cgc ad bc ",
      output: " Title ID TV B&W B.P.R.D TMNT CGC AD BC "
    }
  ]
)

cases(
  "formatRomanNumerals",
  (opts) => {
    expect(formatRomanNumerals(opts.input)).toBe(opts.output)
  },
  [
    { name: "Blank string returns blank string", input: "", output: "" },
    { name: "No input returns blank string", input: undefined, output: "" },
    {
      name: "Roman numerals are capitalized",
      input: " King Richard iii ",
      output: " King Richard III "
    }
  ]
)

cases(
  "formatFirstWordAndWordsAfterColon",
  (opts) => {
    expect(formatFirstWordAndWordsAfterColon(opts.input)).toBe(opts.output)
  },
  [
    { name: "Blank string returns blank string", input: "", output: "" },
    { name: "No input returns blank string", input: undefined, output: "" },
    {
      name: "First word is capitalized",
      input: " the First Word ",
      output: " The First Word "
    },
    {
      name: "Word after colon is capitalized",
      input: " Title Word: after Colon ",
      output: " Title Word: After Colon "
    }
  ]
)

cases(
  "convertToTitleCasing",
  (opts) => {
    expect(convertToTitleCasing(opts.input)).toBe(opts.output)
  },
  [
    { name: "Blank string returns blank string", input: "", output: "" },
    { name: "No input returns blank string", input: undefined, output: "" },
    {
      name: "Title is properly cased",
      input: " and this is my title: the vi iteration of the 1ST title tv ",
      output: " And This Is My Title: The VI Iteration of the 1st Title TV "
    },
    {
      name: "Title is properly cased when first word is the",
      input: " The title is here ",
      output: " The Title Is Here "
    }
  ]
)
