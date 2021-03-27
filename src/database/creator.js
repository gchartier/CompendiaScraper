const logger = require("../utils/logger")

async function getExistingCreatorIDByName(client, creatorName) {
    const query = `SELECT creator_id FROM creators WHERE name = $1`
    const params = [creatorName]
    const result = await client.query(query, params)
    return result.rows && result.rows.length === 1 ? result.rows[0].creator_id : null
}

async function insertNewCreatorAndGetID(client, creatorName) {
    const insert = `INSERT INTO creators(name) VALUES($1) RETURNING creator_id`
    const params = [creatorName]
    const result = await client.query(insert, params)
    if (result.rows.length !== 1 || !result.rows[0].creator_id)
        throw new Error("Creator was not inserted")
    logger.info(`# Inserted new creator to database with name ${creatorName}`)
    return result.rows[0].creator_id
}

async function getCreatorsWithIDs(client, creators) {
    for (const creator of creators) {
        if (!creator.name) throw new Error("Creator name not valid")
        const creatorID = await getExistingCreatorIDByName(client, creator.name)
        creator.ID = creatorID ? creatorID : await insertNewCreatorAndGetID(client, creator.name)
    }
    return creators
}

module.exports = getCreatorsWithIDs
