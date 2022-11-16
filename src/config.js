module.exports = {
    "interval" : 200, // Interval to update price,
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
    "creators" : [
        {
            "username" : "memestiny",
            "id" : "lQdCwuc1OrZLUqgA4EwjPSSwG5Z2"
        },
        {
            "username" : "Cooley",
            "id" : "GgEwiiBGdmUrMJhqIOnH2rGCSSt1"
        },
        {
            "username" : "legolas",
            "id" : "WvM5DMB1zUdhBiGm6bOpw7LurAI3"
        }
    ],
    "contributors" : [
        {
            "name" : "legolas",
            "link" : "https://www.youtube.com/embed/rRPQs_kM_nw?autoplay=1"
        },
        {
            "name" : "blerch",
            "link" : "https://i.kym-cdn.com/photos/images/newsfeed/001/207/210/b22.jpg"
        },
    ]
}