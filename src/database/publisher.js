const logger = require("../utils/logger")

async function getExistingPublisherIDByName(client, publisherName) {
  const query = `SELECT publisher_id FROM publishers WHERE name = $1`
  const params = [publisherName]
  const result = await client.query(query, params)
  return result.rows && result.rows.length === 1 ? result.rows[0].publisher_id : null
}

async function insertNewPublisherAndGetID(client, publisherName) {
  const insert = `INSERT INTO publishers(name) VALUES($1) RETURNING publisher_id`
  const params = [publisherName]
  const result = await client.query(insert, params)
  if (result.rows.length < 1) throw new Error("! Publisher was not inserted into DB")
  logger.info(`# Inserted new publisher to database with name ${publisherName}`)
  return result.rows[0].publisher_id
}

async function commitPublisher(client, publisherName) {
  if (!publisherName) throw new Error("! Publisher name was not valid")
  const publisherID = await getExistingPublisherIDByName(client, publisherName)
  return publisherID
    ? publisherID
    : await insertNewPublisherAndGetID(client, publisherName)
}

module.exports = commitPublisher
