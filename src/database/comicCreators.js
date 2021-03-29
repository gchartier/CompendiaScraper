const logger = require("../utils/logger")

async function insertNewComicCreator(client, creator, comicID) {
    const insert = `INSERT INTO comic_creators(creator_id, comic_id, creator_types) VALUES($1, $2, $3) RETURNING comic_creator_id`
    const params = [creator.id, comicID, creator.types]
    const result = await client.query(insert, params)
    if (result.rows.length < 1) throw new Error("! Comic creator was not inserted into DB")
    logger.info(`# Inserted new comic creator to database with name ${creatorName}`)
    return result.rows[0].creator_id
}

async function commitComicCreators(client, creators, comicID) {
    for (const creator of creators) await insertNewComicCreator(client, creator, comicID)
}

module.exports = commitComicCreators
