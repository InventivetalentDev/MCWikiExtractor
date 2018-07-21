const fs = require("fs");

const helpers = require("../lib/helpers");

const Block = require("../lib/block");

Block.getBlockIndex().then((blocks) => {

    let promises = [];

    for (let i = 0; i < blocks.length; i++) {
        promises.push(helpers.delay(500));
        promises.push(new Promise((resolve => {
            Block.getBlockData(blocks[i]).then((data) => {
                resolve(data)
            }, (err) => {
                console.warn(err);
                resolve(null);
            })
        })));
    }

    Promise.all(promises).then((blockData) => {
        let allBlocks = {};

        for (let i = 0; i < blockData.length; i++) {
            if (blockData[i]) {
                allBlocks[blockData[i].key] = blockData[i];
            }
        }

        fs.writeFile("out/blocks.json", JSON.stringify(helpers.sortObject(allBlocks), null, 2), "utf8", function (err) {
            console.log(err);
        });
    })
});
