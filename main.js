document.addEventListener('DOMContentLoaded', () => {
    const DGGMarkets = new Market(new Stock(0, 'tst', 'Test 1', true), new Stock(1, 'rsr', 'Test 2', true));
    document.addEventListener('keydown', (e) => {
        if(e.code === 'Backquote') {
            DGGMarkets.updateStocks();
        }
    });
    
    document.addEventListener('input', (e) => {
        if(e.target.classList.contains('stock-input')) {
            DGGMarkets.toggleStock(e.target.value, e.target.checked)
        }
    });

    setInterval(() => {
        DGGMarkets.updateStocks();
    }, 2000);

    window.onpopstate = (e) => {
        if(e.state) {
            e.preventDefault();
            DGGMarkets.setStocksByHash(e.state.hash ?? window.location.hash);
        }
    }

    addEventListener('hashchange', (e) => {
        DGGMarkets.setStocksByHash(window.location.hash);
    });
});

const Config = {
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

const DefaultStyles = {
    ymEtCjGdILK7vx8rlIVy: {
        name: 'RTBA',
        color: undefined
    },
    EcOoKLghvApUZiumDRnA: {
        name: 'Mike from PA',
        color: undefined
    }
}

class Stock {
    static savedValues = 40;
    static defaultWidth = 6;

    constructor(id, ticker, name, selected = false) {
        this.id = id;
        this.ticker = ticker;
        this.name = name;
        this.selected = selected;

        const values = new Array(Stock.savedValues).fill(NaN);
        this.addValue = (val) => {
            values.push(val);
            if(values.length > Stock.savedValues)
                values.shift();
        }
        this.getValues = () => { return values; }

        const data = {
            id: this.id,
            label: this.name,
            data: this.getValues(),
            borderWidth: Stock.defaultWidth,
            cubicInterpolationMode: 'monotone',
            tension: 0.4,
            borderColor: DefaultStyles[this.id] ?? this.randomColor()
        }

        this.getData = () => {
            return data;
        }
    }

    randomColor() {
        return `#${Math.floor(Math.random()*16777215).toString(16)}`;
    }
}

class Market {
    constructor(...stocks) {
        // Load Stocks - Saves to LocalStorage for Repeats
        Manifold.getDggStocks().then((output) => {
            console.log(output);
            this.createStocksFromManifold(output);
        });

        // Stocks
        this.stocks = new Map();
        this.createStocksFromManifold = (stocks) => {
            let validStocks = [], valid_ids = Config.creators.map((v) => v.id);
            for(let i = 0; i < stocks.length; i++) {
                let stock = stocks[i];
                if(!(stock instanceof Stock)) {
                    if(valid_ids.indexOf(stock.creatorId) < 0 || !stock.question.includes("(Permanent)"))
                        continue;

                    let n = stock.question.replace("(Permanent)","");
                    if(DefaultStyles[stock.id] == undefined) {
                        if(n.indexOf('$') === 0) {
                            n = n.split(' ');
                            n.shift();
                            n = n.join(' ');
                        }
    
                        if (n.includes(" Stock")) {
                            n = n.replace(" Stock", "");
                        }
                    } else {
                        n = DefaultStyles[stock.id].name;
                    }

                    let ticker = this.getTicker(stock.question);
                    validStocks.push(new Stock(stock.id, ticker, n, false));
                }
            }

            this.setStocks(validStocks);
        }

        this.setStocks = (stocks) => {
            stocks.forEach((stock) => {
                if(!(stock instanceof Stock)) return;
                if(this.hasTicker(stock.ticker)) return;
                this.stocks.set(stock.id, stock);
            });

            let sl = document.getElementById('stock-list')
            let arr = [...this.stocks.values()].sort((a, b) => {
                if(a.name.toUpperCase() < b.name.toUpperCase())
                    return -1;
        
                if(a.name.toUpperCase() > b.name.toUpperCase())
                    return 1;
        
                return 0;
            });
            sl.innerHTML = arr.map((stk) => 
                `<span><input type="checkbox" id="${stk.id}" name="${stk.id}" value="${stk.id}" class="stock-input"></input>
                <label for="${stk.id}">${stk.name}</label></span>`
            ).join('');

            this.setStocksByHash(window.location.hash);
        }

        // Chart
        const ctx = document.getElementById('dgg-charts');
        let _stocks = [...this.stocks.values()].map((stock) => { return stock.getData(); });
        const datasets = { labels: [], datasets: _stocks };
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: {
                    position: 'left',
                    display: false
                },
            },
            scales: {
                y: {
                    display: true,
                    min: 0,
                    max: 100,
                    grid: {
                        color: function(context) {
                            if(context.tick.value == 0 || context.tick.value % 50 == 0) {
                                return '#ffffff88';
                            } else {
                                return '#ffffff11';
                            }
                        }
                    }
                },
                x: {
                    display: false
                }
            },
            elements: {
                point: {
                    radius: 0
                }
            },
            layout: {
                autoPadding: true
            },
        }
    
        const chart = new Chart(ctx, {
            type: 'line',
            data: datasets,
            options: options
        });

        this.renderStocks = () => {
            let _tl = 0;
            let nd = new Set()

            chart.data.datasets.forEach((dataset, index) => {
                let stock = this.stocks.get(dataset.id);
                if(!stock.selected) {
                    chart.data.datasets.splice(index, 1);
                    return;
                }

                let values = stock.getValues();
                dataset.data = values;
                if(_tl < values.length)
                    _tl = values.length;

                nd.add(stock.id);         
            });

            let arr = [...this.stocks.values()];
            for(let i = 0; i < arr.length; i++) {
                if(arr[i].selected && !nd.has(arr[i].id)) {
                    chart.data.datasets.push(arr[i].getData());
                }
            }

            chart.data.labels = new Array(_tl).fill('');
            //chart.data.datasets = [...nd.values()];
            chart.update();
        }

        // Hash
        this.setStocksByHash = (hash) => {
            this.stocks.forEach((stk) => {
                if(hash.indexOf(stk.ticker) >= 0) {
                    stk.selected = true;
                    document.getElementById(stk.id).checked = true;
                } else {
                    stk.selected = false;
                    document.getElementById(stk.id).checked = false;
                }
            })
        }
    }

    getTicker(name, length = 3, allow_exsiting = false) {
        if(name.indexOf('$') === 0)
            name = name.substring(1);

        let n = name.substr(0, length).trim();
        if(this.hasTicker(n) && !allow_exsiting) {
            return getTicker(name, length + 1);
        } else {
            //console.log(name, n);
            return n.toUpperCase();
        }
    }

    hasTicker(name) {
        return [...this.stocks.values()].map((stk) => stk.ticker).indexOf(name) >= 0;
    }

    getSelectedStocks() {
        return [...this.stocks.values()].filter((stk) => { return stk.selected });
    }

    async updateStocks() {
        // Fetch Manifold
        let sm = this.getSelectedStocks();
        //console.log('Selected', sm);
        if(sm.length == 0) {
            this.renderStocks();
            return;
        }

        let promises = [];
        sm.forEach((s) => { promises.push(new Promise((res, rej) => {
            Manifold.getProbabilty(s.id).then((output) => { s.addValue(output); res(output); });
        })); });

        let results = await Promise.all(promises);
        //console.log('Results', results);

        // Set Value
        this.renderStocks();
    }

    toggleStock(id, checked) {
        let stock = this.stocks.get(id);
        if(stock instanceof Stock) {
            stock.selected = checked;
        }

        let hash = this.getSelectedStocks().map((stk) => { return stk.ticker }).join('+');
        window.history.pushState({ hash: window.location.hash }, "", `#${hash.toUpperCase()}`);
        this.renderStocks();
    }
}

class Manifold {
    constructor() {}

    static async getDggStocks() {
        const GroupId = "W2ES30fRo6CCbPNwMTTj";
        let stocks = await fetch(`https://manifold.markets/api/v0/group/by-id/${GroupId}/markets`);
        let json = await stocks.json();
        return json;
    }

    static async getStockData(id) {
        let stock = await fetch(`https://manifold.markets/api/v0/market/${id}`);
        return await stock.json();
    }

    static async getProbabilty(id) {
        let stock = await this.getStockData(id);
        return stock.probability * 100;
    }
}