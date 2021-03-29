const fs = require("fs")
const util = require("util")
const axios = require("axios")
const aws = require("aws-sdk")
const stream = require("stream")
const logger = require("./logger.js")
const compareImages = require("resemblejs/compareImages")

async function getIsPlaceholderCover() {
    const cover = fs.readFileSync("Cover.jpg")
    const placeholder = fs.readFileSync("PreviewsWorldPlaceholder.jpg")
    const options = {
        output: {
            errorColor: {
                red: 255,
                green: 0,
                blue: 255,
            },
            errorType: "movement",
            transparency: 0.3,
            largeImageThreshold: 1200,
            useCrossOrigin: false,
            outputDiff: true,
        },
        scaleToSameSize: true,
        ignore: "antialiasing",
    }
    const data = await compareImages(cover, placeholder, options)

    return data && data.isSameDimensions && data.misMatchPercentage < 5.0
}

async function downloadCover(coverURL) {
    const imageResponse = await axios({ method: "GET", url: coverURL, responseType: "stream" })
    const coverWriteStream = fs.createWriteStream("Cover.jpg")
    const asyncStreamPipeline = util.promisify(stream.pipeline)
    await asyncStreamPipeline(imageResponse.data, coverWriteStream)
}

async function uploadCover(comicID, isPlaceholderCover) {
    aws.config.update({
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        region: "us-east-2",
    })
    const s3 = new aws.S3()
    const cover = fs.readFileSync(isPlaceholderCover ? "NoCover.jpg" : "Cover.jpg")
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${comicID}.jpg`,
        Body: cover,
        ACL: "public-read",
        ContentType: "image/jpg",
    }
    const response = await s3.upload(params).promise()
    return response.Location
}

async function parseCover(coverURL, comicID) {
    try {
        await downloadCover(coverURL)
        const isPlaceholderCover = await getIsPlaceholderCover()
        const coverS3URL = await uploadCover(comicID, isPlaceholderCover)
        if (!coverS3URL) throw new Error("Expected to receive URL back from S3 but did not")
        return coverS3URL
    } catch (error) {
        logger.error(
            `! Failed download image and upload to S3 for ${coverURL} with error: ${error.message}`
        )
    }
}

module.exports = parseCover
