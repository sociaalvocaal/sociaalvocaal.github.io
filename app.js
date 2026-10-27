document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('main-header');
    const menuBtn = document.getElementById('menu-toggle');
    const menuBtnText = menuBtn.querySelector('.menu-btn-text'); // Nieuw: Voor de Menu/Sluiten tekst
    const logoLink = document.querySelector('.logo-link'); // Nieuw: Voor de startpagina fallback
    const morphingMenu = document.getElementById('morphing-menu');
    const mainContent = document.getElementById('hoofdinhoud');
    const footerContent = document.querySelector('.footer');

    const bentoGrid = document.querySelector('.menu-bento-grid');
    const bentoItems = document.querySelectorAll('.menu-bento-item');
    const menuHeadings = document.querySelectorAll('.menu-heading');
    let activeHeading = null;

    if (morphingMenu) morphingMenu.setAttribute('inert', '');

    // 1. DYNAMISCHE TERUG-KNOP (Geoptimaliseerd voor Fitts's Law & Focus Order)
    const backBtn = document.createElement('button');
    backBtn.className = 'menu-back-btn';
    backBtn.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">arrow_back</span> Terug';
    backBtn.setAttribute('aria-expanded', 'true');
    backBtn.hidden = true; 
    
    // Voeg hem in de pill-bar, vlak voor de sluitknop
    const pillActions = document.querySelector('.pill-actions');
    if (pillActions) pillActions.insertBefore(backBtn, menuBtn);

    // 2. SCHERM-AFHANKELIJKE TOEGANKELIJKHEID
    function updateMobileAccessibility() {
        const isMobile = window.innerWidth < 768;
        
        menuHeadings.forEach(heading => {
            if (isMobile) {
                heading.setAttribute('role', 'button');
                heading.setAttribute('tabindex', '0');
                heading.setAttribute('aria-expanded', 'false');
            } else {
                heading.removeAttribute('role');
                heading.removeAttribute('tabindex');
                heading.removeAttribute('aria-expanded');
            }
        });
        
        if (!isMobile && bentoGrid && bentoGrid.classList.contains('is-drilldown')) {
            closeDrilldown();
        }
    }

    updateMobileAccessibility();
    window.addEventListener('resize', updateMobileAccessibility, { passive: true });

    // 3. LOGO ALS STARTPAGINA-ESCAPE (Nieuw)
    if(logoLink) {
        logoLink.addEventListener('click', () => {
            if (header.classList.contains('is-open')) {
                menuBtn.click(); // Sluit menu netjes af
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll direct naar boven
            }
        });
    }

    // 4. DRILL-DOWN EVENT LISTENERS
    menuHeadings.forEach(heading => {
        heading.addEventListener('click', () => { if (window.innerWidth < 768) openDrilldown(heading); });
        heading.addEventListener('keydown', (e) => {
            if (window.innerWidth < 768 && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                openDrilldown(heading);
            }
        });
    });

    // 5. SCROLL GEDRAG
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
    }, { passive: true });

    // 6. MENU OPENEN / SLUITEN (Inclusief Label-wissel)
    menuBtn.addEventListener('click', () => {
        const isOpen = header.classList.contains('is-open');

        if (isOpen) {
            header.classList.remove('is-open');
            menuBtn.setAttribute('aria-expanded', 'false');
            menuBtnText.textContent = 'Menu'; // Wissel label terug
            
            if(mainContent) mainContent.removeAttribute('inert');
            if(footerContent) footerContent.removeAttribute('inert');
            morphingMenu.setAttribute('inert', '');
            
            document.body.style.overflow = '';
            
            closeDrilldown();
            menuBtn.focus();
        } else {
            header.classList.add('is-open');
            menuBtn.setAttribute('aria-expanded', 'true');
            menuBtnText.textContent = 'Sluiten'; // Update label voor cognitieve duidelijkheid
            
            if(mainContent) mainContent.setAttribute('inert', '');
            if(footerContent) footerContent.setAttribute('inert', '');
            morphingMenu.removeAttribute('inert');
            
            document.body.style.overflow = 'hidden';
            
            morphingMenu.addEventListener('transitionend', function focusFirstLink(e) {
                if (e.propertyName === 'grid-template-rows' || e.propertyName === 'bottom') {
                    const focusable = morphingMenu.querySelectorAll('a, button, [role="button"]');
                    const visibleFocusable = Array.from(focusable).filter(isElementVisible);
                    if(visibleFocusable.length > 0) visibleFocusable[0].focus();
                    morphingMenu.removeEventListener('transitionend', focusFirstLink);
                }
            });
        }
    });

