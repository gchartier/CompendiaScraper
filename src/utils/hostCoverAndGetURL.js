const fs = require("fs")
const util = require("util")
const axios = require("axios")
const aws = require("aws-sdk")
const stream = require("stream")
const logger = require("./logger.js")

async function downloadCoverFromURL(coverURL) {
    const imageResponse = await axios({ method: "GET", url: coverURL, responseType: "stream" })
    const coverWriteStream = fs.createWriteStream("cover.jpg")
    const asyncStreamPipeline = util.promisify(stream.pipeline)
    await asyncStreamPipeline(imageResponse.data, coverWriteStream)
}

async function uploadCoverImageToS3(comicID) {
    aws.config.update({
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        region: "us-east-2",
    })
    const s3 = new aws.S3()
    const cover = fs.readFileSync("cover.jpg")
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${comicID}.jpg`,
        Body: cover,
        ACL: "public-read",
        ContentType: "image/jpg",
    }
    const response = await s3.upload(params).promise()
    console.log(`${JSON.stringify(response)}`)
    return response.location
}

async function hostCoverAndGetURL(coverURL, comicID) {
    try {
        await downloadCoverFromURL(coverURL)
        const coverS3URL = await uploadCoverImageToS3(comicID)
        if (!coverS3URL) throw new Error("Expected to receive URL back from S3 but did not")

        return coverS3URL
    } catch (error) {
        logger.error(
            `! Failed download image and upload to S3 for ${coverURL} with error: ${JSON.stringify(
                error
            )}`
        )
    }
}

module.exports = hostCoverAndGetURL
