document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('main-header');
    const menuBtn = document.getElementById('menu-toggle');
    const morphingMenu = document.getElementById('morphing-menu');
    
    const mainContent = document.getElementById('hoofdinhoud');
    const footerContent = document.querySelector('.footer');

    // INITIALISATIE: Maak het menu standaard inert als de pagina laadt
    if (morphingMenu) {
        morphingMenu.setAttribute('inert', '');
    }

    // 1. Scroll gedrag
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    }, { passive: true });

    // 2. Menu Toggle logica
    menuBtn.addEventListener('click', () => {
        const isOpen = header.classList.contains('is-open');

        if (isOpen) {
            // SLUITEN
            header.classList.remove('is-open');
            menuBtn.setAttribute('aria-expanded', 'false');
            
            // Maak de pagina weer toegankelijk
            if(mainContent) mainContent.removeAttribute('inert');
            if(footerContent) footerContent.removeAttribute('inert');
            
            // Maak het verborgen menu direct weer inert
            morphingMenu.setAttribute('inert', '');
            
            menuBtn.focus();
        } else {
            // OPENEN
            header.classList.add('is-open');
            menuBtn.setAttribute('aria-expanded', 'true');
            
            // Maak de rest van de pagina inert
            if(mainContent) mainContent.setAttribute('inert', '');
            if(footerContent) footerContent.setAttribute('inert', '');
            
            // Haal inert van het menu AF zodat je erin kan navigeren
            morphingMenu.removeAttribute('inert');
            
            // Wacht betrouwbaar op het einde van de CSS transitie in plaats van timeout
            morphingMenu.addEventListener('transitionend', function focusFirstLink(e) {
                if (e.propertyName === 'grid-template-rows') {
                    const firstLink = morphingMenu.querySelector('a');
                    if(firstLink) firstLink.focus();
                    morphingMenu.removeEventListener('transitionend', focusFirstLink);
                }
            });
            
            // Fallback voor gebruikers met prefers-reduced-motion: reduce
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                const firstLink = morphingMenu.querySelector('a');
                if(firstLink) firstLink.focus();
            }
        }
    });

    // 3. Toegankelijkheid toevoegingen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && header.classList.contains('is-open')) {
            menuBtn.click();
        }
        
        // Loop de focus rond in het menu (Focus Trap sluiten)
        if (e.key === 'Tab' && header.classList.contains('is-open')) {
            // We selecteren nu alleen nog de linkjes BINNEN het morphing-menu en de sluitknop
            const focusableElements = header.querySelectorAll('#morphing-menu a, #menu-toggle');
            if (focusableElements.length > 0) {
                const firstElement = focusableElements[0]; 
                const lastElement = focusableElements[focusableElements.length - 1]; 
                
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else { // Alleen Tab
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        }
    });
});