document.addEventListener("DOMContentLoaded", () => {

    // =========================================================================
    // SEITEN-SWITCHER MECHANISMUS (TABS)
    // =========================================================================
    const tabLinks = document.querySelectorAll(".tab-link");
    const pages = document.querySelectorAll(".page-content");
    const burgerBtn = document.getElementById("burger-menu-btn");
    const sideNav = document.getElementById("side-nav");
    const closeNavBtn = document.getElementById("close-nav-btn");

    tabLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            
            tabLinks.forEach(item => item.classList.remove("active"));
            link.classList.add("active");

            const targetPageId = link.getAttribute("data-tab");
            pages.forEach(page => {
                page.classList.remove("active-page");
                if (page.id === targetPageId) {
                    page.classList.add("active-page");
                }
            });

            if (sideNav) sideNav.classList.remove("open");
        });
    });

    if (burgerBtn && sideNav && closeNavBtn) {
        burgerBtn.addEventListener("click", () => sideNav.classList.add("open"));
        closeNavBtn.addEventListener("click", () => sideNav.classList.remove("open"));
    }

    // =========================================================================
    // 1. TEXT-TICKER IN DER KOPFZEILE
    // =========================================================================
    const tickerTexte = [
        "Fast EU Shipping (2–5 Days)",
        "Follow us @860.archive",
        "100% Heavyweight Cotton"
    ];

    let aktuellerIndex = 0;
    const tickerElement = document.getElementById("ticker");

    function wechsleTickerText() {
        if (!tickerElement || window.innerWidth <= 950) return;
        tickerElement.classList.remove("fade-in");
        tickerElement.classList.add("fade-out");
        setTimeout(() => {
            aktuellerIndex = (aktuellerIndex + 1) % tickerTexte.length;
            tickerElement.innerText = tickerTexte[aktuellerIndex];
            tickerElement.classList.remove("fade-out");
            tickerElement.classList.add("fade-in");
        }, 500);
    }

    if (tickerElement) {
        setInterval(wechsleTickerText, 4000);
    }

    // =========================================================================
    // 2. INTERAKTIVE LIVE CLOCK
    // =========================================================================
    const uhrElement = document.getElementById("shop-uhr");

    function updateUhr() {
        if (!uhrElement) return;
        const jetzt = new Date();
        const optionen = { timeZone: 'Europe/Berlin', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
        uhrElement.textContent = `${jetzt.toLocaleTimeString('de-DE', optionen)} CET`;
    }

    if (uhrElement) {
        setInterval(updateUhr, 1000);
        updateUhr();
    }

    // =========================================================================
    // 3. INTERAKTIVE AUSWAHLLEISTEN FÜR GRÖSSEN
    // =========================================================================
    const produktKarten = document.querySelectorAll(".produkt-karte");

    produktKarten.forEach(karte => {
        const auswahl = karte.querySelector(".groessen-auswahl");
        const statusFeld = karte.querySelector(".auswahl-status");
        const kaufBtn = karte.querySelector(".kauf-btn");

        if (auswahl && statusFeld) {
            auswahl.addEventListener("change", () => {
                if (auswahl.value !== "") {
                    statusFeld.textContent = `Ausgewählt: ${auswahl.value} – In Stock`;
                    statusFeld.style.color = "#28a745"; 
                } else {
                    statusFeld.textContent = "";
                }
            });
        }

        if (kaufBtn && auswahl && statusFeld) {
            kaufBtn.addEventListener("click", () => {
                if (auswahl.value === "") {
                    statusFeld.textContent = "Bitte wähle zuerst eine Größe aus!";
                    statusFeld.style.color = "#b32424"; 
                } else {
                    alert(`Added to Cart: ${karte.querySelector("h4").textContent} (Size ${auswahl.value})`);
                }
            });
        }
    });

    // =========================================================================
    // 4. SIZE CHART SLIDE-TOGGLE
    // =========================================================================
    const toggleBtn = document.getElementById("toggle-table-btn");
    const tableContainer = document.getElementById("table-container");

    if (toggleBtn && tableContainer) {
        toggleBtn.addEventListener("click", () => {
            if (tableContainer.classList.contains("hidden-element")) {
                tableContainer.classList.remove("hidden-element");
                toggleBtn.textContent = "Close Size Chart";
            } else {
                tableContainer.classList.add("hidden-element");
                toggleBtn.textContent = "Open Size Chart";
            }
        });
    }

    // =========================================================================
    // 5. DATA LITERALS & AJAX FEED MIT BACKEND SYNCHRONISATION
    // =========================================================================
    const feedContainer = document.getElementById("live-comments-container");
    const staticFallback = document.getElementById("static-comments-fallback");
    const commentForm = document.getElementById("ajax-comment-form");
    // Eigener Hash-Key. Vorher zeigte API_URL auf die Hash-WURZEL (ohne Key) –
    // GET lieferte dann nur die globale Key-Liste und POST landete im Nirvana,
    // darum wurden Kommentare nie wirklich gespeichert.
    const API_URL = "https://zuse1.efi.ohmportal.de:8443/hash/gerdtst106937/comments";

    let kommentare = [];          // Quelle der Wahrheit: komplettes Kommentar-Array aus dem Hash
    let speichernLaeuft = false;  // serialisiertes Speichern: nie zwei POSTs gleichzeitig
    let nochmalSpeichern = false; // kam während eines POST eine neue Änderung?

    function erstelleKommentarHTML(kommentarObjekt) {
        const div = document.createElement("div");
        div.classList.add("comment");
        div.innerHTML = `
            <span class="nickname">@${escapeHTML(kommentarObjekt.user)}</span> 
            wrote on <span class="date">${escapeHTML(kommentarObjekt.date)}</span>:
            <div class="commenttext">${escapeHTML(kommentarObjekt.text)}</div>
        `;
        return div;
    }

    // Feed aus dem in-memory-Array neu zeichnen (neueste 5, neueste zuerst).
    function rendereFeed() {
        if (!feedContainer) return;
        feedContainer.innerHTML = "";
        const neuste = kommentare.slice(-5).reverse();
        neuste.forEach(item => {
            feedContainer.appendChild(erstelleKommentarHTML({
                user: item.user || "Anonym",
                date: item.date || new Date().toISOString().slice(0, 10),
                text: item.text || ""
            }));
        });
    }

    // Kommentare aus dem eigenen Hash-Key laden: roher Text -> JSON.parse -> Array-Guard.
    // Bei Server-Fehler lokaler dataset.json-Fallback, damit der Feed nie leer ist.
    function ladeKommentare() {
        if (!feedContainer) return;

        fetch(API_URL)
            .then(res => res.text())
            .then(text => {
                const geparst = text.trim() === "" ? null : JSON.parse(text);
                kommentare = Array.isArray(geparst) ? geparst : [];
                if (staticFallback) staticFallback.style.display = "none";
                if (kommentare.length > 0) {
                    console.log("Aufgabe 4.3 - Aktueller Server-Datenblock:", kommentare[kommentare.length - 1]);
                }
                rendereFeed();
            })
            .catch(() => {
                console.log("Server nicht erreichbar - nutze dataset.json-Fallback.");
                fetch("dataset.json")
                    .then(res => res.json())
                    .then(lokaleDaten => {
                        kommentare = Array.isArray(lokaleDaten) ? lokaleDaten : [];
                        if (staticFallback) staticFallback.style.display = "none";
                        rendereFeed();
                    })
                    .catch(() => {});
            });
    }

    // Das GANZE Array per POST (roher JSON-Body) in den Hash schreiben.
    // Serialisiert: laeuft schon ein POST, wird nur vorgemerkt und danach der
    // aktuelle Stand nachgespeichert -> parallele Requests koennen sich nicht
    // ueberholen und keinen aelteren Stand zurueckschreiben.
    function speichereKommentare() {
        if (speichernLaeuft) {
            nochmalSpeichern = true;
            return;
        }
        speichernLaeuft = true;
        fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(kommentare)
        })
            .then(res => { if (res.ok) console.log("Kommentar im Hash gespeichert."); })
            .catch(() => { console.log("Speichern fehlgeschlagen - nur lokal angezeigt."); })
            .finally(() => {
                speichernLaeuft = false;
                if (nochmalSpeichern) {
                    nochmalSpeichern = false;
                    speichereKommentare();
                }
            });
    }

    if (commentForm) {
        commentForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const userIn = document.getElementById("ajax-username");
            const textIn = document.getElementById("ajax-text");
            const heutigesDatum = new Date().toISOString().slice(0, 10);

            const neuerKommentar = { user: userIn.value, date: heutigesDatum, text: textIn.value };

            // an das Array anhaengen, sofort anzeigen und persistent speichern
            kommentare.push(neuerKommentar);
            rendereFeed();
            speichereKommentare();

            userIn.value = "";
            textIn.value = "";
        });
    }


    function escapeHTML(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    ladeKommentare();
});