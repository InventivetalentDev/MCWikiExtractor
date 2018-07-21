const fs = require("fs");

const helpers = require("../lib/helpers");

const Item = require("../lib/item");

Item.getItemIndex().then((items) => {

    let promises = [];

    for (let i = 0; i < items.length; i++) {
        promises.push(helpers.delay(500));
        promises.push(new Promise((resolve => {
            Item.getItemData(items[i]).then((data) => {
                resolve(data)
            }, (err) => {
                console.warn(err);
                resolve(null);
            })
        })));
    }

    Promise.all(promises).then((itemData) => {
        let allItems = {};

        for (let i = 0; i < itemData.length; i++) {
            if (itemData[i]) {
                allItems[itemData[i].key] = itemData[i];
            }
        }

        fs.writeFile("out/items.json", JSON.stringify(helpers.sortObject(allItems), null, 2), "utf8", function (err) {
            console.log(err);
        });
    })
});


