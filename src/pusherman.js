/**
 * GV EXTENSION | Content script
 *
 * Injects code for the publish modal, the carbon calculator, and the SVG compressor.
 */

// Query shorthand
const g = (i) => document.getElementById(i);

// Wait for DOM elements to appear, avoids querying bits of the Webflow designer that haven't loaded yet
function waitFor(waitClass, callback, interval) {
    const wait = setInterval(() => {
        const waitNode = document.querySelector(waitClass);
        if (waitNode) {
            clearInterval(wait);
            callback(waitNode);
        }
    }, interval);
}

// PUBLISH MODAL /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * This speeds up the process of exporting code from Webflow and uploading it to the server.
 *
 * Rather than downloading the .zip, uncompressing it, uploading to github/udesly/netlify etc.,
 * you just hit publish. The zip gets downloaded automatically, at which point you can drag it
 * straight back into an upload modal, all without ever leaving Webflow.
 *
 * Our backend service takes care of the rest, passing it straight to either the final release domain
 * or a staging domain, and making other changes according to the settings which are recorded by the pm
 * in this modal.
 */

// Register custom events for when the site .zip file is downloaded,
// when a user successfully logs in, and whenever files are successfully uploaded
const pmDownloaded = new Event('pm-downloaded');
const pmLogin = new Event('pm-login');
const pmComplete = new Event('pm-complete');

// Wait for the export button to appear in the DOM
waitFor('.bem-TopBar_Body_ExportButton', injectModal, 1000);

