// // PUSHERMAN CONTENT SCRIPT
// I try to use vanilla js because it's universally understood, less liable to break than a framework, cleaner/more efficient than a framework/library

// Query shorthands
const g = (i) => document.getElementById(i);

// Register custom events for when the site .zip file is downloaded, when a user successfully logs in, and for when the file is successfully HTTP'd
const pmDownloaded = new Event('pm-downloaded');
const pmLogin = new Event('pm-login');
const pmComplete = new Event('pm-complete');

// Wait for the export button to appear to know the designer DOM is ready for injection
waitFor('.bem-TopBar_Body_ExportButton', injectModal);

// // PUSHERMAN CONFIG MODAL
function injectModal(exportButton) {
    // Inject HTML for modal button
    exportButton.insertAdjacentHTML(
        'beforeBegin',
        '<div id="modal-button"><svg aria-hidden="true" focusable="false" width="17" height="17" viewBox="0 0 17 19"><path d="M12.6,19.2c-4.1-2.2-7.7-5.2-11.1-8.3,0,0-1.5-1.4-1.5-1.4C3.1,6.2,6.3,3,9.7,0c2.6,2.8,5.2,5.9,7.4,9.1-2,1.5-4,2.9-6.3,4,1-1.9,2.2-3.6,3.4-5.3v1.9c-2.2-1.6-4.3-3.5-6.3-5.3,0,0,3,0,3,0-2.1,2.2-4.3,4.3-6.5,6.4v-3c3.1,3.5,6,7.1,8.1,11.3h0Z"></path></svg></div>'
    );

    // Inject the HTML for the modal
    pm = document.createElement('dialog');
    pm.classList.add('gv-pusherman');
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

// Wait for DOM elements to appear, avoids querying bits of the WF designer that don't exist yet
function waitFor(waitClass, callback) {
    let interval = setInterval(() => {
        let waitNode = document.querySelector(waitClass);
        if (waitNode) {
            clearInterval(interval);
            callback(waitNode);
        }
    }, 10);
}

// Function to reset the UI to the beginning state whenever user closes modal, and whenever webflow is reloaded
function resetUI(UI) {
    chrome.storage.local.get(
        ['PROJECT', 'DOMAIN', 'SITECODE', 'STAGING', 'SCRIPTS', 'LOGINSTATE'],
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
            if (configData.LOGINSTATE === false) {
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
        ['PROJECT', 'DOMAIN', 'SITECODE', 'STAGING', 'SCRIPTS', 'CONFIGSTATE'],
        (configData) => {
            if (configData.CONFIGSTATE) {
                UI.inputs.domain.value = configData.DOMAIN;
                UI.inputs.siteCode.value = configData.SITECODE;
                UI.inputs.scripts.value = configData.SCRIPTS.join(', ');
                if (configData.STAGING) {
                    UI.inputs.staging.classList.add('on');
                    UI.inputs.release.classList.remove('on');
                    UI.link.setAttribute(
                        'href',
                        `https:// ${configData.SITECODE}.greenvisionmedia.net`
                    );
                    UI.site.setAttribute(
                        'href',
                        `https:// ${configData.SITECODE}.greenvisionmedia.net`
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
                scriptRow.classList.add('gv-text');
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

    let projectString = window.location.pathname.split('/')[2]; // gets WF project name from URL
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
    let url = 'https:// pusherman.free.beeceptor.com';
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
                chrome.storage.local.set({ LOGINSTATE: true });
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
    let url = 'https:// pusherman.free.beeceptor.com';
    let formData = new FormData();

    chrome.storage.local.get(
        ['PROJECT', 'DOMAIN', 'SITECODE', 'STAGING', 'SCRIPTS'],
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

    waitFor(parentClass + ' button:nth-child(4)', (zipButton) => {
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
    });
}
