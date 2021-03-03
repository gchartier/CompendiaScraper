const { infoLogger } = require("../../../utils/logger.js")

function getCreatorsFromType(creator) {
    const creatorTypes = [
        { name: "Writer", matches: (node) => node.match(/\(W\)/i), value: [1] },
        { name: "Artist", matches: (node) => node.match(/\(A\)/i), value: [2] },
        { name: "Cover Artist", matches: (node) => node.match(/\(CA\)/i), value: [3] },
        {
            name: "Artist / Cover Artist",
            matches: (node) => node.match(/\(A\/CA\)/i),
            value: [2, 3],
        },
    ]

    const creators = []
    creatorTypes.forEach((type) => {
        if (type.matches(creator.type)) {
            type.value.forEach((value) => {
                creators.push({
                    name: creator.name.substring(1),
                    type: value,
                })
            })
        }
    })

    return creators
}

function appendCreatorToList(creator, creators) {
    creator.name = creator.name.replace(",", "")
    creators.push.apply(creators, getCreatorsFromType(creator))
    creator.name = ""
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
        const creator = { name: "", type: 0 }

        nodes.forEach((node, index, nodes) => {
            if (isNameNode(node)) {
                creator.name = creator.name.concat(" " + node)
                if (isEndOfNameNode(node)) appendCreatorToList(creator, creators)
            } else if (isCreatorTypeNode(node)) {
                if (creator.name) appendCreatorToList(creator, creators)
                creator.type = node
            }

            if (isLastNode(nodes, index)) appendCreatorToList(creator, creators)
        })

        return getFilteredUniqueCreators(creators)
    }
}

module.exports = getCreatorsFromNodes
