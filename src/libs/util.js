const randomLightColor = require("seed-to-color").randomLightColor;
const Color = require("color");

/**
 * Generates a light color from a seed
 * @param {string} seed The seed to generate the color from
 * @returns {object} The generated color
 */
module.exports.getColor = function(seed){
    return Color(`#${randomLightColor(seed)}`).lighten(.05).saturate(1.5);
}

/**
 * Gets a random number in range
 * @param {number} min Minimum value in range
 * @param {number} max Maximum value in range
 * @returns {number} The random number
 */
module.exports.GetRandomInRange = function(min, max) {
    return Math.floor(Math.random() * (min - max) + max);
}

/**
 * Gets the average of an array of numbers
 * @param {object} arr Array of number values
 * @returns {number} The average
 */
module.exports.GetArrayAverage = function(arr) {
    return arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
}

/**
 * Gets the weighted average of an array of numbers
 * @param {object} arrValues Array of number values
 * @param {object} arrWeights Array of weights to apply to values
 * @returns {number} The weighted average
 */
module.exports.GetWeightedArrayAverage = function(arrValues, arrWeights) {
    let result = arrValues.map(function (value, i) {
        let weight = arrWeights[i];
        let sum = value * weight;
        return [sum, weight];
    }).reduce(function (p, c) {
        return [p[0] + c[0], p[1] + c[1]];
    }, [0, 0]);
    return result[0] / result[1];
}
