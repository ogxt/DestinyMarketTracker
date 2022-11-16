const Util = require("./util");
const Config = require("../config")
/**
 * Gets all markets in a group.
 * @param {string} GroupId The id of the manifold group
 * @return {Array} Array of all markets in the group
 */
module.exports.getMarketsFromGroup = async function(GroupId) {
    return await fetch(`https://manifold.markets/api/v0/group/by-id/${GroupId}/markets`).then(_=>_.json())
}
/**
 * Gets market from api 
 * @param {String} marketId he id of the manifold market
 * @returns {object} manifold market
 */
module.exports.getMarket = async function(marketId){
    return (await fetch(`https://manifold.markets/api/v0/market/${marketId}`).then(_=>_.json()));
}
/**
 * Gets History of market.
 * @param {string} marketId The id of the manifold market
 * @return {array} Market price history
 */
 module.exports.getHistory = async function(marketId) {
    let market = await module.exports.getMarket(marketId);
    return market.bets
}
/**
 * Gets Probability of market.
 * @param {string} marketId The id of the manifold market
 * @return {number} Current market probability
 */
module.exports.getProbability = async function(marketId) {
    let market = await module.exports.getMarket(marketId);
    return market.probability * 100
}
/** Market Class */
class Market {
     /**
     * @param {object} market - The market object from manifold api.
     */
    constructor(market){
        let n = market.question.replace("(Permanent)","");
        if(n.indexOf('$') === 0) {
            n = n.split(' ');
            n.shift();
            n = n.join(' ');
        }

        if (n.includes(" Stock")) {
            this.title = n.replace(" Stock", "");
        } else {
            this.title = n;
        }

        this.name = n
        this.id = market.id;
        this.url  = market.url;
        this.creator = market.creatorUsername;
        this.volume = market.volume;
        this.color = Util.getColor(this.id);
        this.lastPrice = 0;
        this.initalize();
    }

    /**
     * Initalizes the class ( needed to avoid async problems )
     */
    async initalize(){
        this.price, this.lastPrice = await this.getPrice()
        this.history = await this.getHistory()
    }
    /**
     * Gets the price history of the market
     * @return {Array} Price history of the market
     */
     async getHistory(){
        return await module.exports.getHistory(this.id)
    }
    /**
     * Gets the price of the market
     * @return {number} The price
     */
    async getPrice(){
        return await module.exports.getProbability(this.id)
    }
}
/**
 * Gets markets from destiny.gg group.
 * @return {Map} List of destiny.gg markets
 */
module.exports.getDggMarkets = async function(){
    let markets = new Map();

    // get markets from destiny group
    let marketList = await module.exports.getMarketsFromGroup("W2ES30fRo6CCbPNwMTTj");
    let names = [];

    marketList.forEach(market => {
        if (market.question.includes("(Permanent)") && market.question.includes("Stock")){
            let _market = new Market(market);
            if(names.indexOf(_market.name.toUpperCase()) > -1)
                return;
            names.push(_market.name.toUpperCase());
            markets.set(market.id, _market);
        }
    });

    return markets;
}