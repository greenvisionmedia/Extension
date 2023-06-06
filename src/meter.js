// CARBON METER ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * This gives an estimate of the CO2 that will be emitted by the finished website.
 *
 * Uses co2.js https://developers.thegreenwebfoundation.org/co2js/overview/
 *
 * Useful in conjunction with a 'carbon budget' - similar to a website performance budget,
 * where the designer comes up with a maximum number of grams of carbon that the final site
 * should emit when it is viewed.
 */

// Setup CO2.js object with the sustainable web design model
const swd = new co2.co2();

// Wait for the part of the top bar where the preview icon
lookFor('[data-automation-id="preview-mode-button"]', 1000).then(injectMeter);

function injectMeter(previewButton) {
    //Inject HTML for CO2 meter
    previewButton.insertAdjacentHTML('afterEnd', '{{meter.html}}');

    // Set up a carbon meter object with the meter and a setCarbon method
    const carbon = {
        meter: g('meter'),
        meterButton: g('meter-button'),
        setCarbon: setCarbonData,
    };

    // When using the GV publish menu, this custom event will fire. Use this to update the carbon meter
    document.addEventListener('gv-downloaded', carbon.setCarbon());
}

async function setCarbonData() {
    // Get download size from background script
    const configData = await chrome.storage.local.get('FILE_SIZE');
    let emissions = swd.perByte(configData.FILE_SIZE);

    // Update UI
    this.meter.firstChild.innerHTML = emissions.toPrecision(2) + 'g ';
}