// Add all the markup for the modal
function injectModal(exportButton) {
    // Inject HTML for publish modal button
    exportButton.insertAdjacentHTML(
        'beforeBegin',
        '<div id="modal-button"><svg aria-hidden="true" focusable="false" width="17" height="17" viewBox="0 0 17 19"><path d="M12.6,19.2c-4.1-2.2-7.7-5.2-11.1-8.3,0,0-1.5-1.4-1.5-1.4C3.1,6.2,6.3,3,9.7,0c2.6,2.8,5.2,5.9,7.4,9.1-2,1.5-4,2.9-6.3,4,1-1.9,2.2-3.6,3.4-5.3v1.9c-2.2-1.6-4.3-3.5-6.3-5.3,0,0,3,0,3,0-2.1,2.2-4.3,4.3-6.5,6.4v-3c3.1,3.5,6,7.1,8.1,11.3h0Z"></path></svg></div>'
    );

    // Inject the HTML for the modal
    let modal = document.createElement('dialog');
    modal.id = 'modal';
    modal.innerHTML = '{{modal.html}}'; // This string gets replaced during gulp build by ./modal.html
    document.body.appendChild(modal);

    // Setup a publish modal object with all UI elements and methods for closing, configuring data and reseting
    const pm = {
        modal: modal,
        modalButton: g('modal-button'),
        exit: g('exit'),
        page1: g('page-1'),
        page2: g('page-2'),
        page3: g('page-3'),
        login: g('login'),
        username: g('username'),
        password: g('password'),
        cancel: g('cancel'),
        publish: g('publish'),
        subtitle: g('subtitle'),
        settings: g('settings'),
        form: g('form'),
        save: g('save'),
        restart: g('restart'),
        site: g('site'),
        inputs: {
            domain: g('domain'),
            siteCode: g('site-code'),
            release: g('release'),
            staging: g('staging'),
            scripts: g('scripts'),
        },
        dropArea: g('drop-area'),
        dropText: g('drop-text'),
        link: g('link'),
        upload: g('upload'),
        uploadLabel: g('upload-label'),
        icons: {
            file: g('file'),
            loading: g('loading'),
            complete: g('complete'),
        },
        close: closeModal,
        reset: resetModal,
        configure: configureModal,
        setConfig: setConfigData,
    };

    pm.reset(); // Resets various pm state changes using stored chrome variables
    pm.configure(); // Sets the advanced options menu to the configured state

    // Toggle modal
    pm.modalButton.addEventListener('click', (e) => {
        e.preventDefault;
        modal.showModal();
    });

    // Close the modal
    pm.exit.addEventListener('click', (e) => {
        e.preventDefault;
        pm.close();
        pm.reset();
    });

    pm.cancel.addEventListener('click', (e) => {
        e.preventDefault;
        pm.close();
        pm.reset();
    });

    document.addEventListener('keyup', (e) => {
        e.preventDefault;
        if (e.key === 'Escape') {
            pm.close();
            pm.reset();
        }
    });

    // Handle login
    // pm.login.addEventListener('click', (e) => {
    //     e.preventDefault;
    //     sendLoginData(pm.username.value, pm.password.value);
    // });

    // document.addEventListener('keyup', (e) => {
    //     e.preventDefault;
    //     if (e.key === 'Enter' && pm.page1.classList.contains('on')) {
    //         e.preventDefault;
    //         sendLoginData(pm.username.value, pm.password.value);
    //     }
    // });

    // document.addEventListener('pm-login', (e) => {
    //     pm.page1.classList.remove('on');
    //     pm.page2.classList.add('on');
    // });

    pm.login.addEventListener('click', (e) => {
        pm.page1.classList.remove('on');
        pm.page2.classList.add('on');
    });

    // Toggle advanced options
    pm.settings.addEventListener('click', (e) => {
        e.preventDefault;
        pm.settings.classList.toggle('on');
        pm.form.classList.toggle('on');
    });

    // These two buttons basically make up a 'radio button', only one should be on. I'll use which element has the "on" class to determine which is pressed.
    pm.inputs.staging.addEventListener('click', (e) => {
        e.preventDefault;
        pm.inputs.release.classList.remove('on');
        pm.inputs.staging.classList.add('on');
    });

    pm.inputs.release.addEventListener('click', (e) => {
        e.preventDefault;
        pm.inputs.release.classList.add('on');
        pm.inputs.staging.classList.remove('on');
    });

    // Hitting save turns pointerevents off on the form inputs, shows a new 'restart' button where save was
    pm.save.addEventListener('click', (e) => {
        e.preventDefault;
        Object.values(pm.inputs).forEach((e) => {
            e.disabled = true;
        });
        pm.save.classList.remove('on');
        pm.restart.classList.add('on');

        pm.setConfig(); //Updates configuration data in chrome storage/GUI
    });

    // Hitting restart undoes the previous changes and allows access to the form again
    pm.restart.addEventListener('click', (e) => {
        e.preventDefault;
        Object.values(pm.inputs).forEach((e) => {
            e.disabled = false;
        });
        pm.save.classList.add('on');
        pm.restart.classList.remove('on');

        g('script-row').remove(); // Removes the fancy script pm
    });

    // By default the restart button shows 'Configured'; hovering over the restart button shows the text 'Restart'
    pm.restart.addEventListener('mouseenter', (e) => {
        e.preventDefault;
        pm.restart.innerHTML = 'Restart';
    });
    pm.restart.addEventListener('mouseleave', (e) => {
        e.preventDefault;
        pm.restart.innerHTML = 'Configured';
    });

    // Hitting publish shows the drag and drop page with the loading wheel, and begins automating the download
    pm.publish.addEventListener('click', (e) => {
        pm.page2.classList.remove('on');
        pm.page3.classList.add('on');

        automateDownload(exportButton);
    });

    // Alerts user that their file was downloaded and replaces the loading wheel with a file upload icon
    document.addEventListener('pm-downloaded', () => {
        pm.icons.loading.classList.remove('on');
        pm.icons.file.classList.add('on');
        pm.uploadLabel.classList.add('on');
        pm.dropText.innerHTML = 'Drag your folder here, or click to upload';
    });

    // Dragging files over the drop area changes styles to alert the user; dropping the file sends a fetch request to the backend
    pm.dropArea.addEventListener('dragenter', (e) => {
        e.preventDefault;
        pm.dropArea.classList.add('on');
    });
    pm.dropArea.addEventListener('dragover', (e) => {
        e.preventDefault;
        pm.dropArea.classList.add('on');
    });
    pm.dropArea.addEventListener('dragleave', (e) => {
        e.preventDefault;
        pm.dropArea.classList.remove('on');
    });
    pm.dropArea.addEventListener('drop', (e) => {
        e.preventDefault;
        // Sends data stored in drag-and-drop API
        sendSiteData(e.dataTransfer.files[0]);
        pm.icons.file.classList.remove('on');
        pm.icons.loading.classList.add('on');
        pm.uploadLabel.classList.remove('on');
        pm.dropArea.classList.remove('on');
        pm.dropText.innerHTML = 'Publishing your files...';
    });

    // Ads the ability to use the upload field as an input button, as an alternative to dragging and dropping
    pm.upload.addEventListener('change', (e) => {
        e.preventDefault;
        // Sends the .zip data
        sendSiteData(pm.upload.files[0]);
        pm.icons.file.classList.remove('on');
        pm.icons.loading.classList.add('on');
        pm.uploadLabel.classList.remove('on');
        pm.dropText.innerHTML = 'Publishing your files...';
    });

    // Shows checkmark icon and link to published site. Congrats!! Ya did it
    document.addEventListener('pm-complete', () => {
        pm.icons.loading.classList.remove('on');
        pm.icons.complete.classList.add('on');
        pm.dropText.classList.remove('on');
        pm.link.classList.add('on');
    });
    //////////////////////////////////////////////////DELETE/////////////////////////////////////////////////////////
    pm.page1.addEventListener('drop', (e) => {
        e.preventDefault;
        // Sends data stored in drag-and-drop API
        sendSiteData(e.dataTransfer.files[0]);
    });
    ////////////////////////////////////////////////////
}

