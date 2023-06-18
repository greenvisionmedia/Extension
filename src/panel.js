// SETTINGS PANEL ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Wait for the export button to appear in the DOM
lookFor('.left-sidebar-links', 1000).then(injectPanel);

function injectPanel(sidebar) {
    // Inject HTML for settings panel
    sidebar.insertAdjacentHTML('beforeEnd', '{{panel.html}}');

    const Panel = {
        this: get('panel'),
        button: get('panel-button'),
        exit: get('panel-exit'),
    };

    // Open the side panel
    Panel.button.addEventListener('click', (e) => {
        closeSidebarPanels(sidebar);
        toggle(Panel.this);
        toggle(Panel.button);
    });

    // Close the panel
    Panel.exit.addEventListener('click', (e) => {
        off(Panel.this);
        off(Panel.button);
    });

    sidebar.querySelectorAll('div.button').forEach((button) => {
        button.addEventListener('click', () => {
            off(Panel.this);
            off(Panel.button);
        });
    });
}

function closeSidebarPanels(sidebar) {
    sidebar.querySelectorAll('div.button').forEach((button) => {
        if (button.classList.contains('active')) {
            button.click();
        }
    });
}
