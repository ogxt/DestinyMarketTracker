const LightweightCharts = require("lightweight-charts");
const Manifold = require("./libs/manifold");
const Util = require("./libs/util");
const fuzzysort = require('fuzzysort')

const Config = require("./config");

let currentMarkets = new Map();
let allMarkets = new Map();
let allRows = [];

let currentMarketHolder = document.querySelector(".currentMarkets");
let itemHolder = document.querySelector(".listContainer");

const chart = LightweightCharts.createChart(document.querySelector(".tracker"),
    {
        layout: {
        		backgroundColor: '#111111',
        		lineColor: '#B9B9B9',
        		textColor: '#C9C9C9',
        },
        watermark: {
            visible: true,
            fontSize: 65,
            horzAlign: 'center',
            vertAlign: 'center',
            color: 'rgba(64, 64, 64, .6)',
            text: Config.watermark,
        },
        crosshair: {
        	color: '#A9A9A9',
        },
        grid: {
        	vertLines: {
        		color: 'rgba(0, 0, 0, 0)',
        	},
        	horzLines: {
        		color: 'rgba(0, 0, 0, 0)',
        	},
        },
        timeScale: {
            visible: false,
        },
        rightPriceScale: {
            autoScale : true,

        }
    }
);

new ResizeObserver(entries => {
    if (entries.length === 0 || entries[0].target !== document.querySelector(".tracker")) { return; }
        const newRect = entries[0].contentRect;
        chart.applyOptions({ height: newRect.height, width: newRect.width });
}).observe(document.querySelector(".tracker"));

let setSize = function(size){
    let chartsize = (size/window.innerWidth ) * 100
    document.querySelector(".markets").style.width = `${chartsize}%`;
    document.querySelector(".tracker").style.width = `${100-chartsize}%`
}

const mouseMoveHandler = function (e) {
    setSize(e.clientX)
};

const mouseUpHandler = function () {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
};