// Method to close the UI, which is a bit more complicated than just modal.close() because of the animation
function closeModal() {
    this.modal.classList.add('close');
    setTimeout(() => {
        this.modal.classList.remove('close');
        this.modal.close();
    }, 100);
}

// Function to reset the pm to the beginning state whenever user closes modal, and whenever Webflow is reloaded
async function resetModal() {
    // Gets the stored values and inputs them into the modal settings
    const configData = await chrome.storage.local.get([
        'PROJECT',
        'DOMAIN',
        'SITE_CODE',
        'STAGING',
        'SCRIPTS',
        'LOGIN_STATE',
    ]);

    this.inputs.domain.value = configData.DOMAIN;
    this.inputs.siteCode.value = configData.SITE_CODE;
    this.inputs.scripts.value = configData.SCRIPTS.join(', ');

    if (configData.STAGING) {
        this.inputs.staging.classList.add('on');
        this.inputs.release.classList.remove('on');
    } else {
        this.inputs.staging.classList.remove('on');
        this.inputs.release.classList.add('on');
    }

    // Sets the pm back to page 1 if user is not logged in, to page 2 otherwise
    if (configData.LOGIN_STATE === false) {
        this.page1.classList.add('on');
        this.page2.classList.remove('on');
    } else {
        this.page2.classList.add('on');
        this.page1.classList.remove('on');
    }

    // Resets the icons and undoes other various pm changes
    this.page3.classList.remove('on');
    this.icons.file.classList.remove('on');
    this.icons.loading.classList.add('on');
    this.icons.complete.classList.remove('on');
    this.settings.classList.remove('on');
    this.form.classList.remove('on');
    this.link.classList.remove('on');
    this.dropText.classList.add('on');
    this.uploadLabel.classList.remove('on');
    this.dropText.innerHTML = 'Downloading your files...';
}

