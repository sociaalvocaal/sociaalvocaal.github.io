document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('samenvatting-container');
    const verzendKnop = document.getElementById('definitief-verzenden-btn');
    const terugLinkTekst = document.getElementById('terug-link-tekst');
    const terugLinkKnop = document.getElementById('terug-link-knop');
    
    // 1. Haal dynamisch op welk formulier we aan het controleren zijn
    const formId = localStorage.getItem('sv-actieve-formulier-id') || 'standaard';
    const originUrl = localStorage.getItem('sv-actieve-formulier-url') || '/index.html';
    
    // 2. Vul de 'Ga Terug' knoppen met de originele URL van de gebruiker
    if (terugLinkTekst) terugLinkTekst.href = originUrl;
    if (terugLinkKnop) terugLinkKnop.href = originUrl;

    // Bepaal de dynamische sleutels voor dit specifieke formulier (1x gedeclareerd)
    const storageKeyOverzicht = `sv-form-data-${formId}-overzicht`;
    const storageKeyOrigineel = `sv-form-data-${formId}`;
    const storageKeyStarttijd = `sv-form-data-${formId}-starttijd`;
    const storageKeyDuur = `sv-form-data-${formId}-duur`;
    const storageKeyApiKey = `sv-form-data-${formId}-apikey`;
    const storageKeySubject = `sv-form-data-${formId}-subject`;
    const controlePaginaStart = Date.now(); // Meet ook hoe lang ze op de controlepagina zelf zijn

    const opgeslagenData = localStorage.getItem(storageKeyOverzicht);

    if (!opgeslagenData) {
        container.innerHTML = `<p>Geen formuliergegevens gevonden. Misschien heb je deze al verzonden, of is de sessie verlopen. <a href="${originUrl}" class="text-link">Ga terug naar het formulier</a>.</p>`;
        if (verzendKnop) verzendKnop.disabled = true;
        return;
    }

    const formulierVelden = JSON.parse(opgeslagenData);
    
    const secties = {};
    formulierVelden.forEach(veld => {
        if (!secties[veld.sectie]) {
            secties[veld.sectie] = [];
        }
        secties[veld.sectie].push(veld);
    });

    container.innerHTML = '';
    const hoofdOverzicht = document.createElement('div');
    hoofdOverzicht.className = 'controle-overzicht';

    for (const [sectieNaam, velden] of Object.entries(secties)) {
        const sectieCard = document.createElement('section');
        sectieCard.className = 'controle-sectie';
        
        const titel = document.createElement('h3');
        titel.textContent = sectieNaam;
        sectieCard.appendChild(titel);

        const dl = document.createElement('dl');
        dl.className = 'controle-dl';

        velden.forEach(veld => {
            const wrapper = document.createElement('div');
            wrapper.className = 'controle-vraag-blok';

            const dt = document.createElement('dt');
            dt.className = 'controle-vraag';
            dt.textContent = veld.vraag;

            const dd = document.createElement('dd');
            dd.className = 'controle-antwoord';
            
            if (veld.antwoord === '') {
                dd.textContent = 'Niet ingevuld';
                dd.classList.add('is-leeg');
            } else {
                dd.textContent = veld.antwoord;
            }

            wrapper.appendChild(dt);
            wrapper.appendChild(dd);
            dl.appendChild(wrapper);
        });

        sectieCard.appendChild(dl);
        hoofdOverzicht.appendChild(sectieCard);
    }

    container.appendChild(hoofdOverzicht);

    // Helper om alle formulier-gerelateerde sleutels in één keer te wissen
    function wisAlleFormulierData() {
        localStorage.removeItem(storageKeyOrigineel);
        localStorage.removeItem(storageKeyOverzicht);
        localStorage.removeItem(storageKeyStarttijd);
        localStorage.removeItem(storageKeyDuur);
        localStorage.removeItem(storageKeyApiKey);
        localStorage.removeItem(storageKeySubject);
        localStorage.removeItem('sv-actieve-formulier-id');
        localStorage.removeItem('sv-actieve-formulier-url');
    }

    // 3. De knop: Definitief verzenden (Volledig schaalbaar & API-gekoppeld)
    if (verzendKnop) {
        verzendKnop.addEventListener('click', () => {
            verzendKnop.disabled = true;
            const btnTekst = verzendKnop.querySelector('.crescendo-text');
            if (btnTekst) btnTekst.textContent = "Bezig met versturen...";
            
            // BEVEILIGING: Time-trap & Honeypot controle
            const invulDuur = parseInt(localStorage.getItem(storageKeyDuur), 10) || 0;
            const controleDuur = Date.now() - controlePaginaStart;
            const isVerdachtSnel = (invulDuur < 5000) || (controleDuur < 800);

            const ruweFormulierData = JSON.parse(localStorage.getItem(storageKeyOrigineel) || '{}');
            const honeypotGevuld = Boolean(ruweFormulierData.botcheck);

            if (isVerdachtSnel || honeypotGevuld) {
                // SILENT DROP: Doe net alsof het verzonden is, maar stuur niets naar Web3Forms
                wisAlleFormulierData();

                setTimeout(() => {
                    window.location.href = '/aanvraag-verzonden.html';
                }, 600);
                return;
            }

            // Haal de dynamische formulier-instellingen op, of gebruik veilige fallbacks
            const apiKey = localStorage.getItem(storageKeyApiKey) || verzendKnop.dataset.apikey || "73491bb7-7201-4a52-8a3b-b6956c5387f2";
            const formSubject = localStorage.getItem(storageKeySubject) || verzendKnop.dataset.subject || "Nieuwe Concert Aanvraag via Website";
            
            const verzendData = JSON.parse(localStorage.getItem(storageKeyOverzicht) || '[]');
            
            const payload = new FormData();
            payload.append("access_key", apiKey);
            payload.append("subject", formSubject);
            payload.append("from_name", "Sociaal Vocaal Website");

            let emailInhoud = `Nieuwe inzending binnengekomen via ${originUrl}\n\n`;
            verzendData.forEach(item => {
                const veiligeSectie = String(item.sectie || '').slice(0, 150);
                const veiligeVraag = String(item.vraag || '').slice(0, 300);
                const veiligAntwoord = String(item.antwoord || '').slice(0, 3500);

                emailInhoud += `--- ${veiligeSectie} ---\n`;
                emailInhoud += `VRAAG: ${veiligeVraag}\n`;
                emailInhoud += `ANTWOORD: ${veiligAntwoord}\n\n`;
            });
            payload.append("bericht", emailInhoud.slice(0, 25000));

            // Stuur de data naar de server van Web3Forms
            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: payload
            })
            .then(async (response) => {
                if (response.status === 200) {
                    wisAlleFormulierData();
                    if (btnTekst) btnTekst.textContent = "Verzonden!";
                    window.location.href = '/aanvraag-verzonden.html';
                } else {
                    throw new Error("API weigerde het verzoek.");
                }
            })
            .catch(error => {
                console.error(error);
                if (btnTekst) btnTekst.textContent = "Definitief verzenden";
                verzendKnop.disabled = false;
                
                let serverErrorDiv = document.getElementById('server-fout');
                if (!serverErrorDiv) {
                    serverErrorDiv = document.createElement('div');
                    serverErrorDiv.id = 'server-fout';
                    serverErrorDiv.className = 'fout-overzicht mt-large';
                    serverErrorDiv.setAttribute('tabindex', '-1');
                    
                    const submitSectie = verzendKnop.closest('.form-submit-sectie');
                    if (submitSectie && submitSectie.parentNode) {
                        submitSectie.parentNode.insertBefore(serverErrorDiv, submitSectie);
                    }
                }
                
                serverErrorDiv.innerHTML = `
                    <div class="fout-header">
                        <span class="material-symbols-outlined icon-error" aria-hidden="true">wifi_off</span>
                        <h2 style="margin: 0; font-size: clamp(1.25rem, 3vw, 1.5rem);">Verzenden mislukt</h2>
                    </div>
                    <p style="margin-top: 0.5rem; margin-bottom: 0; font-weight: 500;">
                        Er is iets misgegaan bij het bereiken van onze beveiligde server. Controleer je internetverbinding en probeer het nog eens. Blijft dit gebeuren? Mail of bel ons dan direct.
                    </p>
                `;
                
                serverErrorDiv.hidden = false;
                serverErrorDiv.focus();
                serverErrorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });
    }
});