(async()=>{
    allMarkets = await Manifold.getDggMarkets();
    let arr = [...allMarkets.values()];
    arr.sort((a, b) => { 
        if(a.name.toUpperCase() < b.name.toUpperCase())
            return -1;

        if(a.name.toUpperCase() > b.name.toUpperCase())
            return 1;

        return 0;
    });
    arr.forEach(market => {

        let itemRow = document.createElement("div");
        itemRow.className = "itemRow stock-ticker";
        itemRow.dataset.marketID = market.id;
        itemRow.dataset.name = market.name;
        itemRow.dataset.volume = market.volume;

        market.ticker = getTicker(market.name, undefined, true)

        itemRow.onclick = () => {
            addStockToChart(market)
        }

        // start ticker element
        let tickerCell = document.createElement("div");
        tickerCell.className = "tickerCell";

        let tickerLabel = document.createElement("div");
        tickerLabel.className = "tickerLabel";
        let tickerText = document.createElement("span");
        tickerText.innerText = market.ticker;

        tickerCell.appendChild(tickerLabel)
        tickerLabel.appendChild(tickerText);
        itemRow.appendChild(tickerCell);
        // end ticker element

        // start title element
        let titleCell = document.createElement("div");
        titleCell.className = "titleCell";

        let titleText = document.createElement("span");
        titleText.className = "titleText";
        titleText.innerText = market.name;

        titleCell.appendChild(titleText)
        itemRow.append(titleCell);
        // end title element

        // start creator element
        let creatorCell = document.createElement("div");
        creatorCell.className = "creatorCell";
        let creatorText = document.createElement("span");
        creatorText.className = "creatorText";
        creatorText.innerText = market.creator;

        creatorCell.appendChild(creatorText)
        itemRow.appendChild(creatorCell)
        // end creator element

        itemHolder.appendChild(itemRow);
        allRows.push(itemRow);

        let removeButton = document.createElement("button");
        removeButton.className = "RemoveButton stock-ticker";
        removeButton.innerHTML = "X";

        removeButton.onclick = () => {
            removeStockFromChart(market);
        }
    
        let marketHolder = document.createElement("li");
        marketHolder.id = `market-holder-${market.id}`;// Blerch
        marketHolder.dataset.id = market.id
        marketHolder.className = "marketHolder";
    
        let marketEl = document.createElement("a");
        marketEl.innerHTML = market.name;
        marketEl.target = "_blank"

        marketEl.href = market.url;
    
        let colorKey = document.createElement("span")
        colorKey.className = "colorKey";
        colorKey.style.backgroundColor = market.color.rgb().string();
        
        marketHolder.appendChild(removeButton);
        marketHolder.appendChild(marketEl)
        marketHolder.appendChild(colorKey)
    
        currentMarketHolder.appendChild(marketHolder)
        
        marketEl.onmouseover  = () => {
            if (market.series){
                market.series.applyOptions({
                    topColor: 'rgba(0, 0, 0, 0)',
                    bottomColor: 'rgba(0, 0, 0, 0)',
                    lineColor: market.color.lighten(.25).saturate(.9).rgb().string(),
                    lineWidth: Config.lineWidth + (Config.lineWidth * .35),
                })
            }
        }
        marketEl.onmouseout  = () => {
            if (market.series){
                market.series.applyOptions({
                    topColor: 'rgba(0, 0, 0, 0)',
                    bottomColor: 'rgba(0, 0, 0, 0)',
                    lineColor: market.color.rgb().string(),
                    lineWidth: Config.lineWidth,
                })  
            }
        }
    });

    function sortVolume() {
        let newList = document.querySelector(".listContainer").cloneNode(false);
        [].slice.call(document.querySelector(".listContainer").children).filter(row => !row.className.includes("itemRow")).forEach(item => {
            newList.appendChild(item)
        })
        let MarketList = [].slice.call(document.querySelector(".listContainer").children).filter(row => row.className.includes("itemRow"));
        MarketList.sort((a,b) => {
            return allMarkets.get(b.dataset.marketID).volume - allMarkets.get(a.dataset.marketID).volume
        })
        for(var i = 0; i < MarketList.length; i++){
            newList.appendChild(MarketList[i]);
        }
        document.querySelector(".listContainer").parentNode.replaceChild(newList, document.querySelector(".listContainer"))
    };

    sortVolume();
   
    document.querySelector("input").addEventListener('keyup', (event) => {
        if(event.target.value == ""){
            let newList = document.querySelector(".listContainer").cloneNode(false);
            [].slice.call(document.querySelector(".listContainer").children).filter(row => !row.className.includes("itemRow")).forEach(item => {
                newList.appendChild(item)
            })
            for(var i = 0; i < allRows.length; i++){
                newList.appendChild(allRows[i]);
            }
            document.querySelector(".listContainer").parentNode.replaceChild(newList, document.querySelector(".listContainer"))
            sortVolume();
        }else{
            let results = fuzzysort.go(event.target.value, allRows, {
                key : "dataset.name"
            })
            let newList = document.querySelector(".listContainer").cloneNode(false);
            [].slice.call(document.querySelector(".listContainer").children).filter(row => !row.className.includes("itemRow")).forEach(item => {
                newList.appendChild(item)
            })
            for(var i = 0; i < results.length; i++){
                newList.appendChild(results[i].obj);
            }
            document.querySelector(".listContainer").parentNode.replaceChild(newList, document.querySelector(".listContainer"))
        }
    });

    setInterval(async () => {
        currentMarkets.forEach(async (market) => {
            if(market.series){
                let price = await Manifold.getProbability(market.id);
                market.price = price;
                if (market.priceHistory == null) market.priceHistory = [];

                // OPTIONAL - Use random price values for testing - configured in config.js
                const rndPrice = Config.randomPriceTestMode;
                if (rndPrice.active) {
                    const sinceLastInterval = Date.now() % rndPrice.changeInterval;
                    const shouldRandomisePrice = sinceLastInterval - Config.interval <= 0;
                    price = shouldRandomisePrice ? Util.GetRandomInRange(rndPrice.minPrice, rndPrice.maxPrice) : market.lastPrice;
                }

                // Updating graph with rolling average values - effect is smoother curves
                const rollAvg = Config.rollingAverageMode;
                if (rollAvg.active) {
                    if (market.priceHistory.length >= rollAvg.averageSampleSize) {
                        // Weighted rolling average
                        if (rollAvg.useWeightedAverage) {
                            market.series.update({
                                time : Date.now(),
                                value: Util.GetWeightedArrayAverage(market.priceHistory, rollAvg.weights)
                            })
                        }
                        // Rolling average
                        else {
                            market.series.update({
                                time : Date.now(),
                                value: Util.GetArrayAverage(market.priceHistory)
                            })
                        }
                    }
                }
                // Updating graph with raw values
                else {
                    market.series.update({
                        time : Date.now(),
                        value: price
                    })
                }

                market.lastPrice = price;
                market.priceHistory.push(price);
                if (market.priceHistory.length > rollAvg.averageSampleSize) market.priceHistory.shift();
                allMarkets.set(market.id, market);
            }
        })
        // sorting
        let newList = document.querySelector(".currentMarkets").cloneNode(false);
        let currentMarketList = [].slice.call(document.querySelector(".currentMarkets").children);
        currentMarketList.sort((a,b) => {
            return allMarkets.get(b.dataset.id).lastPrice - allMarkets.get(a.dataset.id).lastPrice
        })
        for(var i = 0; i < currentMarketList.length; i++){
            newList.appendChild(currentMarketList[i]);
        }
        document.querySelector(".currentMarkets").parentNode.replaceChild(newList, document.querySelector(".currentMarkets"))
    }, Config.interval);    

    addTickerEventListener(); // Blerch
    setTickerAssociation(Array.from(allMarkets.values()).sort((a,b) => {
        return b.volume - a.volume
    })); // Blerch
})();

