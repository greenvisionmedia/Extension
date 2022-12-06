// PUSHERMAN

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// PUBLISH MODAL

// Query shorthand
const g = (i) => document.getElementById(i);

// Register custom events for when the site .zip file is downloaded, when a user successfully logs in, and for when the file is successfully HTTP'd
const pmDownloaded = new Event('pm-downloaded');
const pmLogin = new Event('pm-login');
const pmComplete = new Event('pm-complete');

// Wait for DOM elements to appear, avoids querying bits of the WF designer that don't exist yet
function waitFor(waitClass, callback, interval) {
    let wait = setInterval(() => {
        let waitNode = document.querySelector(waitClass);
        if (waitNode) {
            clearInterval(wait);
            callback(waitNode);
        }
    }, interval);
}

// Wait for the export button to appear to know the designer DOM is ready for injection
waitFor('.bem-TopBar_Body_ExportButton', injectModal, 1000);

// Add all the markup for the modal
function injectModal(exportButton) {
    // Inject HTML for modal button
    exportButton.insertAdjacentHTML(
        'beforeBegin',
        '<div id="modal-button"><svg aria-hidden="true" focusable="false" width="17" height="17" viewBox="0 0 17 19"><path d="M12.6,19.2c-4.1-2.2-7.7-5.2-11.1-8.3,0,0-1.5-1.4-1.5-1.4C3.1,6.2,6.3,3,9.7,0c2.6,2.8,5.2,5.9,7.4,9.1-2,1.5-4,2.9-6.3,4,1-1.9,2.2-3.6,3.4-5.3v1.9c-2.2-1.6-4.3-3.5-6.3-5.3,0,0,3,0,3,0-2.1,2.2-4.3,4.3-6.5,6.4v-3c3.1,3.5,6,7.1,8.1,11.3h0Z"></path></svg></div>'
    );

    // Inject the HTML for the modal
    pm = document.createElement('dialog');
    pm.id = 'pm';
    pm.innerHTML = '{{modal.html}}'; // This string gets replaced during gulp build
    document.body.appendChild(pm);

    const UI = {
        modal: pm,
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

    resetUI(UI); // Resets various UI state changes
    configureUI(UI); // Sets the advanced options menu to the configured state

    // Toggle modal
    UI.modalButton.addEventListener('click', (e) => {
        e.preventDefault;
        UI.modal.showModal();
    });

    // Close the modal
    UI.exit.addEventListener('click', (e) => {
        e.preventDefault;
        UI.modal.classList.add('close');
        setTimeout(() => {
            // This is to get the closing animation to work, the timeout is the same as the animate-duration
            UI.modal.classList.remove('close');
            UI.modal.close();

            resetUI(UI);
        }, 100);
    });

    UI.login.addEventListener('click', (e) => {
        e.preventDefault;
        sendLogin(UI);
    });

    document.addEventListener('pm-login', (e) => {
        UI.page1.classList.remove('on');
        UI.page2.classList.add('on');
    });

    // This is identical to the exit listener
    UI.cancel.addEventListener('click', (e) => {
        UI.modal.classList.add('close');
        setTimeout(() => {
            UI.modal.classList.remove('close');
            UI.modal.close();

            resetUI(UI);
        }, 100);
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
        //Updates configuration data in chrome storage/GUI
        setConfigData(UI);
    });

    // Hitting restart allows access to the form again
    UI.restart.addEventListener('mouseenter', (e) => {
        e.preventDefault;
        UI.restart.innerHTML = 'Restart';
    });
    UI.restart.addEventListener('mouseleave', (e) => {
        e.preventDefault;
        UI.restart.innerHTML = 'Configured';
    });
    UI.restart.addEventListener('click', (e) => {
        // Undoes the save button
        e.preventDefault;
        Object.values(UI.inputs).forEach((e) => {
            e.disabled = false;
        });
        UI.save.classList.add('on');
        UI.restart.classList.remove('on');

        g('script-row').remove(); // Removes the fancy script UI
    });

    // Hitting publish shows the drag and drop page and begins automating the download
    UI.publish.addEventListener('click', (e) => {
        UI.page2.classList.remove('on');
        UI.page3.classList.add('on');

        automateDownload(exportButton);
    });

    // Shows file icon, alerts user that their file was downloaded
    document.addEventListener('pm-downloaded', () => {
        UI.icons.loading.classList.remove('on');
        UI.icons.file.classList.add('on');
        UI.uploadLabel.classList.add('on');
        UI.dropText.innerHTML = 'Drag your folder here, or click to upload';
    });

    // Draggging files over the drop area adds a css class; dropping sends an XHR
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

        let f = e.dataTransfer; // ** I need to make absolutely sure that this.....
        sendData(f);
    });

    // An input button as an alternative to dragging and dropping (nice if you accidentally close the download bar or something)
    UI.upload.addEventListener('change', (e) => {
        e.preventDefault;
        UI.icons.file.classList.remove('on');
        UI.icons.loading.classList.add('on');
        UI.uploadLabel.classList.remove('on');
        UI.dropText.innerHTML = 'Publishing your files...';

        let f = this.files; // ** ....Is the same as this
        sendData(f);
    });

    // Shows checkmark icon and link to published site. Congrats!!
    document.addEventListener('pm-complete', () => {
        UI.icons.loading.classList.remove('on');
        UI.icons.complete.classList.add('on');
        UI.dropText.classList.remove('on');
        UI.link.classList.add('on');
    });
}