// 7. DRILL-DOWN LOGICA
    function openDrilldown(heading) {
        const parentItem = heading.closest('.menu-bento-item');
        
        bentoItems.forEach(item => {
            if (item === parentItem) {
                item.classList.add('is-active');
                heading.setAttribute('aria-expanded', 'true');
                heading.setAttribute('tabindex', '-1'); 
            } else {
                item.classList.add('is-hidden');
            }
        });
        
        bentoGrid.classList.add('is-drilldown');
        backBtn.hidden = false;
        activeHeading = heading;

        // WCAG FIX 3: Stuur focus direct naar de eerste link in het net geopende submenu
        const firstSubLink = parentItem.querySelector('.menu-list a');
        if (firstSubLink) {
            // setTimeout geeft de browser een milliseconde om 'display: flex' te renderen voordat focus wordt gezet
            setTimeout(() => firstSubLink.focus(), 50);
        }
    }

    backBtn.addEventListener('click', closeDrilldown);

    function closeDrilldown() {
        bentoItems.forEach(item => {
            item.classList.remove('is-active');
            item.classList.remove('is-hidden');
        });
        
        menuHeadings.forEach(h => { 
            if(h.hasAttribute('aria-expanded')) h.setAttribute('aria-expanded', 'false'); 
            if(window.innerWidth < 768) h.setAttribute('tabindex', '0'); 
        });
        
        if (bentoGrid) bentoGrid.classList.remove('is-drilldown');
        backBtn.hidden = true;
        
        if (activeHeading) {
            activeHeading.focus();
            activeHeading = null;
        }
    }