// Ensures the advanced options pm is configured based on the current settings
async function configureModal() {
    // This sets the link at the top of the publish modal to be whichever URL your site will be published to, determined by the config settings
    // Also sets the link that appears at the end of the upload process
    const configData = await chrome.storage.local.get([
        'PROJECT',
        'DOMAIN',
        'SITE_CODE',
        'STAGING',
        'SCRIPTS',
        'CONFIG_STATE',
        'LOGIN_STATE',
    ]);

    if (configData.CONFIG_STATE) {
        // Allow publish button to be clicked
        this.subtitle.classList.remove('on');
        this.publish.classList.add('on');
        // Enter the existing config data
        this.inputs.domain.value = configData.DOMAIN;
        this.inputs.siteCode.value = configData.SITE_CODE;
        this.inputs.scripts.value = configData.SCRIPTS.join(', ');
        if (configData.STAGING) {
            this.inputs.staging.classList.add('on');
            this.inputs.release.classList.remove('on');
            this.link.setAttribute(
                'href',
                `https:// ${configData.SITE_CODE}.greenvisionmedia.net`
            );
            this.site.setAttribute(
                'href',
                `https:// ${configData.SITE_CODE}.greenvisionmedia.net`
            );
            this.site.querySelector('span').innerHTML =
                configData.SITE_CODE + '.greenvisionmedia.net';
        } else {
            this.inputs.staging.classList.remove('on');
            this.inputs.release.classList.add('on');
            this.link.setAttribute('href', `https:// ${configData.DOMAIN}`);
            this.site.setAttribute('href', `https:// ${configData.DOMAIN}`);
            this.site.querySelector('span').innerHTML = configData.DOMAIN;
        }

        // This is some code I wrote to give nice styles to the list of scripts, reminiscent of Webflow's class adder pm
        // Pretty much useless, but makes it more obvious which scripts are going to be added and looks cool

        // Adds a new div that sits on top of the existing script input element
        const scriptRow = document.createElement('div');
        scriptRow.id = 'script-row';
        scriptRow.classList.add('pm-text');

        // Adds the scripts
        this.inputs.scripts.insertAdjacentElement('afterend', scriptRow);
        for (script of configData.SCRIPTS) {
            //Wraps each script in a span for a nice green box
            let scriptSpan = document.createElement('span');
            scriptSpan.innerHTML = script;
            scriptRow.appendChild(scriptSpan);
        }
        // Disable inputs
        Object.values(this.inputs).forEach((e) => {
            e.disabled = true;
        });
        this.save.classList.remove('on');
        this.restart.classList.add('on');
    }
}

// Write and store configuration data
function setConfigData() {
    // Reads the class on the fake radio buttons and sets a boolean accordingly
    let stagingBool = true;
    if (this.inputs.staging.classList.contains('on')) {
        stagingBool = true;
    } else {
        stagingBool = false;
    }

    const projectString = window.location.pathname.split('/')[2]; // Gets WF project name from URL
    let scriptArray = this.inputs.scripts.value.split(', '); // Gets an array of script strings from comma + space delimited list

    chrome.storage.local
        .set({
            PROJECT: projectString,
            DOMAIN: this.inputs.domain.value,
            SITE_CODE: this.inputs.siteCode.value,
            SCRIPTS: scriptArray,
            STAGING: stagingBool,
            CONFIG_STATE: true,
        })
        .then(this.configure());
}

// Sends the login data to the server and sets a loginState bool that affects resetModal()
// async function sendLoginData(u, p) {
//     let port = await chrome.runtime.connect({ name: 'login' });
//     port.postMessage({ username: u, password: p });
//     port.onMessage.addListener((m) => {
//         console.log(
//             'In content script, received message from background script: '
//         );
//         console.log(m.response);
//         if (m.response == 'pm-login') {
//             document.dispatchEvent(pmLogin);
//         }
//     });
// }