// Function to reset the UI to the beginning state whenever user closes modal, and whenever webflow is reloaded
function resetUI(UI) {
    // Gets the stored values and inputs them into the modal settings
    chrome.storage.local.get(
        ['PROJECT', 'DOMAIN', 'SITE_CODE', 'STAGING', 'SCRIPTS', 'LOGIN_STATE'],
        (configData) => {
            UI.inputs.domain.value = configData.DOMAIN;
            UI.inputs.siteCode.value = configData.SITECODE;
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
function configureUI(UI) {
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
                        configData.SITECODE + '.greenvisionmedia.net';
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
                // Pretty much useless, but makes it more obvious which scripts are going to be added and looks cool
                // Adds a new div that mimics the script input element
                let scriptRow = document.createElement('div');
                scriptRow.id = 'script-row';
                scriptRow.classList.add('pm-text');
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
    let stagingBool = true;
    if (UI.inputs.staging.classList.contains('on')) {
        stagingBool = true;
    } else {
        stagingBool = false;
    }

    const projectString = window.location.pathname.split('/')[2]; // gets WF project name from URL
    let scriptArray = UI.inputs.scripts.value.split(', '); // Gets an array of script strings from comma+space delimited list

    chrome.storage.local
        .set({
            PROJECT: projectString,
            DOMAIN: UI.inputs.domain.value,
            SITECODE: UI.inputs.siteCode.value,
            SCRIPTS: scriptArray,
            STAGING: stagingBool,
            CONFIGSTATE: true,
        })
        .then(configureUI(UI));
}

// Sends the login data to the server and sets a loginState bool that affects resetUI()
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

// Automate download process
// /Janky but works!
function automateDownload(exportButton) {
    exportButton.click();
    let parentClass =
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
 * This gives an estimate of the CO2 that will be emitted by the website,
 * were you to upload the code straight from WebFlow with no optimization
 */

waitFor('.bem-TopBar_Body_Group-left', injectMeter, 1000);

function injectMeter(topBar) {
    //Inject HTML for CO2 meter
    topBar.insertAdjacentHTML(
        'beforeEnd',
        '<div class="pm-meter"><div><span id="meter">Xg </span><span>CO<sub>2</sub></span></div></div>'
    );

    // Get meter CO2 <span>
    let meter = g('meter');

    // Setup CO2.js object with the sustainable web design model (SWD)
    const swd = new co2();

    // When using the GV publish modal, update the carbon meter
    document.addEventListener('pm-complete', () => {
        let downloadSize = chrome.storage.local.get('DOWNLOAD_SIZE');
        meter.innerHTML = swd.perByte(downloadSize);
    });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// MAGIC CLIPBOARD

// Clipboard datatypes
const TYPE_HTML = 'text/html';
const TYPE_PLAIN = 'text/plain';

/**
 * Designed to replace the clipboard data when pasting from Illustrator with a minified version
 * This is aggressive minification - removes most attributes, <defs> tag, and all classes and ids
 * This also aint real minification - doesn't remove line breaks or do any rounding, just removes clutter
 *
 * I copied this code structure from this extension: https://github.com/evanfrawley/magicpaste,
 * and adapted it to minify SVG instead of convert markdown -> rich text.
 */

// Store the string I know will prefix all illustrator copypastes
const svgRegex = /^<\?xml version="1.0" encoding="UTF-8"\?>\s*/;

//Wait for an embed modal to appear in the dom
waitFor('.w-codemirror', getEmbedInput, 1000);

//Start paste process when user focuses the embed modal
function getEmbedInput(embedInput) {
    embedInput.addEventListener('click', pasteSVG);
    embedInput.addEventListener('copy', pasteSVG);
    embedInput.addEventListener('focus', pasteSVG);
    waitFor('.w-codemirror', getEmbedInput, 1000);
}

// Using regex to remove parts of the text
async function minifySVG(text) {
    let minifiedText = text
        .replace(svgRegex, '') // Gets rid of XML prolog
        .replace(/(?:<defs>(?:[\s\S]*)<\/defs>\n)/, '') // Gets rid of the entire <defs> tag
        .replace(/(?:id="(?:.+)"\s)/g, '') // Gets rid of unwanted attributes in the <svg>
        .replace(/(?:class="(?:.+)"\s)/g, '');

    return minifiedText;
}

async function pasteSVG() {
    const text = await navigator.clipboard.readText();
    if (svgRegex.test(text)) {
        const minifiedText = await minifySVG(text);
        await navigator.clipboard.writeText(minifiedText);
    }
}

/**
 * This is almost identical to the code for Evan Frawley's magicpaste extension
 * Allows you to paste markdown straight into the Webflow CMS rich text entry field
 *
 * I changed it to use the reusable waitFor function, and changed the regex key phrase to '@markdown'
 */

const markdownRegex = /^@markdown\s*/;
const markdownStringNoNewLine = '@markdown';

waitFor('.bem-RichTextInput', getRichTextInput, 1000);

function getRichTextInput(richTextInput) {
    const infoContainerContainer =
        richTextInput.parentElement.querySelector('div.bem-Field_Head');
    if (!infoContainerContainer) return;
    const infoContainer = infoContainerContainer.querySelector('div.bem-View');
    if (!infoContainer) return;
    infoContainer.classList.add('mp-container');
    richTextInput.addEventListener('click', pasteMarkdown);
    richTextInput.addEventListener('copy', pasteMarkdown);
    richTextInput.addEventListener('focus', pasteMarkdown);
    const info = document.createElement('div');
    info.innerHTML =
        'When pasting Markdown, make sure the contents start with <span class="mp-chip">@markdown</span> on its own line. <a class="mp-link" href="https://greenvision.media/docs/build-process/" target="_blank">Learn More</a>';
    info.classList.add('mp-info');
    infoContainer.appendChild(info);
}

async function formatMarkdownToHTML(text) {
    const markdownContents = text
        .replace(/\u00A0\//g, ' ')
        .replace(markdownRegex, '');
    const formattedText = markdown(markdownContents);

    return formattedText;
}

async function HTMLtoClipboard(str) {
    const newBlob = new Blob([str], { type: TYPE_HTML });
    const data = [new ClipboardItem({ [TYPE_HTML]: newBlob })];
    await navigator.clipboard.write(data);
}

async function pasteMarkdown() {
    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
            const blob = await clipboardItem.getType(type);
            const text = await blob.text();

            if (type === TYPE_PLAIN && markdownRegex.test(text)) {
                const htmlString = await formatMarkdownToHTML(text);
                await HTMLtoClipboard(htmlString);
            } else if (type === TYPE_HTML) {
                const parser = new DOMParser();
                const htmlDoc = parser.parseFromString(text, TYPE_HTML);
                const body = htmlDoc.querySelector('body');

                if (!body.textContent.startsWith(markdownStringNoNewLine))
                    return;

                let items = [];
                if (body.children.length >= 2) {
                    items = Array.from(body.children);
                } else if (
                    body.children.length === 1 &&
                    body.children[0].tagName.toLowerCase() === 'div' &&
                    body.children[0].children.length >= 2
                ) {
                    items = Array.from(body.children[0].children);
                } else {
                    return;
                }

                items = items
                    .filter((item) => item.tagName.toLowerCase() !== 'meta')
                    .slice(1); // get rid of the markdown

                const formattedHTMLStrings = [];
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    let str;
                    const name = item.tagName.toLowerCase();
                    if (name === 'p' || name === 'div') {
                        str = await formatMarkdownToHTML(item.textContent);
                    } else {
                        str = item.outerHTML;
                    }
                    formattedHTMLStrings.push(str);
                }

                if (formattedHTMLStrings.length === 0) return;

                await HTMLtoClipboard(formattedHTMLStrings.join('\n'));
            }
        }
    }
}
