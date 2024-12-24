"use strict";

(async () => {
  const getData = (url) => fetch(url).then((response) => response.json());

  const getCoinDetails = async (id) =>
    // getData(`https://api.coingecko.com/api/v3/coins/${id}`);
    getData(`assets/coins/${id}`);

  const showLoader = () => {
    document.getElementById("loader").style.display = "block";
  };

  const hideLoader = () => {
    document.getElementById("loader").style.display = "none";
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const saveToLocalStorage = (coinObj) => {
    let selectedCoins = JSON.parse(localStorage.getItem("selectedCoins")) || [];
    const coinExists = selectedCoins.find((coin) => coin.id === coinObj.id);
    if (!coinExists) {
      const time = getCurrentTime();
      const {
        id,
        image: { small },
        market_data: {
          current_price: { usd, eur, ils },
        },
      } = coinObj;
      selectedCoins.push({ id, small, usd, eur, ils, time });
    } else {
      selectedCoins = selectedCoins.filter((coin) => coin.id !== coinObj.id);
    }
    localStorage.setItem("selectedCoins", JSON.stringify(selectedCoins));
  };

  const isCoinSelected = (coinId) => {
    const selectedCoins =
      JSON.parse(localStorage.getItem("selectedCoins")) || [];
    return selectedCoins.some((coin) => coin.id === coinId);
  };

  const getCoinHTML = async (coins) => {
    const promises = coins.map(async (coin) => {
      const { id, symbol, name } = coin;
      try {
        const details = await getCoinDetails(id);
        const {
          image: { small },
          market_data: {
            current_price: { usd, eur, ils },
          },
        } = details;

        return `
          <div class="card" id="${id}">
            <div class="card-body">
              <div class="switchFlex">
                <h5 class="card-title">${symbol.toUpperCase()}</h5>
                <div class="form-check form-switch">
                  <input
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
                <div class="form-check form-switch">
                  <input
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
        console.log(coinObj);
        saveToLocalStorage(coinObj);
      });
    });
  };
  try {
    allCoins = await getData("assets/json/file.json");

    const firstHundredCoins = allCoins.slice(0, 100);
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
    }, 45000);
  }
})();
