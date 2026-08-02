(() => {
  "use strict";

  /* ------------------------------------------------------------
     STATIC DATA — mirrors the categories the model was trained on
     ------------------------------------------------------------ */
  const BOROUGHS = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"];

  const NEIGHBOURHOODS = ["Allerton", "Arden Heights", "Arrochar", "Arverne", "Astoria", "Bath Beach", "Battery Park City", "Bay Ridge", "Bay Terrace", "Bay Terrace, Staten Island", "Baychester", "Bayside", "Bayswater", "Bedford-Stuyvesant", "Belle Harbor", "Bellerose", "Belmont", "Bensonhurst", "Bergen Beach", "Boerum Hill", "Borough Park", "Breezy Point", "Briarwood", "Brighton Beach", "Bronxdale", "Brooklyn Heights", "Brownsville", "Bull's Head", "Bushwick", "Cambria Heights", "Canarsie", "Carroll Gardens", "Castle Hill", "Castleton Corners", "Chelsea", "Chinatown", "City Island", "Civic Center", "Claremont Village", "Clason Point", "Clifton", "Clinton Hill", "Co-op City", "Cobble Hill", "College Point", "Columbia St", "Concord", "Concourse", "Concourse Village", "Coney Island", "Corona", "Crown Heights", "Cypress Hills", "DUMBO", "Ditmars Steinway", "Dongan Hills", "Douglaston", "Downtown Brooklyn", "Dyker Heights", "East Elmhurst", "East Flatbush", "East Harlem", "East Morrisania", "East New York", "East Village", "Eastchester", "Edenwald", "Edgemere", "Elmhurst", "Eltingville", "Emerson Hill", "Far Rockaway", "Fieldston", "Financial District", "Flatbush", "Flatiron District", "Flatlands", "Flushing", "Fordham", "Forest Hills", "Fort Greene", "Fort Hamilton", "Fresh Meadows", "Glendale", "Gowanus", "Gramercy", "Graniteville", "Grant City", "Gravesend", "Great Kills", "Greenpoint", "Greenwich Village", "Grymes Hill", "Harlem", "Hell's Kitchen", "Highbridge", "Hollis", "Holliswood", "Howard Beach", "Howland Hook", "Huguenot", "Hunts Point", "Inwood", "Jackson Heights", "Jamaica", "Jamaica Estates", "Jamaica Hills", "Kensington", "Kew Gardens", "Kew Gardens Hills", "Kingsbridge", "Kips Bay", "Laurelton", "Little Italy", "Little Neck", "Long Island City", "Longwood", "Lower East Side", "Manhattan Beach", "Marble Hill", "Mariners Harbor", "Maspeth", "Melrose", "Middle Village", "Midland Beach", "Midtown", "Midwood", "Mill Basin", "Morningside Heights", "Morris Heights", "Morris Park", "Morrisania", "Mott Haven", "Mount Eden", "Mount Hope", "Murray Hill", "Navy Yard", "Neponsit", "New Brighton", "New Dorp", "New Dorp Beach", "New Springville", "NoHo", "Nolita", "North Riverdale", "Norwood", "Oakwood", "Olinville", "Ozone Park", "Park Slope", "Parkchester", "Pelham Bay", "Pelham Gardens", "Port Morris", "Port Richmond", "Prince's Bay", "Prospect Heights", "Prospect-Lefferts Gardens", "Queens Village", "Randall Manor", "Red Hook", "Rego Park", "Richmond Hill", "Ridgewood", "Riverdale", "Rockaway Beach", "Roosevelt Island", "Rosebank", "Rosedale", "Rossville", "Schuylerville", "Sea Gate", "Sheepshead Bay", "Shore Acres", "Silver Lake", "SoHo", "Soundview", "South Beach", "South Ozone Park", "South Slope", "Springfield Gardens", "Spuyten Duyvil", "St. Albans", "St. George", "Stapleton", "Stuyvesant Town", "Sunnyside", "Sunset Park", "Theater District", "Throgs Neck", "Todt Hill", "Tompkinsville", "Tottenville", "Tremont", "Tribeca", "Two Bridges", "Unionport", "University Heights", "Upper East Side", "Upper West Side", "Van Nest", "Vinegar Hill", "Wakefield", "Washington Heights", "West Brighton", "West Farms", "West Village", "Westchester Square", "Westerleigh", "Whitestone", "Williamsbridge", "Williamsburg", "Willowbrook", "Windsor Terrace", "Woodhaven", "Woodlawn", "Woodside"];

  // Order must match the model's classes_ (alphabetical, as scikit-learn sorts them)
  const ROOM_TYPES = ["Entire home/apt", "Private room", "Shared room"];

  const DEFAULT_API_BASE = "http://localhost:8000";

  /* ------------------------------------------------------------
     ELEMENT REFERENCES
     ------------------------------------------------------------ */
  const form = document.getElementById("predict-form");
  const submitBtn = document.getElementById("submit-btn");
  const formError = document.getElementById("form-error");

  const groupSelect = document.getElementById("neighbourhood_group");
  const hoodInput = document.getElementById("neighbourhood");
  const hoodList = document.getElementById("neighbourhood-list");

  const availabilityInput = document.getElementById("availability_365");
  const availabilityOut = document.getElementById("availability_365-out");

  const apiUrlInput = document.getElementById("api-url");

  const previewBorough = document.getElementById("preview-borough");
  const previewCoords = document.getElementById("preview-coords");
  const previewHood = document.getElementById("preview-hood");
  const previewPrice = document.getElementById("preview-price");
  const previewNights = document.getElementById("preview-nights");
  const previewReviews = document.getElementById("preview-reviews");
  const previewAvailability = document.getElementById("preview-availability");

  const ledgerStatus = document.getElementById("ledger-status");
  const ledgerEmpty = document.getElementById("ledger-empty");
  const ledgerResult = document.getElementById("ledger-result");
  const stamp = document.getElementById("stamp");
  const stampText = document.getElementById("stamp-text");
  const bars = document.getElementById("bars");
  const endpointEcho = document.getElementById("endpoint-echo");

  /* ------------------------------------------------------------
     INIT: populate borough select + neighbourhood datalist
     ------------------------------------------------------------ */
  function populateOptions() {
    BOROUGHS.forEach((b) => {
      const opt = document.createElement("option");
      opt.value = b;
      opt.textContent = b;
      groupSelect.appendChild(opt);
    });

    NEIGHBOURHOODS.forEach((n) => {
      const opt = document.createElement("option");
      opt.value = n;
      hoodList.appendChild(opt);
    });
  }

  /* ------------------------------------------------------------
     API URL persistence
     ------------------------------------------------------------ */
  function loadApiBase() {
    const saved = window.localStorage ? localStorage.getItem("predictor_api_base") : null;
    apiUrlInput.value = saved || DEFAULT_API_BASE;
  }

  function saveApiBase() {
    const val = apiUrlInput.value.trim().replace(/\/+$/, "");
    if (window.localStorage) localStorage.setItem("predictor_api_base", val);
  }

  apiUrlInput.addEventListener("change", saveApiBase);

  /* ------------------------------------------------------------
     LIVE PREVIEW CARD
     ------------------------------------------------------------ */
  function updatePreview() {
    const data = new FormData(form);

    const borough = data.get("neighbourhood_group") || "";
    previewBorough.textContent = borough || "Borough";
    previewBorough.dataset.borough = borough;

    const hood = (data.get("neighbourhood") || "").trim();
    previewHood.textContent = hood || "Neighbourhood pending";

    const lat = data.get("latitude");
    const lon = data.get("longitude");
    previewCoords.textContent = (lat && lon) ? `${Number(lat).toFixed(3)}, ${Number(lon).toFixed(3)}` : "--, --";

    const price = data.get("price");
    previewPrice.textContent = price ? Number(price).toLocaleString() : "\u2014";

    const nights = data.get("minimum_nights");
    previewNights.textContent = nights ? `${nights} night${nights == 1 ? "" : "s"}` : "\u2014";

    const reviews = data.get("number_of_reviews");
    previewReviews.textContent = reviews !== null && reviews !== "" ? reviews : "\u2014";

    previewAvailability.textContent = `${availabilityInput.value} d`;
  }

  availabilityInput.addEventListener("input", () => {
    availabilityOut.textContent = availabilityInput.value;
    updatePreview();
  });

  form.addEventListener("input", updatePreview);
  form.addEventListener("change", updatePreview);

  /* ------------------------------------------------------------
     VALIDATION HELPERS
     ------------------------------------------------------------ */
  function showError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  function clearError() {
    formError.hidden = true;
    formError.textContent = "";
  }

  function setLedgerStatus(text, kind) {
    ledgerStatus.textContent = text;
    ledgerStatus.classList.remove("is-live", "is-error");
    if (kind) ledgerStatus.classList.add(kind);
  }

  /* ------------------------------------------------------------
     RENDER RESULT
     ------------------------------------------------------------ */
  function renderResult(predictedType, probabilities) {
    ledgerEmpty.hidden = true;
    ledgerResult.hidden = false;

    stampText.textContent = predictedType.toUpperCase();
    // restart stamp animation
    stamp.style.animation = "none";
    // eslint-disable-next-line no-unused-expressions
    stamp.offsetHeight;
    stamp.style.animation = "";

    // Pair labels with probabilities. If lengths align with our known
    // ROOM_TYPES order, use those labels; otherwise fall back to indices.
    let pairs;
    if (probabilities.length === ROOM_TYPES.length) {
      pairs = ROOM_TYPES.map((label, i) => ({ label, value: probabilities[i] }));
    } else {
      pairs = probabilities.map((v, i) => ({ label: `Class ${i}`, value: v }));
    }
    pairs.sort((a, b) => b.value - a.value);

    bars.innerHTML = "";
    pairs.forEach((p, idx) => {
      const pct = (p.value * 100).toFixed(1);
      const row = document.createElement("div");
      row.className = "bar-row" + (idx === 0 ? " is-top" : "");
      row.innerHTML = `
        <div class="bar-row__label">
          <span>${p.label}</span>
          <span class="bar-row__pct">${pct}%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:0%"></div>
        </div>
      `;
      bars.appendChild(row);
      // animate after insertion
      requestAnimationFrame(() => {
        row.querySelector(".bar-fill").style.width = `${pct}%`;
      });
    });
  }

  /* ------------------------------------------------------------
     SUBMIT
     ------------------------------------------------------------ */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const payload = {
      latitude: Number(data.get("latitude")),
      longitude: Number(data.get("longitude")),
      price: Number(data.get("price")),
      minimum_nights: Number(data.get("minimum_nights")),
      number_of_reviews: Number(data.get("number_of_reviews")),
      reviews_per_month: Number(data.get("reviews_per_month")),
      calculated_host_listings_count: Number(data.get("calculated_host_listings_count")),
      availability_365: Number(data.get("availability_365")),
      neighbourhood_group: data.get("neighbourhood_group"),
      neighbourhood: (data.get("neighbourhood") || "").trim(),
    };

    const apiBase = apiUrlInput.value.trim().replace(/\/+$/, "") || DEFAULT_API_BASE;
    const endpoint = `${apiBase}/predict`;
    endpointEcho.textContent = endpoint.replace(/^https?:\/\//, "");

    submitBtn.classList.add("is-loading");
    submitBtn.disabled = true;
    setLedgerStatus("contacting model\u2026");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson && errJson.detail) detail = JSON.stringify(errJson.detail);
        } catch (_) { /* ignore parse failure */ }
        throw new Error(detail);
      }

      const json = await res.json();
      const predicted = json.Predicted_room_type ?? json.predicted_room_type ?? "Unknown";
      const probability = json.Probability ?? json.probability ?? [];

      renderResult(predicted, probability);
      setLedgerStatus("analysis complete", "is-live");
    } catch (err) {
      setLedgerStatus("request failed", "is-error");
      showError(
        `Couldn't reach the prediction API at ${endpoint}. ${err.message || err}. ` +
        `Check that the FastAPI server is running and the base URL above is correct (CORS must allow this origin).`
      );
    } finally {
      submitBtn.classList.remove("is-loading");
      submitBtn.disabled = false;
    }
  });

  /* ------------------------------------------------------------
     BOOT
     ------------------------------------------------------------ */
  populateOptions();
  loadApiBase();
  updatePreview();
})();
