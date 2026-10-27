document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('samenvatting-container');
    const verzendKnop = document.getElementById('definitief-verzenden-btn');
    const terugLinkTekst = document.getElementById('terug-link-tekst');
    const terugLinkKnop = document.getElementById('terug-link-knop');
    
    // 1. Haal dynamisch op welk formulier we aan het controleren zijn
    const formId = localStorage.getItem('sv-actieve-formulier-id') || 'standaard';
    const originUrl = localStorage.getItem('sv-actieve-formulier-url') || 'index.html';
    
    // 2. Vul de 'Ga Terug' knoppen met de originele URL van de gebruiker
    if (terugLinkTekst) terugLinkTekst.href = originUrl;
    if (terugLinkKnop) terugLinkKnop.href = originUrl;

    // Bepaal de dynamische sleutels voor dit specifieke formulier
    const storageKeyOverzicht = `sv-form-data-${formId}-overzicht`;
    const storageKeyOrigineel = `sv-form-data-${formId}`;
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

// 3. De knop: Definitief verzenden (Met API backend-koppeling)
    if (verzendKnop) {
        verzendKnop.addEventListener('click', () => {
            verzendKnop.disabled = true;
            const btnTekst = verzendKnop.querySelector('.crescendo-text');
            if(btnTekst) btnTekst.textContent = "Aanvraag versturen...";
            
            // Haal het opgeslagen formulieroverzicht op om te versturen
            const verzendData = JSON.parse(localStorage.getItem(storageKeyOverzicht));
            
            // Formatteer de data naar een leesbare tekst voor in de e-mail
            let emailInhoud = "Nieuwe concertaanvraag via de website:\n\n";
            verzendData.forEach(item => {
                emailInhoud += `--- ${item.sectie} ---\n`;
                emailInhoud += `VRAAG: ${item.vraag}\n`;
                emailInhoud += `ANTWOORD: ${item.antwoord}\n\n`;
            });

            // Bouw het pakketje (payload) voor de Form API (Voorbeeld via Web3Forms)
            const payload = {
                access_key: "d4adb78c-f276-4f7b-9c38-a5392aa40806", 
                subject: "Nieuwe Concert Aanvraag - Sociaal Vocaal",
                message: emailInhoud
            };

            // Stuur de data naar de server
            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            .then(async (response) => {
                if (response.status === 200) {
                    // Wis ál het formuliergeheugen na succesvol verzenden
                    localStorage.removeItem(storageKeyOrigineel);
                    localStorage.removeItem(storageKeyOverzicht);
                    localStorage.removeItem('sv-actieve-formulier-id');
                    localStorage.removeItem('sv-actieve-formulier-url');
                    
                    if(btnTekst) btnTekst.textContent = "Verzonden!";
                    
                    // 🟢 NIEUW: Stuur de gebruiker direct door naar de nieuwe bedankpagina
                    window.location.href = 'sjabloon_formulier-concert-aanvragen-verzendbevestiging.html';
                } else {
                    throw new Error("Verzenden mislukt via server");
                }
            })

            .catch(error => {
                console.error(error);
                if(btnTekst) btnTekst.textContent = "Definitief verzenden";
                verzendKnop.disabled = false;
                
                // 1. Zoek of maak de foutmelding-container dynamisch aan
                let serverErrorDiv = document.getElementById('server-fout');
                if (!serverErrorDiv) {
                    serverErrorDiv = document.createElement('div');
                    serverErrorDiv.id = 'server-fout';
                    serverErrorDiv.className = 'fout-overzicht mt-large';
                    serverErrorDiv.setAttribute('tabindex', '-1');
                    
                    // Plaats het fout-blok net boven de verzendknop-sectie
                    const submitSectie = verzendKnop.closest('.form-submit-sectie');
                    if (submitSectie && submitSectie.parentNode) {
                        submitSectie.parentNode.insertBefore(serverErrorDiv, submitSectie);
                    }
                }
                
                // 2. Vul het fout-blok met het bestaande, toegankelijke design
                serverErrorDiv.innerHTML = `
                    <div class="fout-header">
                        <span class="material-symbols-outlined icon-error" aria-hidden="true">wifi_off</span>
                        <h2 style="margin: 0; font-size: clamp(1.25rem, 3vw, 1.5rem);">Verzenden mislukt</h2>
                    </div>
                    <p style="margin-top: 0.5rem; margin-bottom: 0; font-weight: 500;">
                        Er is iets misgegaan bij het bereiken van de server. Controleer je internetverbinding en probeer het nog eens. Blijft dit gebeuren? Neem dan contact met ons op.
                    </p>
                `;
                
                // 3. Toon de fout en trek direct de (schermlezer) focus hierheen
                serverErrorDiv.hidden = false;
                serverErrorDiv.focus();
                serverErrorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });
    }
});