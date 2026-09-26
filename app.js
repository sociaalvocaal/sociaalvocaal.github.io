document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('main-header');
    const menuBtn = document.getElementById('menu-toggle');
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
    
    // Voeg hem in de pill-bar (het zwevende eilandje onderaan), vlak voor de sluitknop
    const pillActions = document.querySelector('.pill-actions');
    if (pillActions) {
        pillActions.insertBefore(backBtn, menuBtn);
    }

    // 2. SCHERM-AFHANKELIJKE TOEGANKELIJKHEID (De Desktop-Fix)
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
        
        // Sluit per ongeluk opengebleven mobiele menu's bij resizen naar desktop
        if (!isMobile && bentoGrid && bentoGrid.classList.contains('is-drilldown')) {
            closeDrilldown();
        }
    }

    updateMobileAccessibility();
    window.addEventListener('resize', updateMobileAccessibility, { passive: true });

    // 3. DRILL-DOWN EVENT LISTENERS
    menuHeadings.forEach(heading => {
        heading.addEventListener('click', () => { if (window.innerWidth < 768) openDrilldown(heading); });
        heading.addEventListener('keydown', (e) => {
            if (window.innerWidth < 768 && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                openDrilldown(heading);
            }
        });
    });

    // 4. SCROLL GEDRAG
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
    }, { passive: true });

// 5. MENU OPENEN / SLUITEN
    menuBtn.addEventListener('click', () => {
        const isOpen = header.classList.contains('is-open');

        if (isOpen) {
            header.classList.remove('is-open');
            menuBtn.setAttribute('aria-expanded', 'false');
            if(mainContent) mainContent.removeAttribute('inert');
            if(footerContent) footerContent.removeAttribute('inert');
            morphingMenu.setAttribute('inert', '');
            
            // HERSTEL DE SCROLL
            document.body.style.overflow = '';
            
            closeDrilldown();
            menuBtn.focus();
        } else {
            header.classList.add('is-open');
            menuBtn.setAttribute('aria-expanded', 'true');
            if(mainContent) mainContent.setAttribute('inert', '');
            if(footerContent) footerContent.setAttribute('inert', '');
            morphingMenu.removeAttribute('inert');
            
            // BEVRIES DE ACHTERGROND SCROLL
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

    // 6. DRILL-DOWN LOGICA
    function openDrilldown(heading) {
        const parentItem = heading.closest('.menu-bento-item');
        
        bentoItems.forEach(item => {
            if (item === parentItem) {
                item.classList.add('is-active');
                heading.setAttribute('aria-expanded', 'true');
                // WCAG FIX: Maak de kop tijdelijk onbereikbaar voor Tab als hij de titel is geworden
                heading.setAttribute('tabindex', '-1'); 
            } else {
                item.classList.add('is-hidden');
            }
        });
        
        bentoGrid.classList.add('is-drilldown');
        backBtn.hidden = false;
        backBtn.focus();
        activeHeading = heading;
    }

    backBtn.addEventListener('click', closeDrilldown);

    function closeDrilldown() {
        bentoItems.forEach(item => {
            item.classList.remove('is-active');
            item.classList.remove('is-hidden');
        });
        
        menuHeadings.forEach(h => { 
            if(h.hasAttribute('aria-expanded')) h.setAttribute('aria-expanded', 'false'); 
            // WCAG FIX: Maak alle 'deuren' weer bereikbaar voor toetsenbordgebruikers
            if(window.innerWidth < 768) h.setAttribute('tabindex', '0'); 
        });
        
        if (bentoGrid) bentoGrid.classList.remove('is-drilldown');
        backBtn.hidden = true;
        
        if (activeHeading) {
            activeHeading.focus();
            activeHeading = null;
        }
    }

    // 7. TOEGANKELIJKHEID: DYNAMISCHE FOCUS TRAP
    function isElementVisible(el) {
        // WCAG FIX: Skip-links hebben height:0, maar mógen niet weggefilterd worden!
        if (el.classList.contains('skip-btn')) return true; 
        
        return (el.offsetWidth > 0 || el.offsetHeight > 0) && 
               window.getComputedStyle(el).visibility !== 'hidden' &&
               !el.hasAttribute('hidden');
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && header.classList.contains('is-open')) menuBtn.click();
        
        if (e.key === 'Tab' && header.classList.contains('is-open')) {
            // FIX: Voeg .menu-back-btn toe aan de query selector zodat we hem niet kwijtraken in de loop
            const allFocusable = header.querySelectorAll('#morphing-menu a, #morphing-menu button, #morphing-menu [role="button"], #menu-toggle, .menu-back-btn');
            const visibleFocusable = Array.from(allFocusable).filter(isElementVisible);
            
            if (visibleFocusable.length > 0) {
                const firstElement = visibleFocusable[0]; 
                const lastElement = visibleFocusable[visibleFocusable.length - 1]; 
                
                if (e.shiftKey && document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    });

    // 8. MENU SLUITEN NA KLIK OP EEN LINK
    const menuLinks = morphingMenu.querySelectorAll('.menu-list a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (header.classList.contains('is-open')) {
                // Simuleer een klik op de menu-knop om al onze bestaande sluit-logica (en inert-resets) te triggeren
                menuBtn.click(); 
            }
        });
    });
});