// #region Blerch

let markets = [];
let supportedMarkets = new Map();

/**
 * Returns url hash
 * @param {*} hash 
 * @returns {string} hash
 */
const getHash = (hash = window.location.hash) => {
    if(hash.indexOf('#') === 0)
        hash = hash.substring(1);

    return hash
}
markets = getHash().split('+');

/**
 * 
 * @param {string} name 
 * @param {number} length 
 * @returns {string} Ticker
 */
const getTicker = (name, length = 3, allow_exsiting = false) => {
    if(name.indexOf('$') === 0)
        name = name.substring(1);

    let n = name.substr(0, length).trim();
    if(supportedMarkets.has(n) && !allow_exsiting) {
        return getTicker(name, length + 1);
    } else {
        return n.toUpperCase();
    }
}

const setTickerAssociation = (output) => {
    for(let i = 0; i < output.length; i++) {
        let ticker = getTicker(output[i].name);
        if(!supportedMarkets.has(ticker)){
            supportedMarkets.set(ticker, output[i]);
        }
    }
    addStockByTicker(...markets);
}

const clearStocks = () => {
    let stocks = Array.from(currentMarkets.values());
    stocks.forEach((stock) => {
        let mh = document.getElementById(`market-holder-${market.id}`);
        if(mh instanceof Element)
            mh.style.display = "none";

        chart.removeSeries(stock.series);                 
        currentMarkets.delete(stock.delete);
    });

    currentMarkets = new Map();
}

const addStockByTicker = (...tickers) => {
    tickers.forEach((ticker) => {
        let market = supportedMarkets.get(ticker.toUpperCase());

        if(market == undefined)
            return;

        if(currentMarkets.has(market.id)){
            removeStockFromChart(market);
        } else {
            addStockToChart(market);
        }
    });
}

const removeStockFromChart = (market) => {
    currentMarkets.delete(market.id);
    let marketHolders = document.querySelectorAll(`#market-holder-${market.id}`)
    marketHolders.forEach(marketHolder => {
        marketHolder.style.display = "none";
    })
    chart.removeSeries(market.series);
}

const addStockToChart = (market) => {
    currentMarkets.set(market.id, market);
    let marketHolders = document.querySelectorAll(`#market-holder-${market.id}`)

    marketHolders.forEach(marketHolder => {
        marketHolder.style.display = "table";
    })
    market.series = chart.addAreaSeries({
        topColor: 'rgba(0, 0, 0, 0)',
        bottomColor: 'rgba(0, 0, 0, 0)',
        lineColor: market.color.rgb().string(),
        lineWidth: Config.lineWidth,
        symbol : market.name,
        title: market.title
    });
}


const addTickerEventListener = () => {
    let elems = [...document.getElementsByClassName('stock-ticker')];
    elems.forEach((elem) => {
        elem.addEventListener('click', (e) => {
            e.preventDefault();
            setTimeout(() => {
                let _markets = Array.from(currentMarkets.values()).map((tik) => getTicker(tik.name)).join('+');
                window.history.pushState({ "markets": _markets}, "", `#${_markets}`);
            }, 100)
        });
    });

    window.onpopstate = (e) => {
        if(e.state) {
            e.preventDefault();
            clearStocks();
            addStockByTicker(...e.state.markets.split('+'));
        }
    }

    addEventListener('hashchange', (e) => {
        clearStocks();
        getHash();
        addStockByTicker(...markets);
    });
}


// #endregion

window.closeSelectionMenu = () => {
    document.querySelector(".selection").style.display = "none";
    document.querySelector(".overlay").style.backgroundColor = "rgba(0, 0, 0, 0)"
}

window.openSelectionMenu = () => {
    document.querySelector(".selection").style.display = "flex";
    document.querySelector(".overlay").style.backgroundColor = "rgba(0, 0, 0, .8)"
}