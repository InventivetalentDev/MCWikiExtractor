const cheerio = require("cheerio");
const request = require("request");

const helpers = require("./helpers");
const parseBool=helpers.parseBool;
const parseNumber=helpers.parseBool;
const parseDataValues=helpers.parseDataValues;

const BASE_URL = "https://minecraft.gamepedia.com";
const ITEM_URL = BASE_URL + "/Item";


function getItemIndex() {
    return new Promise((resolve, reject) => {
        request(ITEM_URL, function (err, res, body) {
            if (err) {
                reject(err);
                return;
            }
            if (res.statusCode !== 200) {
                reject(res.statusCode);
                return;
            }

            let $ = cheerio.load(body);

            let blocks = [];

            $(".invslot").each(function () {
                let link = $(this).find("a");
                blocks.push(link.attr("href"));
            });

            resolve(blocks);
        })
    })
}

const infoBoxParsers = {
    "renewable": parseBool,
    "stackable": function (string) {
        if (string.indexOf(" ") !== -1) {
            string = string.replaceAll("\\(", "").replaceAll("\\)", "");
            let split = string.split(" ");

            return parseNumber(split[1]);
        } else {
            return parseBool(string);
        }
    },
    "name": function (string, td, $) {
        if (string === "see data values") {
            return parseDataValues($)
        }

        return string;
    },
};

function getItemData(link) {
    return new Promise((resolve, reject) => {
        request(BASE_URL + link, function (err, res, body) {
            if (err) {
                reject(err);
                return;
            }
            if (res.statusCode !== 200) {
                reject(res.statusCode);
                return;
            }

            let $ = cheerio.load(body);

            let title = $(".mcwiki-header.infobox-title");

            let infoBox = {};

            let infoRows = $(".infobox-rows");
            infoRows.find("tr").each(function (i) {
                let $this = $(this);

                let name = $this.find("th").first().text();
                name = name.toLowerCase().replaceAll(" ", "_");

                let td = $this.find("td").first();
                let value = td.text();
                value = value.toLowerCase().replaceAll("\\n", "");

                if (infoBoxParsers.hasOwnProperty(name)) {
                    value = infoBoxParsers[name](value, td, $, title);
                }

                infoBox[name] = value;
            });

            resolve(Object.assign({},
                {
                    key: title.text().toLowerCase().replaceAll(" ", "_"),
                    title: title.text(),
                    link: link
                },
                infoBox))
        })
    })
}


module.exports={
    getItemIndex:getItemIndex,
    getItemData:getItemData
}