// Send .zip and config data to server
async function sendSiteData(f) {
    const configData = await chrome.storage.local.get([
        'PROJECT',
        'DOMAIN',
        'SITE_CODE',
        'STAGING',
        'SCRIPTS',
    ]);
    let port = await chrome.runtime.connect({ name: 'site' });
    port.postMessage({ file: f, config: configData });
    port.onMessage.addListener((m) => {
        console.log(
            'In content script, received message from background script: '
        );
        console.log(m.response);
        if (m.response == 'pm-complete') {
            document.dispatchEvent(pmComplete);
        }
    });
}

// Automate download process using queries and .click() to mimic the user downloading the file
// Janky, but it works! A more performant way might use mutation observers and promise chains
function automateDownload(exportButton) {
    exportButton.click();
    const parentClass =
        'div[style="display: flex; justify-content: space-between; flex: 0 1 auto;"]';

    waitFor(
        parentClass + ' button:nth-child(4)',
        (zipButton) => {
            zipButton.click();

            waitFor(
                parentClass + ' a[href^="blob:"]',
                (downloadButton) => {
                    downloadButton.click();
                    document
                        .querySelector(parentClass + ' button:nth-child(3)')
                        .click(); // Exits download modal
                    document.dispatchEvent(pmDownloaded);
                },
                10
            );
        },
        10
    );
}

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
waitFor('.bem-TopBar_Body_Group-left', injectMeter, 1000);

function injectMeter(topBar) {
    //Inject HTML for CO2 meter
    topBar.insertAdjacentHTML(
        'beforeEnd',
        '<div class="pm-meter"><div><span id="meter">X.Xg </span><span>CO<sub>2</sub></span></div></div>'
    );

    // Set up a carbon meter object with the meter and a setCarbon method
    const cm = {
        meter: g('meter'),
        setCarbon: setCarbonData,
    };

    // When using the GV publish modal, this custom event will fire. Use this to update the carbon meter
    document.addEventListener('pm-downloaded', cm.setCarbon());
}

async function setCarbonData() {
    // Get download size from background script
    const configData = await chrome.storage.local.get('DOWNLOAD_SIZE');
    let emissions = swd.perByte(configData.DOWNLOAD_SIZE);

    // Update UI
    this.meter.innerHTML = emissions.toPrecision(2) + 'g ';
}

// MAGIC CLIPBOARD /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Designed to modify the clipboard data when pasting into a Webflow embed block. Inspired by this extension: https://github.com/evanfrawley/magicpaste
 *
 * Automatically converts markdown to HTML.
 * Useful when you have many <pre> and <code> tags that don't translate well to Webflow
 * To paste into WF, write '<!--gv-markdown->' on its own line at the top of the document
 *
 * Automatically minifies SVG pasted from Illustrator.
 * Useful if you want to add global CSS properties like fill: and stroke:
 * or global SVG elements like <filter> and <gradient>
 *
 * Should be extensible if we need other clipboard modification stuff
 */

// Store the string I know will prefix all Illustrator copy-pastes,
// and inventing a string that will prefix all markdown copy-pastes
const SVGRegex = /^<\?xml version="1.0" encoding="UTF-8"\?>\s*/;
const MDRegex = /^<!--gv-markdown-->\n*/; // Using HTML comment syntax means it won't appear in the Obsidian preview mode or if converted to HTML another way

// Wait for an embed modal to appear in the dom
waitFor('.bem-EmbedEditor_Modal', injectCheckbox, 100);

