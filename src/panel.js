// SETTINGS PANEL ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Wait for the export button to appear in the DOM
lookFor('.left-sidebar-links', 1000).then(injectPanel);

function injectPanel(sidebar) {
    // Inject HTML for settings panel
    sidebar.insertAdjacentHTML('beforeEnd', '{{panel.html}}');

    const settings = {
        panel: g('panel'),
        panelButton: g('panel-button'),
        exit: g('panel-exit'),
    };

    // Open the side panel
    settings.panelButton.addEventListener('click', (e) => {
        closeSidebarPanels(sidebar);
        settings.panel.classList.toggle('on');
        settings.panelButton.classList.toggle('on');
    });

    // Close the panel
    settings.exit.addEventListener('click', (e) => {
        settings.panel.classList.remove('on');
        settings.panelButton.classList.remove('on');
    });

    sidebar.querySelectorAll('div.button').forEach((button) => {
        button.addEventListener('click', () => {
            settings.panel.classList.remove('on');
            settings.panelButton.classList.remove('on');
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
