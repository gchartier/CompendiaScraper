const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const seriesSchema = new mongoose.Schema({
    _id: ObjectId,
    name: String,
    entries: [ObjectId],
})

const seriesModel = mongoose.model("Series", seriesSchema)

module.exports = seriesModel
