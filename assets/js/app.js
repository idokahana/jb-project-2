"use strict";

(async () => {
  const getData = (url) => fetch(url).then((response) => response.json());

  const getCoinDetails = async (id) =>
    // getData(`https://api.coingecko.com/api/v3/coins/${id}`);
    getData(`assets/coins/${id}`);

  const showLoader = () => {
    document.getElementById("loader").style.display = "block";
  };

  const hideLoader = () =>
    (document.getElementById("loader").style.display = "none");

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return hours * 60 + minutes;
  };

  const saveToLocalStorage = (coinObj) => {
    let selectedCoins = JSON.parse(localStorage.getItem("selectedCoins")) || [];
    const coinExists = selectedCoins.find((coin) => coin.id === coinObj.id);
    const id = coinObj.id;
    if (!coinExists) {
      const time = getCurrentTime();
      const {
        symbol,
        image: { small },
        market_data: {
          current_price: { usd, eur, ils },
        },
      } = coinObj;
      selectedCoins.push({ id, small, usd, eur, ils, time, symbol });
    } else {
      selectedCoins = selectedCoins.filter((coin) => coin.id !== coinObj.id);
    }
    if (selectedCoins.length <= 5) {
      localStorage.setItem("selectedCoins", JSON.stringify(selectedCoins));
    } else {
      const checkbox = document.getElementById(`${id}check`);
      checkbox.checked = false;
      const myToast = new bootstrap.Toast(
        document.getElementById("lengthToast")
      );
      myToast.show();
    }
  };

  const isCoinSelected = (coinId) => {
    const selectedCoins =
      JSON.parse(localStorage.getItem("selectedCoins")) || [];
    return selectedCoins.some((coin) => coin.id === coinId);
  };

  const fetchCoinDetails = async (id) => {
    const details = await getCoinDetails(id);
    return {
      small: details.image.small,
      usd: details.market_data.current_price.usd,
      eur: details.market_data.current_price.eur,
      ils: details.market_data.current_price.ils,
    };
  };

  const getCoinHTML = async (coins) => {
    const selectedCoins =
      JSON.parse(localStorage.getItem("selectedCoins")) || [];

    const promises = coins.map(async (coin) => {
      let { id, symbol, name } = coin;
      let small, usd, eur, ils;
      try {
        const coinData = selectedCoins.find((coin) => coin.id === id);

        if (
          isCoinSelected(id) &&
          coinData &&
          getCurrentTime() - coinData.time <= 2
        ) {
          ({ small, usd, eur, ils } = coinData);
        } else {
          ({ small, usd, eur, ils } = await fetchCoinDetails(id));
        }
        return `
          <div class="card" id="${id}">
            <div class="card-body">
              <div class="switchFlex">
                <h5 class="card-title">${symbol.toUpperCase()}</h5>
                <div class="form-check form-switch" >
                  <input
                  id="${id}check"
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    ${isCoinSelected(id) ? `checked` : ""}
                  />
                </div>
              </div>
              <p class="card-text">${name}</p>
              <button 
                type="button" 
                class="btn btn-primary" 
                data-bs-toggle="popover" 
                data-bs-title="Coin Info" 
                data-bs-content="<div style='text-align: center;'><img src='${small}' alt='coin image' style='width: 100px; height: 100px;' /><br/>USD Price: ${usd}$ <br/>EUR Price ${eur}€ <br/> ILS Price ${ils}₪</div>">
                More Details
              </button>
            </div>
          </div>
        `;
      } catch (error) {
        console.error(`Error fetching details for ${id}:`, error);
        return `
          <div class="card" id="${id}">
            <div class="card-body">
              <div class="switchFlex">
                <h5 class="card-title">${symbol.toUpperCase()}</h5>
                <div class="form-check form-switch >
                  <input
                  id="${id}check"
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    ${isCoinSelected(id) ? `checked` : ""}
                  />
                </div>
              </div>
              <p class="card-text">${name}</p>
              <p class="text-danger">Failed to load additional details</p>
            </div>
          </div>
        `;
      }
    });

    const htmlArray = await Promise.all(promises);
    return htmlArray.join("");
  };

  const renderAllCoins = (newHTML) => {
    document.getElementById("coinMain").innerHTML = newHTML;
    activatePopovers();
    setupToggleButtons(newHTML);
  };

  const activatePopovers = () => {
    const popoverTriggerList = document.querySelectorAll(
      '[data-bs-toggle="popover"]'
    );
    popoverTriggerList.forEach((popoverTriggerEl) => {
      new bootstrap.Popover(popoverTriggerEl, {
        html: true,
      });
    });
  };

  const handleSearch = async (searchTerm, allCoins) => {
    const filteredCoins = allCoins.filter((coin) => {
      const { name, symbol } = coin;
      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    if (filteredCoins.length === 0) {
      const myToast = new bootstrap.Toast(
        document.getElementById("emptyToast")
      );
      myToast.show();
      showLoader();
      setTimeout(async () => {
        const firstHundredCoins = allCoins.slice(0, 100);
        const newHTML = await getCoinHTML(firstHundredCoins);
        renderAllCoins(newHTML);
        hideLoader();
      }, 1500);
    }
    const newHTML = await getCoinHTML(filteredCoins);
    renderAllCoins(newHTML);
  };

  let allCoins = [];
  showLoader();

  const setupToggleButtons = () => {
    const toggleButtons = document.querySelectorAll(".form-check-input");

    toggleButtons.forEach((button) => {
      button.addEventListener("change", async (event) => {
        const coinId = event.target.closest(".card").id;
        const coinObj = await getCoinDetails(coinId);

        saveToLocalStorage(coinObj);
      });
    });
  };
  try {
    allCoins = await getData("assets/json/file.json"); //working locale
    // allCoins = await getData("https://api.coingecko.com/api/v3/coins/list"); // working with api

    const firstHundredCoins = allCoins.slice(0, 6);
    const newHTML = await getCoinHTML(firstHundredCoins);
    renderAllCoins(newHTML);
    hideLoader();

    document.getElementById("searchBtn").addEventListener("click", (event) => {
      event.preventDefault();
      let searchInput = document.getElementById(`searchInput`);
      handleSearch(searchInput.value, allCoins);
      searchInput.value = "";
    });
  } catch (e) {
    console.warn(e);
    const myToast = new bootstrap.Toast(document.getElementById("myToast"));
    myToast.show();
    setTimeout(() => {
      location.reload();
    }, 60000);
  }

  const getCurrenciesSymbols = () => {
    const selectedCoins =
      JSON.parse(localStorage.getItem("selectedCoins")) || [];
    return selectedCoins.map((coin) => coin.symbol).join(",");
  };
  // ///

  const CoinGraphData = (objectCoinGraphData) => {
    if (!window.xValues) window.xValues = [];
    if (!window.datasetsMap) window.datasetsMap = {};
    const currentTime = new Date().toLocaleTimeString();
    window.xValues.push(currentTime);

    Object.entries(objectCoinGraphData).forEach(([symbol, data]) => {
      const { USD } = data;

      if (!window.datasetsMap[symbol]) {
        window.datasetsMap[symbol] = [];
      }

      window.datasetsMap[symbol].push(USD);
    });

    const newDatasets = Object.keys(window.datasetsMap).map(
      (symbol, index) => ({
        label: symbol.toUpperCase(),
        data: window.datasetsMap[symbol],
        borderColor: getColor(index),
        fill: false,
      })
    );

    new Chart("myChart", {
      type: "line",
      data: {
        labels: window.xValues,
        datasets: newDatasets,
      },
    });
  };

  const getColor = (index) => {
    const colors = ["red", "green", "blue", "orange", "purple"];
    return colors[index % colors.length];
  };
  const fetchCoinGraphData = async () => {
    return await getData(
      `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${getCurrenciesSymbols()}&tsyms=USD`
      // `https://5owv3.wiremockapi.cloud/json/1`
    );
  };

  const initialObjectCoinGraphData = await fetchCoinGraphData();
  CoinGraphData(initialObjectCoinGraphData);

  setInterval(async () => {
    const objectCoinGraphData = await fetchCoinGraphData();

    CoinGraphData(objectCoinGraphData);
  }, 10000);
})();
