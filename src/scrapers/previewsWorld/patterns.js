const patterns = {
  adventure: / ADV /i,
  anniversary: / ANNIV /i,
  artist: /\(A\)/i,
  artistAndCoverArtist: /\(A\/CA\)/i,
  atlasSignatureEdition: / ((SGN ATLAS ED)|(ATLAS ED)|(ATLAS (((\w+) )+)ED)|(ATLAS (((\w+) )+)SGN)|(ATLAS SGN)) /gi,
  blackAndWhite: / B&W /i,
  blankCover: / BLANK (CVR|COVER) /i,
  bprd: / BPRD /gi,
  collection: / COLL /i,
  compendium: / COMPENDIUM /i,
  compendiumGraphicNovelBookWithNum: / COMPENDIUM GN BOOK #?\d+ /i,
  compendiumHardcover: / COMPENDIUM HC /i,
  compendiumHardcoverVolumeWithNum: / COMPENDIUM HC VOL #?\d+ /i,
  compendiumHardcoverWithNum: / COMPENDIUM HC #?\d+ /i,
  compendiumTradePaperbackVolumeWithNum: / COMPENDIUM TP VOL #?\d+ /i,
  compendiumTradePaperbackWithNum: / COMPENDIUM TP #?\d+ /i,
  compendiumVolumeWithNum: / COMPENDIUM VOL #?\d+ /i,
  cosplay: / COSPLAY /i,
  cosplayPhotoCover: / COSPLAY PHOTO (CVR|COVER) /i,
  cover: / (CVR|CV) /gi,
  coverArtist: /\(CA\)/i,
  coverAsEnd: / (CVR|CV) $/i,
  coverFollowedByWord: / CVR [A-Z]{2,} /i,
  coverLetter: / CVR [A-Z] /i,
  coverSurroundedByWords: / [A-Z]{2,} CVR [A-Z]{2,} /i,
  deluxe: / DLX /i,
  directMarket: / DM /i,
  edition: / ED /i,
  editionWithParen: / ED\) /i,
  finalOrderCutoff: / FOC /i,
  formatAndNumberTypes: / (VOL|TP|HC|SC|GN|BOOK|PART|OMNIBUS|COMPENDIUM|EPISODE|SEASON|PROG) /i,
  formatNumber: / \d+ /gi,
  formatTypes: / (TP|HC|SC|GN|OMNIBUS|COMPENDIUM) /i,
  graphicNovel: / GN /i,
  graphicNovelHardcover: / ((GN HC)|(HC GN)) /gi,
  graphicNovelTradePaperbackVolumeWithNum: / GN TP VOL #?\d+ /i,
  graphicNovelTradePaperbackVolumeEpisodeWithNum: / GN TP VOL #?\d+ EPISODE #?\d+ /i,
  graphicNovelTradePaperbackWithNum: / GN TP #?\d+ /i,
  graphicNovelVolumeWithNum: / GN VOL #?\d+ /i,
  graphicNovelVolumeEpisodeWithNum: / GN VOL #?\d+ EPISODE #?\d+ /i,
  hardcover: / HC /i,
  hardcoverBookWithNum: / HC BOOK #?\d+ /i,
  hardcoverGraphicNovelVolumeWithNum: / HC GN VOL #?\d+ /i,
  hardcoverGraphicNovelVolumeEpisodeWithNum: / HC GN VOL #?\d+ EPISODE #?\d+ /i,
  hardcoverGraphicNovelWithNum: / HC GN #?\d+ /i,
  hardcoverPartWithNum: / HC PART #?\d+ /i,
  hardcoverVolumeWithNum: / HC VOL #?\d+ /i,
  hardcoverWithNum: / HC #?\d+ /i,
  kingInBlack: / KIB /i,
  leadingZeros: /\b0+/i,
  letter: / [A-Z] /i,
  limited: / (LMT|LTD|LT) /i,
  marvelMasterworks: / MMW /gi,
  marvelSelect: / MARVEL SELECT /gi,
  mature: / \(MR\) /i,
  miniSeries: / \(OF \d+\) /i,
  miniSeriesInd: / \(OF /i,
  miniSeriesNumber: / \d+\) /i,
  more: / More /i,
  net: / \(NET\) /i,
  number: / #\d+ /i,
  ofThe: / O\/T /i,
  omnibus: / OMNIBUS /i,
  omnibusGraphicNovelBookWithNum: / OMNIBUS GN BOOK #?\d+ /i,
  omnibusHardcover: / OMNIBUS HC /i,
  omnibusHardcoverVolumeWithNum: / OMNIBUS HC VOL #?\d+ /i,
  omnibusHardcoverWithNum: / OMNIBUS HC #?\d+ /i,
  omnibusTradePaperbackVolumeWithNum: / OMNIBUS TP VOL #?\d+ /i,
  omnibusTradePaperbackWithNum: / OMNIBUS TP #?\d+ /i,
  omnibusVolumeWithNum: / OMNIBUS VOL #?\d+ /i,
  oneShot: / ((ONE SHOT)|ONESHOT) /i,
  operatingAs: / \(O\/A\) /i,
  original: / ORIG /i,
  originalGraphicNovel: / ORIGINAL GN /gi,
  photo: / Photo /i,
  printing: / PTG /i,
  printingNum: / \d+[A-Z]+ /i,
  prog: / PROG /i,
  progPack: / ((JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC) )?(\d{4} PROG PACK|PROG PACK \d{4}) /gi,
  progWithNum: / PROG #?\d+ /i,
  psArtbooks: / PS ARTBOOKS /gi,
  psArtbooksMagazine: / PS ARTBOOKS MAGAZINE /gi,
  r: / \(R /i,
  reprint: / \(?NEW (PTG|ED|EDITION)\)? /i,
  reprintNew: / \(?NEW /i,
  reprintPrinting: / (PTG|ED|EDITION)\)? /i,
  resolicit: / \(RES\) /i,
  season: / SEASON (((\(?#?\d+\)?) )+)/gi,
  seasonSpecialYear: / (WINTER|FALL|SPRING|SUMMER) SPECIAL \d{4} /gi,
  seriesIndicator: /SERIES: /gi,
  signature: / SGN /i,
  slipcase: / SLIPCASE /gi,
  slipcaseEdition: / SLIPCASE (ED|EDITION) /gi,
  softcover: / SC /i,
  softee: / SOFTEE /i,
  softcoverBookWithNum: / SC BOOK #?\d+ /i,
  softcoverPartWithNum: / SC PART #?\d+ /i,
  softcoverVolumeWithNum: / SC VOL #?\d+ /i,
  softcoverWithNum: / SC #?\d+ /i,
  spaces: /\s+/g,
  spacesBeginningAndEnd: /^\s+|\s+$/g,
  subsequentPrinting: / (PTG|ED)\)? /i,
  subsequentPrintingNum: / \(?\d+[A-Z]+ (PTG|ED)\)? /i,
  theNextGeneration: / TNG /i,
  titleWithYear: /(((\w+) )+) \(?\d{4}\)?/gi,
  tradePaperback: / TP /i,
  tradePaperbackBookWithNum: / TP BOOK #?\d+ /i,
  tradePaperbackPartWithNum: / TP PART #?\d+ /i,
  tradePaperbackVolumeSeasonWithNum: / TP VOL #?\d+ SEASON #?\d+ /i,
  tradePaperbackVolumeWithNum: / TP VOL #?\d+ /i,
  tradePaperbackWithNum: / TP #?\d+ /i,
  trailingParentheses: / \(C? /i,
  useOtherDiamondID: / \(USE [A-Z]{3}\d+\) /i,
  variant: / (VAR|VA) /i,
  variantWithType: / \w+ (VAR|VA) /i,
  volume: / VOL /i,
  volumeWithNums: / VOL (((#?\d+) )+)/gi,
  writer: /\(W\)/i,
  years: / YRS /i
}

module.exports = patterns
