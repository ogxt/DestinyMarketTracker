const randomLightColor = require("seed-to-color").randomLightColor;
const Color = require("color");

/**
 * Generates a light color from a seed
 * @param {string} seed The seed to generate the color from
 * @returns {object} The generated color
 */
module.exports.getColor = function(seed){
    return Color(`#${randomLightColor(seed)}`);
}