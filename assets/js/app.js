"use strict";

(async () => {
  const getData = (url) => fetch(url).then((response) => response.json());

  const getCoinDetails = async (id) =>
    getData(`https://api.coingecko.com/api/v3/coins/${id}`);

  const showLoader = () => {
    document.getElementById("loader").style.display = "block";
  };

  const hideLoader = () => {
    document.getElementById("loader").style.display = "none";
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
              <h5 class="card-title">${symbol.toUpperCase()}</h5>
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
  showLoader();

  try {
    const coins = await getData("https://api.coingecko.com/api/v3/coins/list");
    // const coins = await getData("assets/json/file.json");
    const firstHundredCoins = coins.slice(0, 100);
    const newHTML = await getCoinHTML(firstHundredCoins);
    renderAllCoins(newHTML);
    hideLoader();
  } catch (e) {
    const myToast = new bootstrap.Toast(document.getElementById("myToast"));
    myToast.show();
    setTimeout(() => {
      location.reload();
    }, 45000);
  }
})();
