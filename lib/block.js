const cheerio = require("cheerio");
const request = require("request");

const helpers = require("./helpers");
const parseBool=helpers.parseBool;
const parseNumber=helpers.parseBool;
const parseDataValues=helpers.parseDataValues;

const BASE_URL = "https://minecraft.gamepedia.com";
const BLOCK_URL = BASE_URL + "/Block";


function getBlockIndex() {
    return new Promise((resolve, reject) => {
        request(BLOCK_URL, function (err, res, body) {
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
    "transparency": parseBool,
    "luminance": function (string) {
        let n = parseNumber(string);
        if (isNaN(n)) {
            return false;
        }
        return n;
    },
    "blast_resistance": parseNumber,
    "tool": function (string, td, $) {
        if (string === "any tool") {
            return "any"
        }

        if (td.has("a")) {
            let link = td.find("a").first();
            let title = link.attr("title");
            return {
                key: title ? title.toLowerCase().replaceAll(" ", "_") : "n/a",
                name: title,
                link: link.attr("href")
            }
        }

        return string;
    },
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
    "flammable": parseBool,
    "drops": function (string, td, $, title) {
        if (td.has("ul") && td.has("li")) {
            let drops = [];
            td.find("li").each(function () {
                let $this = $(this);

                let text = $this.text();
                text = text.replaceAll("\\(", "").replaceAll("\\)", "");
                let split = text.split(" ");

                let name = split[0];

                let drop = {
                    key: name.toLowerCase().replaceAll(" ", "_"),
                    name: name
                };

                if (split.length > 1) {
                    let amountStr = split[1];
                    if (amountStr.indexOf("-") !== -1) {
                        let split1 = amountStr.split("–");// Note: This is an 'En dash', not a hyphen
                        drop.amount = {
                            min: parseNumber(split1[0]),
                            max: parseNumber(split1[1])
                        }
                    } else {
                        drop.amount = parseNumber(amountStr);
                    }
                }

                if ($this.has("a")) {
                    let link = $this.find("a").first();
                    drop.link = link.attr("href");
                }

                drops.push(drop);
            })

            return drops;
        } else {
            if (string === "none") {
                return [];
            } else if (string === "itself") {
                return [{
                    key: title.toLowerCase().replaceAll(" ", "_"),
                    name: title
                }]
            }
        }

        return [{
            name: string
        }];
    },
    "name": function (string, td, $) {
        if (string === "see data values") {
            return parseDataValues($)
        }

        return string;
    },
    "data_values": function (string, td, $) {
        let d;
        if ((d = parseDataValues($))) {
            return d;
        }

        return string;
    }
};

function getBlockData(link) {
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

module.exports = {
    getBlockIndex: getBlockIndex,
    getBlockData: getBlockData
}