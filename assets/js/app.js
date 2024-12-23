"use strict";

(async () => {
  const getData = (url) => fetch(url).then((response) => response.json());

  const fetchRetry = async (url) => {
    let isSuccess = false;
    do {
      try {
        const data = await getData(url);
        isSuccess = true;
      } catch (e) {
        setTimeout(() => {
          fetchRetry(url);
        }, 5000);
      }
    } while (!isSuccess);
  };

  const getCoinHTML = (coins) => {
    return coins
      .map((coin) => {
        const { id, symbol, name } = coin;

        return `
      <div class="card" id="${id}">
      <div class="card-body">
        <div class="switchFlex">
          <h5 class="card-title">${symbol}</h5>
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              id="flexSwitchCheckDefault"
            />
          </div>
        </div>
        <p class="card-text">
          ${name}
        </p>
        <a href="#" class="btn btn-primary">Go somewhere</a>
      </div>
    </div>
    `;
      })
      .reduce((cum, cur) => cum + cur, "");
  };

  const renderAllCoins = (newHTML) => {
    document.getElementById(`coinMain`).innerHTML = newHTML;
  };

  const getAllCoins = async () =>
    getData("https://api.coingecko.com/api/v3/coins/list");

  // const getSingleCoin = async (coin) =>
  //   fetchRetry(`https://api.coingecko.com/api/v3/coins/${coin}`);
  // const getGraphData = async (coins) =>
  //   getData(
  //     `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins.join(
  //       ","
  //     )}&tsyms=USD`
  //   );

  const coins = await getAllCoins();
  const firstHundredCoins = coins.splice(0, 100);
  const newHTML = getCoinHTML(firstHundredCoins);
  renderAllCoins(newHTML);

  // const btcData = await getSingleCoin('bitcoin')
  // const graphData = await getGraphData(['BTC','ETH'])
})();
