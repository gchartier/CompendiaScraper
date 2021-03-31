const fs = require("fs")
const format = require("date-fns/format")

function writeReleasesToStagingFile(releases) {
    const date = format(new Date(), "yyyy-MM-dd")
    fs.writeFileSync(`log/${date}-StagedReleases.json`, JSON.stringify(releases, null, " "))
}

function readReleasesFromStagingFile() {
    const date = format(new Date(), "yyyy-MM-dd")
    const releases = JSON.parse(fs.readFileSync(`log/${date}-StagedReleases.json`))
    return releases
}

module.exports = {
    writeReleasesToStagingFile,
    readReleasesFromStagingFile,
}
