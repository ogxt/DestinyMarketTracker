const LightweightCharts = require("lightweight-charts");
const Manifold = require("./libs/manifold");

const Config = require("./config");

let currentMarkets = new Map();
let allMarkets = new Map();

let dropdownMenu = document.querySelector(".dropdown-menu");
let currentMarketHolder = document.querySelector(".currentMarkets");

const chart = LightweightCharts.createChart(document.querySelector(".tracker"),
    {
        layout: {
        		backgroundColor: 'rgb(34, 34, 34)',
        		lineColor: '#2B2B43',
        		textColor: '#D9D9D9',
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
        	color: '#758696',
        },
        grid: {
        	vertLines: {
        		color: '#2B2B43',
        	},
        	horzLines: {
        		color: '#363C4E',
        	},
        },
        timeScale: {
            visible: false,
        },
    }
);

new ResizeObserver(entries => {
    if (entries.length === 0 || entries[0].target !== document.querySelector(".tracker")) { return; }
        const newRect = entries[0].contentRect;
        chart.applyOptions({ height: newRect.height, width: newRect.width });
}).observe(document.querySelector(".tracker"));

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

        let dropdown = document.createElement("a")
        dropdown.className = "dropdown-item stock-ticker"
        dropdown.dataset.ticker = getTicker(market.name, undefined, true) // Blerch
        dropdown.innerHTML = market.name
        dropdown.href = "#"
    
        let marketHolder = document.createElement("li");
        marketHolder.id = `market-holder-${getTicker(market.name, undefined, true)}`;// Blerch
        marketHolder.dataset.id = market.id
        marketHolder.style = `
            display:none;
            color:white;
            float : left;
            clear: left;
            margin-right: 15px;
        `;
    
        let marketEl = document.createElement("span");
        marketEl.innerHTML = market.name;
    
        let colorKey = document.createElement("span")
        colorKey.style = `
            margin-bottom: 2px;
            width: 12px; 
            height: 12px;
            background-color : ${market.color.rgb().string()};
            border-radius : 10px;
            display:inline-block;
            vertical-align:middle;
        `;
    
        marketHolder.appendChild(marketEl)
        marketHolder.appendChild(colorKey)
    
        currentMarketHolder.appendChild(marketHolder)
    
        dropdown.onclick = () => {
            if(currentMarkets.has(market.id)){
                currentMarkets.delete(market.id);
                marketHolder.style.display = "none";
                dropdown.classList.remove("active")
                chart.removeSeries(market.series)
            }else{
                currentMarkets.set(market.id, market)
                marketHolder.style.display = "table";
                dropdown.classList.add("active")
                market.series = chart.addAreaSeries({
                  topColor: 'rgba(0, 0, 0, 0)',
                  bottomColor: 'rgba(0, 0, 0, 0)',
                  lineColor: market.color.rgb().string(),
                  lineWidth: 2,
                });
            }
        }
        marketEl.onmouseover  = () => {
            if (market.series){
                market.series.applyOptions({
                    topColor: 'rgba(0, 0, 0, 0)',
                    bottomColor: 'rgba(0, 0, 0, 0)',
                    lineColor: market.color.lighten(0.15).saturate(.25).rgb().string(),
                    lineWidth: 3.5,
                })
            }
        }
        marketEl.onmouseout  = () => {
            if (market.series){
                market.series.applyOptions({
                    topColor: 'rgba(0, 0, 0, 0)',
                    bottomColor: 'rgba(0, 0, 0, 0)',
                    lineColor: market.color.rgb().string(),
                    lineWidth: 2,
                })  
            }
            
        }
        dropdownMenu.appendChild(dropdown)
    });  

    setInterval(async () => {

        currentMarkets.forEach(async (market) => {
            if(market.series){
                let price = await Manifold.getProbability(market.id);
                market.price = price;
                market.series.update({
                    time : Date.now(),
                    value : price
                })
                allMarkets.set(market.id, market)
            }
        })
    
        // sorting
        let newList = document.querySelector(".currentMarkets").cloneNode(false);
        let currentMarketList = [].slice.call(document.querySelector(".currentMarkets").children);
        currentMarketList.sort((a,b) => {
            return allMarkets.get(b.dataset.id).price - allMarkets.get(a.dataset.id).price
        })
        for(var i = 0; i < currentMarketList.length; i++){
            newList.appendChild(currentMarketList[i]);
        }
        document.querySelector(".currentMarkets").parentNode.replaceChild(newList, document.querySelector(".currentMarkets"))
    }, Config.interval);    

    addTickerEventListener(); // Blerch
    setTickerAssociation(Array.from(allMarkets.values())); // Blerch
})();

// #region Blerch

let markets = [];
let supportedMarkets = new Map();
const getHash = (hash = window.location.hash) => {
    if(hash.indexOf('#') === 0)
        hash = hash.substring(1);

    markets = hash.split('+');
}

getHash();

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
        //console.log(name, n);
        return n.toUpperCase();
    }
}

const setTickerAssociation = (output) => {
    for(let i = 0; i < output.length; i++) {
        let ticker = getTicker(output[i].name);
        supportedMarkets.set(ticker, output[i]);
    }

    //console.log(supportedMarkets);
    addStockByTicker(...markets);
}

const clearStocks = () => {
    let stocks = Array.from(currentMarkets.values());
    stocks.forEach((stock) => {
        let mh = document.getElementById(`market-holder-${getTicker(stock.name)}`);
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

        let marketHolder = document.getElementById(`market-holder-${getTicker(market.name, undefined, true)}`);
        if(currentMarkets.has(market.id)){
            currentMarkets.delete(market.id);
            marketHolder.style.display = "none";
            let el = document.querySelector(`[data-ticker='${getTicker(market.name, undefined, true)}']`)
            el.classList.remove("active")
            chart.removeSeries(market.series)
        } else {
            currentMarkets.set(market.id, market)
            marketHolder.style.display = "table";
            let el = document.querySelector(`[data-ticker='${getTicker(market.name, undefined, true)}']`)
            el.classList.add("active")
            market.series = chart.addAreaSeries({
                topColor: 'rgba(0, 0, 0, 0)',
                bottomColor: 'rgba(0, 0, 0, 0)',
                lineColor: market.color.rgb().string(),
                lineWidth: 2,
                symbol : market.name
            });
        }
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
