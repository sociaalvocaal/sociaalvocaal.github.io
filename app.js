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
            
            if (isElementVisible(logoLink)) focusableElements.push(logoLink);
            
            const menuItems = Array.from(morphingMenu.querySelectorAll('a, button, [role="button"]'));
            menuItems.filter(isElementVisible).forEach(el => focusableElements.push(el));
            
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
});