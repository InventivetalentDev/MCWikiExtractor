String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function parseBool(string) {
    if (string === "true") return true;
    if (string === "false") return false;
    if (string === "yes") return true;
    if (string === "no") return false;
    return undefined;
}

function parseNumber(string) {
    return parseFloat(string);
}

function parseDataValues($) {
    if ($("body").has("#Data_values") && $("body").has("#ID")) {
        let dataValuesAnchor = $("#Data_values");
        let table = dataValuesAnchor.parent().nextAll("div > table.wikitable").first();

        let values = {};

        table.find("tr").each(function (i) {
            if (i === 0) return;// skip header

            let name = $(this).find("td").eq(0).text().trim();
            let key = $(this).find("td").eq(1).text().trim();

            if (key.startsWith("minecraft:")) {
                key = key.substr("minecraft:".length);
            }

            values[key] = name;
        })

        return values;
    }
}

function sortObject(obj) {
    let newObj = {};
    Object.keys(obj).sort().forEach(function (key) {
        newObj[key] = obj[key];
    });
    return newObj;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


module.exports = {
    parseBool: parseBool,
    parseNumber: parseNumber,
    parseDataValues: parseDataValues,
    sortObject: sortObject,
    delay: delay
}