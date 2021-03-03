const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const creatorSchema = new mongoose.Schema({
    _id: ObjectId,
    name: String,
    type: Number,
    entries: [ObjectId],
})

const creatorModel = mongoose.model("Creators", creatorSchema)

module.exports = { creatorModel, creatorSchema }
