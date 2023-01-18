// GREENVISION EXTENSION

/**
 * A chrome extension that adds functionality to the Webflow designer,
 * built and maintained by the Greenvision team.
 *
 * Aims to streamlines the process of creating no-code websites
 * according to sustainable web design (SWD) principles.
 *
 * Makes it easier and more viable to host Webflow sites on green servers,
 * to use lightweight SVG graphics and markup on Webflow sites,
 * and to monitor the carbon footprint of the website you're designing.
 *
 * Read more: https://greenvision.media/docs/extension
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// PUBLISH MODAL (PUSHERMAN)

/**
 * This speeds up the process of exporting code from Webflow and uploading it to the server.
 *
 * Rather than downloading the .zip, uncompressing it, uploading to github/udesly/netlify etc.,
 * you just hit publish. The zip gets downloaded automatically, at which point you can drag it
 * straight back into an upload modal, all without ever leaving Webflow.
 *
 * Our backend service takes care of the rest, passing it straight to either the final release domain
 * or a staging domain, and making other changes according to the settings which are recorded by the UI
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
    modal = document.createElement('dialog');
    modal.id = 'modal';
    modal.innerHTML = '{{modal.html}}'; // This string gets replaced during gulp build by ./modal.html
    modal.closeModal = closeModal; // Custom modal close method, see below
    document.body.appendChild(modal);

    // Loading the interactive parts of the UI as an object that can get passed into various other functions
    const UI = {
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
    };

    resetModal(UI); // Resets various UI state changes using stored chrome variables
    configureModal(UI); // Sets the advanced options menu to the configured state

    // Toggle modal
    UI.modalButton.addEventListener('click', (e) => {
        e.preventDefault;
        modal.showModal();
    });

    // Close the modal
    UI.exit.addEventListener('click', (e) => {
        e.preventDefault;
        modal.closeModal();
        resetModal(UI);
    });

    UI.cancel.addEventListener('click', (e) => {
        e.preventDefault;
        modal.closeModal();
        resetModal(UI);
    });

    document.addEventListener('keyup', (e) => {
        e.preventDefault;
        if (e.key === 'Escape') {
            modal.closeModal();
            resetModal(UI);
        }
    });

    // Handle login
    UI.login.addEventListener('click', (e) => {
        e.preventDefault;
        sendLogin(UI);
    });

    document.addEventListener('pm-login', (e) => {
        UI.page1.classList.remove('on');
        UI.page2.classList.add('on');
    });

    // Toggle advanced options
    UI.settings.addEventListener('click', (e) => {
        e.preventDefault;
        UI.settings.classList.toggle('on');
        UI.form.classList.toggle('on');
    });

    // These two buttons basically make up a 'radio button', only one should be on. I'll use which element has the "on" class to determine which is pressed.
    UI.inputs.staging.addEventListener('click', (e) => {
        e.preventDefault;
        UI.inputs.release.classList.remove('on');
        UI.inputs.staging.classList.add('on');
    });

    UI.inputs.release.addEventListener('click', (e) => {
        e.preventDefault;
        UI.inputs.release.classList.add('on');
        UI.inputs.staging.classList.remove('on');
    });

    // Hitting save turns pointerevents off on the form inputs, shows a new 'restart' button where save was
    UI.save.addEventListener('click', (e) => {
        e.preventDefault;
        Object.values(UI.inputs).forEach((e) => {
            e.disabled = true;
        });
        UI.save.classList.remove('on');
        UI.restart.classList.add('on');

        setConfigData(UI); //Updates configuration data in chrome storage/GUI
    });

    // Hitting restart undoes the previous changes and allows access to the form again
    UI.restart.addEventListener('click', (e) => {
        e.preventDefault;
        Object.values(UI.inputs).forEach((e) => {
            e.disabled = false;
        });
        UI.save.classList.add('on');
        UI.restart.classList.remove('on');

        g('script-row').remove(); // Removes the fancy script UI
    });

    // By default the restart button shows 'Configured'; hovering over the restart button shows the text 'Restart'
    UI.restart.addEventListener('mouseenter', (e) => {
        e.preventDefault;
        UI.restart.innerHTML = 'Restart';
    });
    UI.restart.addEventListener('mouseleave', (e) => {
        e.preventDefault;
        UI.restart.innerHTML = 'Configured';
    });

    // Hitting publish shows the drag and drop page with the loading wheel, and begins automating the download
    UI.publish.addEventListener('click', (e) => {
        UI.page2.classList.remove('on');
        UI.page3.classList.add('on');

        automateDownload(exportButton);
    });

    // Alerts user that their file was downloaded and replaces the loading wheel with a file upload icon
    document.addEventListener('pm-downloaded', () => {
        UI.icons.loading.classList.remove('on');
        UI.icons.file.classList.add('on');
        UI.uploadLabel.classList.add('on');
        UI.dropText.innerHTML = 'Drag your folder here, or click to upload';
    });

    // Dragging files over the drop area changes styles to alert the user; dropping the file sends a fetch request to the backend
    UI.dropArea.addEventListener('dragenter', (e) => {
        e.preventDefault;
        UI.dropArea.classList.add('on');
    });
    UI.dropArea.addEventListener('dragover', (e) => {
        e.preventDefault;
        UI.dropArea.classList.add('on');
    });
    UI.dropArea.addEventListener('dragleave', (e) => {
        e.preventDefault;
        UI.dropArea.classList.remove('on');
    });
    UI.dropArea.addEventListener('drop', (e) => {
        e.preventDefault;
        UI.icons.file.classList.remove('on');
        UI.icons.loading.classList.add('on');
        UI.uploadLabel.classList.remove('on');
        UI.dropArea.classList.remove('on');
        UI.dropText.innerHTML = 'Publishing your files...';

        sendData(e.dataTransfer);
    });

    // Ads the ability to use the upload field as an input button, as an alternative to dragging and dropping
    UI.upload.addEventListener('change', (e) => {
        e.preventDefault;
        UI.icons.file.classList.remove('on');
        UI.icons.loading.classList.add('on');
        UI.uploadLabel.classList.remove('on');
        UI.dropText.innerHTML = 'Publishing your files...';

        sendData(this.files);
    });

    // Shows checkmark icon and link to published site. Congrats!! Ya did it
    document.addEventListener('pm-complete', () => {
        UI.icons.loading.classList.remove('on');
        UI.icons.complete.classList.add('on');
        UI.dropText.classList.remove('on');
        UI.link.classList.add('on');
    });
}

// Method to close the UI, which is a bit more complicated than just modal.close() because of the animation
function closeModal() {
    this.classList.add('close');
    setTimeout(() => {
        this.classList.remove('close');
        this.close();
    }, 100);
}

// Function to reset the UI to the beginning state whenever user closes modal, and whenever Webflow is reloaded
function resetModal(UI) {
    // Gets the stored values and inputs them into the modal settings
    chrome.storage.local.get(
        ['PROJECT', 'DOMAIN', 'SITE_CODE', 'STAGING', 'SCRIPTS', 'LOGIN_STATE'],
        (configData) => {
            UI.inputs.domain.value = configData.DOMAIN;
            UI.inputs.siteCode.value = configData.SITE_CODE;
            UI.inputs.scripts.value = configData.SCRIPTS.join(', ');

            if (configData.STAGING) {
                UI.inputs.staging.classList.add('on');
                UI.inputs.release.classList.remove('on');
            } else {
                UI.inputs.staging.classList.remove('on');
                UI.inputs.release.classList.add('on');
            }
            // Sets the UI back to page 1 if user is not logged in, to page 2 otherwise
            if (configData.LOGIN_STATE === false) {
                UI.page1.classList.add('on');
                UI.page2.classList.remove('on');
            } else {
                UI.page2.classList.add('on');
                UI.page1.classList.remove('on');
            }
            UI.page3.classList.remove('on');
        }
    );
    // Resets the icons and undoes other various UI changes
    UI.icons.file.classList.remove('on');
    UI.icons.loading.classList.add('on');
    UI.icons.complete.classList.remove('on');
    UI.settings.classList.remove('on');
    UI.form.classList.remove('on');
    UI.link.classList.remove('on');
    UI.dropText.classList.add('on');
    UI.uploadLabel.classList.remove('on');
    UI.dropText.innerHTML = 'Downloading your files...';
}

// Ensures the advanced options UI is configured based on the current settings
function configureModal(UI) {
    // This sets the link at the top of the publish modal to be whichever URL your site will be published to, determined by the config settings
    // Also sets the link that appears at the end of the upload process
    chrome.storage.local.get(
        [
            'PROJECT',
            'DOMAIN',
            'SITE_CODE',
            'STAGING',
            'SCRIPTS',
            'CONFIG_STATE',
        ],
        (configData) => {
            if (configData.CONFIG_STATE) {
                UI.inputs.domain.value = configData.DOMAIN;
                UI.inputs.siteCode.value = configData.SITE_CODE;
                UI.inputs.scripts.value = configData.SCRIPTS.join(', ');
                if (configData.STAGING) {
                    UI.inputs.staging.classList.add('on');
                    UI.inputs.release.classList.remove('on');
                    UI.link.setAttribute(
                        'href',
                        `https:// ${configData.SITE_CODE}.greenvisionmedia.net`
                    );
                    UI.site.setAttribute(
                        'href',
                        `https:// ${configData.SITE_CODE}.greenvisionmedia.net`
                    );
                    UI.site.querySelector('span').innerHTML =
                        configData.SITE_CODE + '.greenvisionmedia.net';
                } else {
                    UI.inputs.staging.classList.remove('on');
                    UI.inputs.release.classList.add('on');
                    UI.link.setAttribute(
                        'href',
                        `https:// ${configData.DOMAIN}`
                    );
                    UI.site.setAttribute(
                        'href',
                        `https:// ${configData.DOMAIN}`
                    );
                    UI.site.querySelector('span').innerHTML = configData.DOMAIN;
                }

                // This is some code I wrote to give nice styles to the list of scripts, reminiscent of Webflow's class adder UI
                // Pretty much useless, but makes it more obvious which scripts are going to be added and looks cool

                // Adds a new div that sits on top of the existing script input element
                const scriptRow = document.createElement('div');
                scriptRow.id = 'script-row';
                scriptRow.classList.add('pm-text');

                // Adds the scripts
                UI.inputs.scripts.insertAdjacentElement('afterend', scriptRow);
                for (script of configData.SCRIPTS) {
                    //Wraps each script in a span for a nice green box
                    let scriptSpan = document.createElement('span');
                    scriptSpan.innerHTML = script;
                    scriptRow.appendChild(scriptSpan);
                }
                // Disable inputs
                Object.values(UI.inputs).forEach((e) => {
                    e.disabled = true;
                });
                UI.save.classList.remove('on');
                UI.restart.classList.add('on');
            }
        }
    );
}

// Write and store configuration data
function setConfigData(UI) {
    // Reads the class on the fake radio buttons and sets a boolean accordingly
    let stagingBool = true;
    if (UI.inputs.staging.classList.contains('on')) {
        stagingBool = true;
    } else {
        stagingBool = false;
    }

    const projectString = window.location.pathname.split('/')[2]; // Gets WF project name from URL
    let scriptArray = UI.inputs.scripts.value.split(', '); // Gets an array of script strings from comma + space delimited list

    chrome.storage.local
        .set({
            PROJECT: projectString,
            DOMAIN: UI.inputs.domain.value,
            SITE_CODE: UI.inputs.siteCode.value,
            SCRIPTS: scriptArray,
            STAGING: stagingBool,
            CONFIG_STATE: true,
        })
        .then(configureModal(UI));
}

// Sends the login data to the server and sets a loginState bool that affects resetModal()
function sendLogin(UI) {
    const url = '';
    let loginData = {
        username: UI.username.value,
        password: UI.password.value,
    };
    if (loginData.username && loginData.password) {
        fetch(url, {
            method: 'POST',
            body: loginData,
        })
            .then(() => {
                chrome.storage.local.set({ LOGIN_STATE: true });
                document.dispatchEvent(pmLogin);
            }) // pmLogin should be updated when login succeeds, not just when data gets sent successfully
            .catch((e) => {
                console.log(e);
            });
    } else {
        alert('Enter a username and password');
    }
}

// Send .zip and config data to server
function sendData(file) {
    const url = '';
    let formData = new FormData();

    chrome.storage.local.get(
        ['PROJECT', 'DOMAIN', 'SITE_CODE', 'STAGING', 'SCRIPTS'],
        (configData) => {
            formData.append('file', file);
            formData.append('config-data', configData);
            fetch(url, {
                method: 'POST',
                body: formData,
            })
                .then(() => {
                    document.dispatchEvent(pmComplete);
                }) // pmComplete should only actually be fired when the entire PM process finishes, not just when data gets sent successfully
                .catch((e) => {
                    console.log(e);
                });
        }
    );
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
                    document.dispatchEvent(pmDownloaded);
                    document
                        .querySelector(parentClass + ' button:nth-child(3)')
                        .click(); // Exits download modal
                },
                10
            );
        },
        10
    );
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// CARBON METER

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

    // Get the <span> where the CO2 value will go
    const meter = g('meter');

    // When using the GV publish modal, update the carbon meter
    document.addEventListener('pm-downloaded', () => {
        chrome.storage.local.get('DOWNLOAD_SIZE', (configData) => {
            // Get carbon from download size
            let emissions = swd.perByte(configData.DOWNLOAD_SIZE);

            // Update UI
            meter.innerHTML = emissions.toPrecision(2) + 'g ';
        });
    });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// MAGIC CLIPBOARD

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
waitFor('.bem-EmbedEditor_Modal', injectEmbedUI, 100);

// Starts clipboard modification when embed is opened, with the option to disable SVG conversion
function injectEmbedUI(HTMLEmbed) {
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

        const SVGcheckbox = g('svg-checkbox');
        const MDcheckbox = g('md-checkbox');

        // Toggles a checkmark, and stores a local variable so these settings are persistant
        SVGcheckbox.addEventListener('click', () => {
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

        MDcheckbox.addEventListener('click', () => {
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
        chrome.storage.local.get(['SVG_STATE', 'MD_STATE'], (configData) => {
            if (configData.SVG_STATE) {
                SVGcheckbox.checked = true;
            }
            if (configData.MD_STATE) {
                MDcheckbox.checked = true;
            }
        });

        // Initiate the clibpoard modifications on embed load, on clicking into the embed,
        // and on refocusing the window (helpful if the user clicks away to Illustrator then clicks back in)
        modifyClipboard();
        HTMLEmbed.addEventListener('click', modifyClipboard);
        window.addEventListener('focus', modifyClipboard);
    }

    // Start wait loop again
    waitFor('.bem-EmbedEditor_Modal', injectEmbedUI, 100);
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
    return text.replace(/\n\s\s/,''); // Gets rid of ugly line break where <defs> was
}

async function textToXML(text) {
    const parser = new DOMParser();

    let doc = parser.parseFromString(
        text.replace(SVGRegex, ''), // Gets rid of <?xml/> prolog
        'image/svg+xml'
    );
    return doc;
}
