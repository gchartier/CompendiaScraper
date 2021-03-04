const { infoLogger } = require("../../../utils/logger.js")

function getCreatorTypesFromScrapedCreator(scrapedCreator, existingTypes) {
    const creatorTypes = [
        { name: "Writer", matches: (node) => node.match(/\(W\)/i), values: ["W"] },
        { name: "Artist", matches: (node) => node.match(/\(A\)/i), values: ["A"] },
        { name: "Cover Artist", matches: (node) => node.match(/\(CA\)/i), values: ["CA"] },
        {
            name: "Artist / Cover Artist",
            matches: (node) => node.match(/\(A\/CA\)/i),
            values: ["A", "CA"],
        },
    ]

    const types = []
    creatorTypes.forEach((type) => {
        if (type.matches(scrapedCreator.type))
            type.values.forEach((value) => {
                if (!existingTypes.includes(value)) types.push(value)
            })
    })

    return types
}

function addScrapedCreatorToList(scrapedCreator, creators) {
    scrapedCreator.name = scrapedCreator.name.replace(",", "").substring(1)
    const index = creators.findIndex((c) => c.name === scrapedCreator.name)
    if (index)
        creators[index].types.push.apply(
            creators[index].types,
            getCreatorTypesFromScrapedCreator(scrapedCreator, creators[index].types)
        )
    else
        creators.push({
            name: scrapedCreator.name,
            types: getCreatorTypesFromScrapedCreator(scrapedCreator, []),
        })
    scrapedCreator.name = ""
}

function getIndexOfFirstMatchingCreator(creators, creatorToMatch) {
    return creators.findIndex(
        (c) => c.name === creatorToMatch.name && c.type === creatorToMatch.type
    )
}

function creatorNameIsValid(creatorName) {
    return (
        creatorName.match(/Photo/i) === null &&
        creatorName.match(/More/i) === null &&
        creatorName.match(/Blank Cover/i) === null
    )
}

function getFilteredUniqueCreators(creators) {
    return creators.filter(
        (creator, index, self) =>
            getIndexOfFirstMatchingCreator(self, creator) === index &&
            creatorNameIsValid(creator.name)
    )
}

function isEndOfNameNode(node) {
    return node.includes(",")
}

function isCreatorTypeNode(node) {
    return node.includes("(")
}

function isNameNode(node) {
    return node && !isCreatorTypeNode(node)
}

function isLastNode(nodeList, index) {
    return nodeList.length - 1 === index
}

function getCreatorsFromNodes(nodes) {
    if (!nodes) infoLogger.error(`! No comic creator nodes`)
    else {
        const creators = []
        const scrapedCreator = { name: "", types: [] }

        nodes.forEach((node, index, nodes) => {
            if (isNameNode(node)) {
                scrapedCreator.name = scrapedCreator.name.concat(" " + node)
                if (isEndOfNameNode(node)) addScrapedCreatorToList(scrapedCreator, creators)
            } else if (isCreatorTypeNode(node)) {
                if (scrapedCreator.name) addScrapedCreatorToList(scrapedCreator, creators)
                scrapedCreator.type = node
            }

            if (isLastNode(nodes, index)) addScrapedCreatorToList(scrapedCreator, creators)
        })

        return getFilteredUniqueCreators(creators)
    }
}

module.exports = getCreatorsFromNodes
