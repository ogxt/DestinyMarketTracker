module.exports = {
    "interval" : 150, // Interval to update price,
    "rollingAverageMode": { // Graph will use rolling average price values instead of raw price
        "active": true,
        "averageSampleSize": 11,
        "useWeightedAverage": true,
        "weights": [0.1, 0.2, 0.3, 0.5, 0.7, 1, 0.7, 0.5, 0.3, 0.2, 0.1] // Make sure weights length is the same size as averageSampleSize
    },
    "randomPriceTestMode": { // Testing config to use random prices instead of API data
        "active": false,
        "changeInterval": 3000, // Price re-randomised by this amount of ms
        "minPrice": 0,
        "maxPrice": 100
    },
    "watermark" : "DGG.EXCHANGE", // Graph watermark
    "lineWidth" : 5,
}