// 8. TOEGANKELIJKHEID: DYNAMISCHE FOCUS TRAP & VISUELE VOLGORDE
    function isElementVisible(el) {
        if (!el) return false;
        if (el.classList.contains('skip-btn')) return true; 
        return (el.offsetWidth > 0 || el.offsetHeight > 0) && 
               window.getComputedStyle(el).visibility !== 'hidden' &&
               !el.hasAttribute('hidden');
    }

    document.addEventListener('keydown', (e) => {
        // Sluit met Escape
        if (e.key === 'Escape' && header.classList.contains('is-open')) {
            menuBtn.click();
            return;
        }
        
        // Tab-navigatie overname
        if (e.key === 'Tab' && header.classList.contains('is-open')) {
            // 1. Bouw de VISUELE volgorde op in een array
            let focusableElements = [];
            const isLandscape = window.innerWidth < 768 && window.innerHeight <= 500;
            
            // In portretmodus: Logo staat visueel bovenaan
            if (!isLandscape && isElementVisible(logoLink)) focusableElements.push(logoLink);
            
            // Het scrolbare binnengebied (Menu items)
            const menuItems = Array.from(morphingMenu.querySelectorAll('a, button, [role="button"]'));
            menuItems.filter(isElementVisible).forEach(el => focusableElements.push(el));
            
            // In landscape-modus: Logo is verhuisd naar de balk onderaan
            if (isLandscape && isElementVisible(logoLink)) focusableElements.push(logoLink);
            
            // De knoppen in de balk onderaan
            if (isElementVisible(backBtn)) focusableElements.push(backBtn);
            if (isElementVisible(menuBtn)) focusableElements.push(menuBtn);
            
            // 2. Forceer de focus route via onze array, negeer de DOM volledig
            if (focusableElements.length > 0) {
                const currentIndex = focusableElements.indexOf(document.activeElement);
                
                if (e.shiftKey) {
                    // Achteruit (Shift + Tab)
                    if (currentIndex <= 0) {
                        focusableElements[focusableElements.length - 1].focus(); // Wrap naar einde
                    } else {
                        focusableElements[currentIndex - 1].focus(); // Eén stapje terug
                    }
                    e.preventDefault();
                } else {
                    // Vooruit (Tab)
                    if (currentIndex === -1 || currentIndex === focusableElements.length - 1) {
                        focusableElements[0].focus(); // Wrap naar begin
                    } else {
                        focusableElements[currentIndex + 1].focus(); // Eén stapje vooruit
                    }
                    e.preventDefault();
                }
            }
        }
    });

    // 9. MENU SLUITEN NA KLIK OP EEN LINK
    const menuLinks = morphingMenu.querySelectorAll('.menu-list a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (header.classList.contains('is-open')) {
                menuBtn.click(); 
            }
        });
    });

   // 10. ALGEMENE CARROUSEL BEDIENING (Herbruikbaar voor sponsoren & zangers)
    function setupCarousel(trackSelector, controlsSelector) {
        const track = document.querySelector(trackSelector);
        const controls = document.querySelector(controlsSelector);
        
        if (track && controls) {
            controls.removeAttribute('hidden');
            track.removeAttribute('tabindex'); 
            
            const prevBtn = controls.querySelector('.prev-btn');
            const nextBtn = controls.querySelector('.next-btn');
            
            const getScrollAmount = () => {
                const card = track.querySelector('li');
                const gap = parseFloat(window.getComputedStyle(track).gap) || 24;
                return card ? card.offsetWidth + gap : 300;
            };

            nextBtn.addEventListener('click', () => { track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' }); });
            prevBtn.addEventListener('click', () => { track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' }); });

            const updateButtonStates = () => {
                const isAtStart = track.scrollLeft <= 5;
                const isAtEnd = Math.ceil(track.scrollLeft + track.clientWidth) >= track.scrollWidth - 5;
                
                prevBtn.disabled = isAtStart;
                nextBtn.disabled = isAtEnd;
                
                // WCAG: Verschuif focus logisch als de knop ineens disabled wordt
                if (isAtStart && document.activeElement === prevBtn) nextBtn.focus();
                if (isAtEnd && document.activeElement === nextBtn) prevBtn.focus();
            };

            track.addEventListener('scroll', updateButtonStates, { passive: true });
            window.addEventListener('resize', updateButtonStates, { passive: true });
            setTimeout(updateButtonStates, 100); 
        }
    }

    // Initialiseer carrousels (indien ze op de pagina aanwezig zijn)
    setupCarousel('.sponsor-track', '.sponsor-header .carousel-controls');
    setupCarousel('.zangers-track', '.zangers-controls');
    setupCarousel('.read-more-track', '.read-more-sectie .carousel-controls');


    // 11. 3D ZANGERS CARROUSEL LOGICA (Uitsluitend voor het effect op Desktop)
    const zangersTrack = document.querySelector('.zangers-track');
    
    if (zangersTrack) {
        const zangerCards = document.querySelectorAll('.zanger-card');
        
        const update3DCarousel = () => {
            // Respecteer media queries via JS om overbodige class-updates te voorkomen
            if (window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                zangerCards.forEach(card => card.classList.remove('is-center', 'is-left', 'is-right'));
                return;
            }
            
            const trackRect = zangersTrack.getBoundingClientRect();
            const trackCenter = trackRect.left + (trackRect.width / 2);
            
            zangerCards.forEach(card => {
                const cardRect = card.getBoundingClientRect();
                const cardCenter = cardRect.left + (cardRect.width / 2);
                const distance = cardCenter - trackCenter;
                
                // Als de kaart binnen een marge van ~60px van het absolute centrum staat
                if (Math.abs(distance) < 60) {
                    card.classList.add('is-center');
                    card.classList.remove('is-left', 'is-right');
                } else if (distance < 0) {
                    card.classList.add('is-left');
                    card.classList.remove('is-center', 'is-right');
                } else {
                    card.classList.add('is-right');
                    card.classList.remove('is-center', 'is-left');
                }
            });
        };

        // Passive scroll listener (Blokkeert de native scroll prestaties niet)
        zangersTrack.addEventListener('scroll', update3DCarousel, { passive: true });
        window.addEventListener('resize', update3DCarousel, { passive: true });
        
        // Timeout geeft de DOM tijd om de breedtes te renderen
        setTimeout(update3DCarousel, 100);
    }
   
// ==========================================================================
    // ARTIKELEN: 1. Dynamische 'Reading Mode' Header
    // ==========================================================================
    const articleLayout = document.querySelector('.article-layout');
    const autoHideEnabled = document.body.classList.contains('auto-hide-header');
    
    if ((articleLayout || autoHideEnabled) && header) {
        let lastScrollPosition = window.pageYOffset;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollPosition = window.pageYOffset;
                    
                    if (currentScrollPosition > 500 && !header.classList.contains('is-open')) {
                        if (currentScrollPosition > lastScrollPosition) {
                            header.classList.add('is-reading');
                        } else {
                            header.classList.remove('is-reading');
                        }
                    } else if (currentScrollPosition <= 500) {
                        header.classList.remove('is-reading');
                    }

                    lastScrollPosition = currentScrollPosition;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ==========================================================================
    // ARTIKELEN: 2. Native Web Share API (Deel dit verhaal)
    // ==========================================================================
    const shareBtn = document.getElementById('share-article-btn');
    
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const shareData = {
                title: document.title,
                text: 'Lees dit prachtige verhaal over Sociaal Vocaal!',
                url: window.location.href
            };

            const btnText = shareBtn.querySelector('.share-btn-text');
            const btnIcon = shareBtn.querySelector('.material-symbols-outlined');
            const originalText = btnText.textContent;
            const originalIcon = btnIcon.textContent;

            // Check of de Web Share API beschikbaar is
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.log('Delen geannuleerd of mislukt: ', err);
                }
            } 
            // Fallback: Kopieer naar klembord voor desktops / oudere systemen
            else {
                try {
                    await navigator.clipboard.writeText(shareData.url);
                    
                    // Visuele bevestiging
                    btnText.textContent = 'Link gekopieerd!';
                    btnIcon.textContent = 'check_circle';
                    
                    // Reset na 3 seconden
                    setTimeout(() => {
                        btnText.textContent = originalText;
                        btnIcon.textContent = originalIcon;
                    }, 3000);
                } catch (err) {
                    btnText.textContent = 'Fout bij kopiëren';
                    console.error('Klembord API faalde: ', err);
                }
            }
        });
    }

});

