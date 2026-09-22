document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('main-header');
    const menuBtn = document.getElementById('menu-toggle');
    const morphingMenu = document.getElementById('morphing-menu');
    
    const mainContent = document.getElementById('hoofdinhoud');
    const footerContent = document.querySelector('.footer');

    // 1. Scroll gedrag
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    }, { passive: true });

    // 2. Menu Toggle logica met Transition-events (Geen setTimeout hacks meer)
    menuBtn.addEventListener('click', () => {
        const isOpen = header.classList.contains('is-open');

        if (isOpen) {
            // SLUITEN
            header.classList.remove('is-open');
            menuBtn.setAttribute('aria-expanded', 'false');
            
            if(mainContent) mainContent.removeAttribute('inert');
            if(footerContent) footerContent.removeAttribute('inert');
            
            menuBtn.focus();
        } else {
            // OPENEN
            header.classList.add('is-open');
            menuBtn.setAttribute('aria-expanded', 'true');
            
            if(mainContent) mainContent.setAttribute('inert', '');
            if(footerContent) footerContent.setAttribute('inert', '');
            
            // Wacht betrouwbaar op het einde van de CSS transitie in plaats van timeout
            morphingMenu.addEventListener('transitionend', function focusFirstLink(e) {
                // Check of de transitie echt van de container is (grid-template-rows)
                if (e.propertyName === 'grid-template-rows') {
                    const firstLink = morphingMenu.querySelector('a');
                    if(firstLink) firstLink.focus();
                    // Verwijder listener om dubbele vuringen te voorkomen
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
        // Escape-toets sluit menu
        if (e.key === 'Escape' && header.classList.contains('is-open')) {
            menuBtn.click();
        }
        
        // Loop de focus rond in het menu (Focus Trap sluiten)
        if (e.key === 'Tab' && header.classList.contains('is-open')) {
            const focusableElements = header.querySelectorAll('a, button');
            const firstElement = focusableElements[0]; // De logo link of skip link
            const lastElement = focusableElements[focusableElements.length - 1]; // Laatste link in het menu
            
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
    });
});