// Starts clipboard modification when embed is opened, with the option to disable SVG conversion
function injectCheckbox(HTMLEmbed) {
    // Inserts a checkbox to disable SVG compression
    if (!g('svg-checkbox')) {
        // Get the parent element of the checkboxes
        const checkboxDiv = HTMLEmbed.querySelector(
            ' .bem-Modal_Body > form > div:nth-child(3) > div:first-child'
        );

        // Change a few styles on the existing checkbox wrapper div
        checkboxDiv.style.display = 'flex';
        checkboxDiv.style.gap = '2rem';

        // Inject the checkboxes and the associated markup
        checkboxDiv.insertAdjacentHTML(
            'beforeEnd',
            '<label class="pm-checkbox-label"><input id="svg-checkbox" class="pm-checkbox" type="checkbox"/>Compress SVG</label><label class="pm-checkbox-label"><input id="md-checkbox" class="pm-checkbox" type="checkbox"/>Convert MD</label>'
        );

        // Register a magic clipboard ui object with both checkboxes and a config method
        const mc = {
            SVGcheckbox: g('svg-checkbox'),
            MDcheckbox: g('md-checkbox'),
            configure: configureCheckbox,
        };

        // Toggles a checkmark, and stores a local variable so these settings are persistant
        mc.SVGcheckbox.addEventListener('click', () => {
            if (SVGcheckbox.checked) {
                chrome.storage.local.set({
                    SVG_STATE: true,
                });
            } else {
                chrome.storage.local.set({
                    SVG_STATE: false,
                });
            }
        });

        mc.MDcheckbox.addEventListener('click', () => {
            if (MDcheckbox.checked) {
                chrome.storage.local.set({
                    MD_STATE: true,
                });
            } else {
                chrome.storage.local.set({
                    MD_STATE: false,
                });
            }
        });

        // Load the correct state of the checkmark based on local config data
        mc.configure();

        // Initiate the clibpoard modifications on embed load, on clicking into the embed,
        // and on refocusing the window (helpful if the user clicks away to Illustrator then clicks back in)
        modifyClipboard();
        HTMLEmbed.addEventListener('click', modifyClipboard);
        window.addEventListener('focus', modifyClipboard);
    }

    // Start wait loop again
    waitFor('.bem-EmbedEditor_Modal', injectEmbedUI, 100);
}

async function configureCheckbox() {
    const configData = await chrome.storage.local.get([
        'SVG_STATE',
        'MD_STATE',
    ]);
    if (configData.SVG_STATE) {
        this.SVGcheckbox.checked = true;
    }
    if (configData.MD_STATE) {
        this.MDcheckbox.checked = true;
    }
}

async function modifyClipboard() {
    const text = await navigator.clipboard.readText();
    if (SVGRegex.test(text)) {
        // Checking config data to see if SVG compression is on
        await chrome.storage.local.get('SVG_STATE', async (configData) => {
            if (configData.SVG_STATE) {
                // If so, compress and load that text to the clipboard
                const convertedDoc = await textToXML(text);
                const compressedDoc = await compressSVG(convertedDoc);
                const convertedText = await XMLtoText(compressedDoc);
                navigator.clipboard.writeText(convertedText);
            }
        });
    }
    if (MDRegex.test(text)) {
        // Likewise
        await chrome.storage.local.get('MD_STATE', async (configData) => {
            if (configData.MD_STATE) {
                const convertedText = await markdown(text.replace(MDRegex, ''));
                navigator.clipboard.writeText(convertedText);
            }
        });
    }
}

// This is a severe minification, removes everything but the essential path data including colors, kerning, strokes and stroke effects
// Best for small icons or simple shapes (which are the best use-cases for inline SVG in Webflow)

async function compressSVG(doc) {
    // Compressing using DOM modification methods
    doc.querySelector('defs').remove();
    ['data-name', 'width', 'height'].forEach((a) => {
        doc.querySelector('svg').removeAttribute(a);
    });
    ['svg', 'path', 'g', 'rect', 'polygon', 'line', 'circle'].forEach((t) => {
        doc.querySelectorAll(t).forEach((e) => {
            e.removeAttribute('id');
            e.removeAttribute('class');
        });
    });
    return doc;
}

async function XMLtoText(doc) {
    const serializer = new XMLSerializer();

    let text = serializer.serializeToString(doc);
    return text.replace(/\n\s\s/, ''); // Gets rid of ugly line break where <defs> was
}

async function textToXML(text) {
    const parser = new DOMParser();

    let doc = parser.parseFromString(
        text.replace(SVGRegex, ''), // Gets rid of <?xml/> prolog
        'image/svg+xml'
    );
    return doc;
}