// ==========================================================================
// MODULAIRE FORMULIERLOGICA
// Werkt op elk formulier met de class '.sv-form'
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('.sv-form');
    if (forms.length === 0) return;

    forms.forEach(form => {
        const controleKnop = form.querySelector('.crescendo-btn') || form.querySelector('button[type="submit"]'); 
        const foutLijst = form.querySelector('.fout-overzicht ul'); 
        const foutOverzicht = form.querySelector('.fout-overzicht');
        
        function getRequiredInputs() {
            return Array.from(form.querySelectorAll('input[required], select[required], textarea[required]'))
                 .filter(el => !el.closest('[hidden]'));
        }

        if (!controleKnop || !foutLijst || !foutOverzicht) return; 

        const storageKey = `sv-form-data-${form.id || 'standaard'}`;

        // 1. PROGRESSIVE ENHANCEMENT: CONTACTVELDEN 
        const contactSelect = form.querySelector('select[name="contact_voorkeur"]');
        
        if (contactSelect) {
            const contactVelden = {
                email: form.querySelector('#veld-email'),
                telefoon: form.querySelector('#veld-telefoon'),
                adres: form.querySelector('#veld-adres'),
                instagram: form.querySelector('#veld-instagram')
            };

            function updateContactVelden() {
                const geselecteerd = contactSelect.value;
                
                Object.values(contactVelden).forEach(container => {
                    if(container) {
                        container.hidden = true;
                        container.querySelectorAll('input, select, textarea').forEach(input => {
                            input.required = false;
                            // 🟢 AANGEPAST: Maak dynamisch verborgen velden direct schoon
                            verwijderFoutmelding(input); 
                        });
                    }
                });

                if (geselecteerd && contactVelden[geselecteerd]) {
                    const actieveContainer = contactVelden[geselecteerd];
                    actieveContainer.hidden = false;
                    actieveContainer.querySelectorAll('input, select, textarea').forEach(input => input.required = true);
                }
                
                checkFormulierStatus();
            }

            contactSelect.addEventListener('change', updateContactVelden);
            updateContactVelden(); 
        }

        // 2. INCLUSIEVE TEKST-TELLERS 
        const textareas = form.querySelectorAll('textarea');
        textareas.forEach(veld => {
            const teller = form.querySelector(`#${veld.id}-teller`);
            let lokaleTimer;
            const maxLengte = parseInt(veld.getAttribute('maxlength')) || 3000;
            
            if(teller) {
                veld.setAttribute('maxlength', maxLengte);
                
                veld.addEventListener('input', () => {
                    const resterend = maxLengte - veld.value.length;
                    teller.textContent = `Nog ${resterend} tekens over.`;
                    teller.style.color = resterend < 50 ? 'var(--color-text-error)' : 'var(--color-text-muted)';
                    
                    clearTimeout(lokaleTimer);
                    lokaleTimer = setTimeout(() => {
                        if(resterend < 100) {
                            teller.setAttribute('aria-live', 'assertive');
                        } else {
                            teller.setAttribute('aria-live', 'polite');
                        }
                    }, 1000);
                });
            }
        });

        // 3. UNIVERSELE VALIDATIEFUNCTIE
        function valideerVeld(input) {
            if (input.type === 'radio' || input.type === 'checkbox') {
                const group = form.querySelectorAll(`input[name="${input.name}"]`);
                const isAangevinkt = Array.from(group).some(item => item.checked);
                return { isGeldig: isAangevinkt, meldingen: isAangevinkt ? [] : ["Dit veld is nog niet ingevuld."] };
            }

            const getrimdeWaarde = input.value.trim();
            const spatielozeWaarde = getrimdeWaarde.replace(/\s+/g, '');
            let meldingen = []; 

            if (getrimdeWaarde === '') {
                return { isGeldig: false, meldingen: ["Dit veld is nog niet ingevuld."] };
            }

            if (input.type === 'email') {
                let hasAt = spatielozeWaarde.includes('@');
                let hasDot = spatielozeWaarde.includes('.');
                if (!hasAt) meldingen.push("Er ontbreekt een apenstaartje (@) in het e-mailadres.");
                if (!hasDot) meldingen.push("Er ontbreekt een punt (.) in het e-mailadres.");
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (hasAt && hasDot && !emailRegex.test(spatielozeWaarde)) {
                    meldingen.push("Controleer of het e-mailadres compleet is.");
                }
            }

            if (input.type === 'tel') {
                const geldigeTekensRegex = /^[\d\+\-()]+$/;
                if (!geldigeTekensRegex.test(spatielozeWaarde)) {
                    meldingen.push("Een telefoonnummer mag geen letters bevatten. Gebruik alleen cijfers (een + of - mag ook).");
                }
                const aantalCijfers = spatielozeWaarde.replace(/[^\d]/g, '').length;
                if (aantalCijfers > 0 && aantalCijfers < 8) {
                    meldingen.push("Dit telefoonnummer is te kort. Vul minimaal 8 cijfers in.");
                }
            }

            if (input.getAttribute('autocomplete') === 'postal-code' || input.name === 'contact_postcode') {
                const postcodeRegex = /^[1-9][0-9]{3}[A-Za-z]{2}$/;
                if (!postcodeRegex.test(spatielozeWaarde)) {
                    meldingen.push("Vul een geldige postcode in met 4 cijfers en 2 letters.");
                }
            }
            
            if (input.getAttribute('inputmode') === 'numeric' || input.pattern === '[0-9]*') {
                const numRegex = /^\d+$/; 
                if (!numRegex.test(spatielozeWaarde)) {
                    meldingen.push("Vul hier alleen cijfers in.");
                }
            }

            if (input.type === 'url') {
                const urlRegex = /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?$/;
                if (!urlRegex.test(spatielozeWaarde)) {
                    meldingen.push("Vul een geldig webadres in (bijv. www.bedrijf.nl).");
                }
            }

            if (input.name === 'contact_insta' || input.name === 'instagram') {
                if (getrimdeWaarde.toLowerCase().includes('instagram.com')) {
                    meldingen.push("Vul alleen de gebruikersnaam in, niet de hele link.");
                }
            }

            return { isGeldig: meldingen.length === 0, meldingen: meldingen };
        }

        // 4. STATISCHE CRESCENDO KNOP
        function checkFormulierStatus() {
            const currentRequired = getRequiredInputs();
            const isHelemaalGeldig = currentRequired.every(input => valideerVeld(input).isGeldig);

            if (isHelemaalGeldig) {
                controleKnop.classList.add('is-ready');
            } else {
                controleKnop.classList.remove('is-ready');
            }
        }

        // 5. HELPER FUNCTIE: Fouten Veilig Opruimen
        function verwijderFoutmelding(input) {
            const container = input.closest('.sv-input-wrapper, .sv-fieldset');
            if (!container) return;

            let fout = container.nextElementSibling;
            if (!fout || !fout.classList.contains('inline-foutmelding')) {
                fout = container.querySelector('.inline-foutmelding');
            }
            
            const errorId = fout ? fout.id : `error-${input.id || input.name}`;
            if (fout) fout.remove();

            const opschonenAria = (el) => {
                if (el.hasAttribute('aria-describedby')) {
                    let desc = el.getAttribute('aria-describedby');
                    desc = desc.replace(errorId, '').replace(/\s+/g, ' ').trim();
                    desc ? el.setAttribute('aria-describedby', desc) : el.removeAttribute('aria-describedby');
                }
            };

            opschonenAria(input);
            input.removeAttribute('aria-invalid');
            
            if(container.classList.contains('sv-fieldset')) {
                container.removeAttribute('aria-invalid');
                container.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(r => {
                    r.removeAttribute('aria-invalid');
                    opschonenAria(r);
                });
            }
        }

        // 6. HELPER FUNCTIE: Inline Fout Bouwen
        function bouwInlineFout(input, containerBovenFout, validatie) {
            const errorId = `error-${input.id || input.name}`;
            const aantalFouten = validatie.meldingen.length;
            
            let inlineError = document.getElementById(errorId);
            if (!inlineError) {
                inlineError = document.createElement('div');
                inlineError.className = 'inline-foutmelding';
                inlineError.id = errorId;
                
                if (input.type === 'radio' || input.type === 'checkbox') {
                    containerBovenFout.appendChild(inlineError);
                } else {
                    input.closest('.sv-input-wrapper').after(inlineError);
                }
            }

            const iconHtml = `<span class="material-symbols-outlined" aria-hidden="true">warning</span>`;
            let messagesHtml = '';

            if (aantalFouten === 1) {
                messagesHtml = `<span>${validatie.meldingen[0]}</span>`;
            } else {
                messagesHtml = `<div style="display: flex; flex-direction: column;">
                                    <span>Er staan ${aantalFouten} aandachtspunten open:</span>
                                    <ol style="margin-top: 0.25rem; margin-left: 1.25rem; padding-left: 0;">
                                        ${validatie.meldingen.map(m => `<li style="margin-bottom: 0.25rem;">${m}</li>`).join('')}
                                    </ol>
                                  </div>`;
            }
            
            inlineError.innerHTML = iconHtml + messagesHtml;

            if (input.type === 'radio' || input.type === 'checkbox') {
                containerBovenFout.setAttribute('aria-invalid', 'true'); 
                containerBovenFout.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(r => {
                    r.setAttribute('aria-invalid', 'true');
                    const currentDesc = r.getAttribute('aria-describedby') || '';
                    if (!currentDesc.includes(errorId)) {
                        r.setAttribute('aria-describedby', `${currentDesc} ${errorId}`.trim());
                    }
                });
            } else {
                input.setAttribute('aria-invalid', 'true');
                const currentDesc = input.getAttribute('aria-describedby') || '';
                if (!currentDesc.includes(errorId)) {
                    input.setAttribute('aria-describedby', `${currentDesc} ${errorId}`.trim());
                }
            }
        }


        // 7. AUTO-SAVE & LIVE-VALIDATIE BIJ TYPEN
        form.addEventListener('input', (e) => {
            checkFormulierStatus();
            saveFormData();
            
            // 🟢 AANGEPAST: We halen de fout pas weg als de 'valideerVeld' zegt dat hij écht is opgelost.
            // Check eerst of het veld uberhaupt een fout heeft
            const container = e.target.closest('.sv-input-wrapper, .sv-fieldset');
            if (!container) return;
            
            let foutAanwezig = container.nextElementSibling?.classList.contains('inline-foutmelding') || 
                               container.querySelector('.inline-foutmelding');
            
            if (foutAanwezig) {
                const validatie = valideerVeld(e.target);
                
                if (validatie.isGeldig) {
                    verwijderFoutmelding(e.target); // Helemaal goed, opruimen!
                } else {
                    // Nog steeds fouten: Update live de foutmelding met de resterende problemen!
                    bouwInlineFout(e.target, container, validatie); 
                }
            }
        });
        
        form.addEventListener('change', checkFormulierStatus);

        function saveFormData() {
            const formData = new FormData(form);
            const dataObj = {};
            for (let [key, value] of formData.entries()) {
                dataObj[key] = value;
            }
            localStorage.setItem(storageKey, JSON.stringify(dataObj));
        }

        function loadFormData() {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                try {
                    const dataObj = JSON.parse(savedData);
                    Object.keys(dataObj).forEach(key => {
                        const veld = form.querySelector(`[name="${key}"]`);
                        if (!veld) return;
                        
                        if (veld.type === 'radio' || veld.type === 'checkbox') {
                            const targetRadio = form.querySelector(`[name="${key}"][value="${dataObj[key]}"]`);
                            if(targetRadio) {
                                targetRadio.checked = true;
                                targetRadio.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        } else {
                            veld.value = dataObj[key];
                            veld.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    });
                    if(contactSelect) updateContactVelden();
                } catch (e) {
                    console.error("Fout bij laden formulier data", e);
                }
            }
        }

        loadFormData();

// 4b. FORMULIER WISSEN & GEHEUGEN OPRUIMEN (Veilige & Toegankelijke variant)
        form.addEventListener('reset', (e) => {
            // 1. Voorkom per ongeluk wissen van een lang formulier
            if (!confirm('Weet je zeker dat je alle ingevulde gegevens wilt wissen? Dit kan niet ongedaan worden gemaakt.')) {
                e.preventDefault(); 
                return;
            }

            // 2. Wacht een milliseconde tot de browser de velden native heeft leeggemaakt
            setTimeout(() => {
                localStorage.removeItem(storageKey);
                foutLijst.innerHTML = '';
                foutOverzicht.hidden = true;
                
                // 3. Veilig alle velden afgaan en opschonen
                const alleInputs = form.querySelectorAll('input, select, textarea');
                alleInputs.forEach(input => {
                    verwijderFoutmelding(input);
                    
                    if (input.tagName.toLowerCase() === 'textarea') {
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                });
                
                if (contactSelect) updateContactVelden();
                checkFormulierStatus();
                
                // 4. 🟢 NIEUW: Akoestische bevestiging voor schermlezers
                const statusRegio = form.querySelector('#verwijder-status');
                if (statusRegio) {
                    statusRegio.textContent = "Alle ingevulde gegevens zijn succesvol gewist. Je staat nu weer bij de eerste vraag.";
                    // Maak de melding na 3 seconden weer leeg zodat hij een volgende keer opnieuw kan worden voorgelezen
                    setTimeout(() => statusRegio.textContent = '', 3000);
                }

                // 5. Zet de focus terug naar het eerste invulveld
                const eersteVeld = form.querySelector('input:not([type="hidden"]), select, textarea');
                if (eersteVeld) eersteVeld.focus();
                
            }, 10);
        });

        // Stel deze functie beschikbaar voor de toekomstige controlepagina
        form.wisFormulierGeheugen = () => {
            localStorage.removeItem(storageKey);
        };

        // 8. VERZEND-ACTIE & FOUTAFHANDELING
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            foutLijst.innerHTML = '';
            // Gebruik de nieuwe helper functie om alles schoon te vegen vóór de scan
            getRequiredInputs().forEach(input => verwijderFoutmelding(input));
            
            let eersteFout = null;
            const gecontroleerdeRadios = new Set();
            
            const currentRequired = getRequiredInputs();

            currentRequired.forEach(input => {
                const validatie = valideerVeld(input);
                
                let labelTekst = 'Een verplicht veld';
                let vraagNummerTekst = ''; 
                let isSubVraag = input.closest('.sub-veld') ? true : false; 
                let containerBovenFout = input.closest('.sv-form-group'); 
                
                function verwerkLabel(ruweTekst) {
                    const nummerMatch = ruweTekst.match(/Vraag\s+(\d+)\s+van\s+\d+/i);
                    if (nummerMatch) {
                        vraagNummerTekst = isSubVraag ? `De extra vraag onder vraag ${nummerMatch[1]} ` : `Vraag ${nummerMatch[1]} `;
                        return ruweTekst.replace('*', '').replace(/Vraag \d+ van \d+ \((niet )?verplicht\)\.?/i, '').trim();
                    }
                    return ruweTekst.replace('*', '').replace(/\((niet )?verplicht\)\.?/i, '').trim();
                }

                if(input.type === 'radio' || input.type === 'checkbox') {
                    if (gecontroleerdeRadios.has(input.name)) return; 
                    gecontroleerdeRadios.add(input.name);
                    
                    const fieldset = input.closest('fieldset');
                    if(fieldset) {
                        containerBovenFout = fieldset; 
                        const legend = fieldset.querySelector('legend');
                        if(legend) labelTekst = verwerkLabel(legend.textContent);
                    }
                } else {
                    const label = form.querySelector(`label[for="${input.id}"]`);
                    if(label) {
                         const formGroupParent = input.closest('.sv-form-group:not(.sub-veld)');
                         let volledigeTekst = label.textContent;
                         if (isSubVraag && formGroupParent) {
                             const hoofdNummer = formGroupParent.querySelector('.vraag-nummer');
                             if (hoofdNummer) volledigeTekst = hoofdNummer.textContent + " " + volledigeTekst;
                         }
                         labelTekst = verwerkLabel(volledigeTekst);
                    }
                }

                if (!validatie.isGeldig) {
                    const hrefTarget = (input.type === 'radio' || input.type === 'checkbox') 
                        ? `#${form.querySelector(`input[name="${input.name}"]`).id}` 
                        : `#${input.id}`;
                        
                    const aantalFouten = validatie.meldingen.length;

                    // A. Bouw Error Summary Bovenin
                    const liTop = document.createElement('li');
                    const aLink = document.createElement('a');
                    aLink.href = hrefTarget;

                    if (aantalFouten === 1) {
                        aLink.textContent = (input.value.trim() === '') 
                            ? `${vraagNummerTekst}'${labelTekst}' is nog niet ingevuld.` 
                            : `${vraagNummerTekst}'${labelTekst}' heeft aandacht nodig. ${validatie.meldingen[0]}`;
                        liTop.appendChild(aLink);
                    } else {
                        aLink.textContent = `${vraagNummerTekst}'${labelTekst}' heeft aandacht nodig. Er zijn ${aantalFouten} punten open:`;
                        liTop.appendChild(aLink);
                        
                        const olTop = document.createElement('ol');
                        olTop.style.marginTop = '0.5rem';
                        olTop.style.marginBottom = '1rem';
                        olTop.style.paddingLeft = '1.5rem';
                        
                        validatie.meldingen.forEach(melding => {
                            const subLi = document.createElement('li');
                            subLi.textContent = melding;
                            subLi.style.marginBottom = '0.25rem';
                            subLi.style.color = 'var(--color-text-error)';
                            olTop.appendChild(subLi);
                        });
                        liTop.appendChild(olTop);
                    }
                    
                    foutLijst.appendChild(liTop);

                    // B. Bouw Inline Fout onder het veld
                    if (containerBovenFout) {
                        bouwInlineFout(input, containerBovenFout, validatie);
                    }

                    if (!eersteFout) eersteFout = input;
                }
            });

            if (eersteFout) {
                foutOverzicht.hidden = false;
                foutOverzicht.focus();
                foutOverzicht.scrollIntoView({ behavior: 'smooth', block: 'center' });
} else {
                foutOverzicht.hidden = true;
                
                const verzendStatus = form.querySelector('.sr-only[aria-live="assertive"]'); 
                if(verzendStatus) verzendStatus.textContent = "Gegevens worden verwerkt, je gaat nu naar de controlepagina...";
                
                controleKnop.disabled = true;
                const btnTekst = controleKnop.querySelector('.crescendo-text') || controleKnop;
                if(btnTekst) btnTekst.textContent = "Laden...";

                // 🟢 NIEUW: Bouw dynamisch een menselijk leesbaar formulier-overzicht op
                const overzichtData = [];
                const alleVelden = Array.from(form.querySelectorAll('input[name], select[name], textarea[name]'));
                const verwerkteNamen = new Set();
                
                alleVelden.forEach(veld => {
                    if (verwerkteNamen.has(veld.name)) return; // Bij radio's maar 1 keer scannen
                    if (veld.closest('[hidden]')) return; // Negeer velden die door de gebruiker onzichtbaar zijn gelaten
                    verwerkteNamen.add(veld.name);
                    
                    let vraagTekst = veld.name;
                    let antwoordTekst = "";
                    let isSubVraag = veld.closest('.sub-veld') ? true : false;
                    
                    // 1. Haal de mooie, menselijke vraag en het antwoord op
                    if (veld.type === 'radio' || veld.type === 'checkbox') {
                        const fieldset = veld.closest('fieldset');
                        if (fieldset) {
                            const legend = fieldset.querySelector('legend');
                            if (legend) {
                                vraagTekst = legend.textContent.replace('*', '').replace(/Vraag \d+ van \d+ \((niet )?verplicht\)\.?/i, '').trim();
                            }
                        }
                        // Haal de tekst van het bolletje op (bijv. "Ja, ik wil dat" i.p.v. alleen "ja")
                        const checked = form.querySelector(`input[name="${veld.name}"]:checked`);
                        if (checked) {
                            const radioLabel = form.querySelector(`label[for="${checked.id}"] .radio-text`);
                            antwoordTekst = radioLabel ? radioLabel.textContent.trim() : checked.value;
                        }
                    } else {
                        const label = form.querySelector(`label[for="${veld.id}"]`);
                        if (label) {
                            let volledigeTekst = label.textContent;
                            if (isSubVraag) {
                                const formGroupParent = veld.closest('.sv-form-group:not(.sub-veld)');
                                if (formGroupParent) {
                                    const hoofdNummer = formGroupParent.querySelector('.vraag-nummer');
                                    if (hoofdNummer) volledigeTekst = hoofdNummer.textContent + " " + volledigeTekst;
                                }
                            }
                            vraagTekst = volledigeTekst.replace('*', '').replace(/Vraag \d+ van \d+ \((niet )?verplicht\)\.?/i, '').trim();
                        }
                        
                        if (veld.tagName.toLowerCase() === 'select') {
                            const optie = veld.options[veld.selectedIndex];
                            antwoordTekst = (optie && optie.value) ? optie.textContent : "";
                        } else {
                            antwoordTekst = veld.value.trim();
                        }
                    }
                    
                    // 2. Haal de sectietitel op voor groepering (bijv. "1. Jouw gegevens")
                    const sectie = veld.closest('.form-bento-sectie');
                    let sectieTitel = "Gegevens";
                    if (sectie) {
                        const titelEl = sectie.querySelector('.bento-sectie-titel');
                        if (titelEl) sectieTitel = titelEl.textContent.trim();
                    }
                    
                    // Alleen toevoegen als het geen reset/submit sectie is
                    if (!sectieTitel.includes('Naar controle')) {
                        overzichtData.push({ sectie: sectieTitel, vraag: vraagTekst, antwoord: antwoordTekst });
                    }
                });
                
                // Sla het leesbare pakketje op in het geheugen
                localStorage.setItem(storageKey + '-overzicht', JSON.stringify(overzichtData));
                
                // 🟢 NIEUW: Geef aan controle.js door vanaf welk formulier en welke pagina we komen
                localStorage.setItem('sv-actieve-formulier-id', form.id || 'standaard');
                localStorage.setItem('sv-actieve-formulier-url', window.location.href);
                
                // 3. Navigeer naar de NIEUWE controlepagina
                setTimeout(() => {
                    window.location.href = 'sjabloon_formulier_controlepagina.html'; 
                }, 1000);
            }
        });
    });
});

// ==========================================================================
// CONTENTPAGINA & ARTIKELEN (HERO ANIMATIES & BACK-TO-TOP)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // 1. Intersection Observer voor Staggered Hero Animatie
    const staggerElements = document.querySelectorAll('.fade-in-stagger');
    
    if (staggerElements.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const staggerObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, index * 150);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        staggerElements.forEach(el => staggerObserver.observe(el));
    }

    // 2. Back-to-Top Knop (Verschijnt pas na 500px scrollen)
    const backToTopBtn = document.querySelector('.btn-back-to-top');
    
    if (backToTopBtn) {
        let isBtnVisible = false;
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollPos = window.scrollY || window.pageYOffset;
                    
                    if (scrollPos > 500) {
                        if (!isBtnVisible) {
                            backToTopBtn.classList.add('is-visible');
                            isBtnVisible = true;
                        }
                    } else {
                        if (isBtnVisible) {
                            backToTopBtn.classList.remove('is-visible');
                            isBtnVisible = false;
                        }
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        
        backToTopBtn.addEventListener('click', () => {
            setTimeout(() => {
                const hoofdinhoud = document.getElementById('hoofdinhoud');
                if (hoofdinhoud) hoofdinhoud.focus();
            }, 100);
        });
    }

});