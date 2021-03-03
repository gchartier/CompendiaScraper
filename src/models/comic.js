const mongoose = require("mongoose")
const { creatorSchema } = require("./creator")
const ObjectId = mongoose.Schema.Types.ObjectId

const comicSchema = new mongoose.Schema({
    title: String,
    format: Number,
    collectionType: Number,
    itemNumber: Number,
    publisherName: String,
    publisherID: ObjectId, // Set this in pre save
    imprintName: String,
    imprintID: ObjectId,
    releaseDate: Date,
    solicitationDate: String,
    coverPrice: Number,
    currency: String,
    printing: Number,
    variant: String,
    variantOf: ObjectId, // Set this in pre save
    versionOf: ObjectId,
    cover: String,
    pageCount: Number,
    description: String,
    synopsis: String,
    arc: String,
    arcID: ObjectId,
    characters: [String],
    isMature: Boolean,
    isMiniSeries: Boolean,
    isReprint: Boolean,
    isOneShot: Boolean,
    miniSeriesLimit: Number,
    collectedIn: [ObjectId],
    age: Number,
    barcode: String,
    diamondID: String,
    seriesName: String,
    seriesID: ObjectId,
    creators: [creatorSchema],
    createdAt: Date,
    updatedAt: Date,
    totalWant: Number,
    totalFavorited: Number,
    totalOwned: Number,
    totalRead: Number,
    avgRating: Number,
    totalRatings: Number,
    totalReviews: Number,
})

comicSchema.pre("save", function (next) {
    const today = Date.now()
    this.updatedAt = today
    if (!this.createdAt) this.createdAt = today
    next()
})

const comicModel = mongoose.model("Comics", comicSchema)

module.exports = comicModel
