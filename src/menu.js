// PUBLISH MENU /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * This speeds up the process of exporting code from Webflow and uploading it to the server.
 *
 * Rather than downloading the .zip, uncompressing it, uploading to github/udesly/netlify etc.,
 * you just hit Menu. The zip gets downloaded automatically, at which point you can drag it
 * straight back into an upload menu, all without ever leaving Webflow.
 *
 * Our backend service takes care of the rest, passing it straight to either the final release domain
 * or a staging domain, and making other changes according to the options, which are recorded by the publish
 * in this menu.
 */

// Wait for the export button to appear in the DOM
lookFor('[data-automation-id="top-bar-export-code-button"]', 1000).then(
    injectMenu,
);

function injectMenu(exportButton) {
    // Inject HTML for publish menu
    exportButton.insertAdjacentHTML('afterEnd', '{{menu.html}}');

    console.log('insert func ran');

    // Get UI elements
    const menu = get('menu'),
        menuButton = get('menu-button'),
        closeButton = get('close-button'),
        page = {
            one: get('menu-page-1'),
            two: get('menu-page-2'),
        },
        site = get('site'),
        publishButton = get('publish-button'),
        optionsButton = get('options-button'),
        optionsForm = get('options-form'),
        inputs = {
            domain: get('domain'),
            siteCode: get('site-code'),
            release: get('release'),
            staging: get('staging'),
            scripts: get('scripts'),
        },
        saveButton = get('save-button'),
        restartButton = get('restart-button'),
        dropArea = get('drop-area'),
        dropText = get('drop-text'),
        link = get('link'),
        upload = get('upload'),
        uploadLabel = get('upload-label'),
        icons = {
            file: get('file'),
            loading: get('loading'),
            complete: get('complete'),
        };

    // Function to reset the publish to the beginning state whenever user closes menu, and whenever Webflow is reloaded
    async function resetMenuState() {
        // Reset to page 1
        on(page.one);
        off(page.two);

        // Reset options menu
        off(optionsButton);
        off(optionsForm);

        const configData = await chrome.storage.local.get([
            'PROJECT',
            'DOMAIN',
            'SITE_CODE',
            'STAGING',
            'SCRIPTS',
            'LOGIN_STATE',
        ]);

        inputs.domain.value = configData.DOMAIN;
        inputs.siteCode.value = configData.SITE_CODE;
        inputs.scripts.value = configData.SCRIPTS.join(', ');

        if (configData.STAGING) {
            on(inputs.staging);
            off(inputs.release);
        } else {
            off(inputs.staging);
            on(inputs.release);
        }

        // Reset file drop elements
        off(icons.file);
        on(icons.loading);
        off(icons.complete);

        off(link);
        on(dropText);
        off(uploadLabel);
        dropText.innerHTML = 'Downloading your files...';
    }

    // Write and store configuration data
    async function storeConfigData() {
        // Reads the class on the fake radio buttons and sets a boolean accordingly
        let stagingBool = true;
        if (inputs.staging.classList.contains('on')) {
            stagingBool = true;
        } else {
            stagingBool = false;
        }

        // Get the project name from the webflow designer url
        const projectString = window.location.pathname.split('/')[2]; // Gets WF project name from URL
        let scriptArray = inputs.scripts.value.split(', '); // Gets an array of script strings from comma + space delimited list

        chrome.storage.local.set({
            projectKey: {
                PROJECT: projectString,
                DOMAIN: inputs.domain.value,
                SITE_CODE: inputs.siteCode.value,
                SCRIPTS: scriptArray,
                STAGING: stagingBool,
                CONFIG_STATE: true,
            },
        });
    }

    // Ensures the advanced options publish is configured based on the current options
    async function configureMenu() {
        // This sets the link at the top of the publish menu to be whichever URL your site will be published to, determined by the config settings
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
            // Enter the existing config data
            inputs.domain.value = configData.DOMAIN;
            inputs.siteCode.value = configData.SITE_CODE;
            inputs.scripts.value = configData.SCRIPTS.join(', ');
            if (configData.STAGING) {
                on(inputs.staging);
                off(inputs.release);
                link.setAttribute(
                    'href',
                    `https:// ${configData.SITE_CODE}.greenvisionmedia.net`,
                );
                site.setAttribute(
                    'href',
                    `https:// ${configData.SITE_CODE}.greenvisionmedia.net`,
                );
                site.querySelector('span').innerHTML =
                    configData.SITE_CODE + '.greenvisionmedia.net';
            } else {
                off(inputs.staging);
                on(inputs.release);
                link.setAttribute('href', `https://${configData.DOMAIN}`);
                site.setAttribute('href', `https://${configData.DOMAIN}`);
                site.querySelector('span').innerHTML = configData.DOMAIN;
            }

            // // This is some code I wrote to give nice styles to the list of scripts, reminiscent of Webflow's class adder publish
            // // Pretty much useless, but makes it more obvious which scripts are going to be added and looks cool

            // // Adds a new div that sits on top of the existing script input element
            // const scriptRow = document.createElement('div');
            // scriptRow.id = 'script-row';

            // // Adds the scripts
            // inputs.scripts.insertAdjacentElement('afterend', scriptRow);
            // for (script of configData.SCRIPTS) {
            //     //Wraps each script in a span for a nice green box
            //     let scriptSpan = document.createElement('span');
            //     scriptSpan.innerHTML = script;
            //     scriptRow.appendChild(scriptSpan);
            // }

            // Disable inputs
            Object.values(inputs).forEach((e) => {
                e.disabled = true;
            });
            off(saveButton);
            on(restartButton);
        }
    }

    // Send .zip and config data to server
    async function sendSiteData(file) {
        await chrome.storage.local.set({
            DATE_TIME: dateFormat(Date.now(), 'MM-dd-yyyy-hh-mm'),
        });
        const configData = await chrome.storage.local.get([
            'PROJECT',
            'DOMAIN',
            'SITE_CODE',
            'STAGING',
            'SCRIPTS',
            'FILE_SIZE',
            'DATE_TIME',
        ]);
        let configUrl = 'https://test.greenvision.media:5555/api/v1/config';
        // Append both the file and the configuration data
        fetch(configUrl, {
            method: 'POST',
            body: JSON.stringify(configData),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        });
        let siteUrl = 'https://test.greenvision.media:5555/api/v1/publish',
            siteForm = new FormData();
        //siteForm.innerHTML = '<input type="file" name="keyname"/>';
        siteForm.append('keyname', file);
        fetch(siteUrl, {
            method: 'POST',
            body: siteForm,
        });
    }

    async function automateDownload(exportButton) {
        exportButton.click();
        // Automates the normal user download process using queries and .click()
        const zipButton = await lookFor(
            '[data-automation-id="code-export-prepare-zip-button"]',
            15,
        );
        zipButton.click();
        const downloadButton = await lookFor('a[href^="blob:"]', 15);
        // Get the blob URL of the zip file the href attribute of the download button
        let downloadURL = downloadButton.href;
        // Format the date nicely
        let downloadDate = dateFormat(Date.now(), 'MM-dd-yyyy-hh-mm');
        // Exit the download modal
        document
            .querySelector('[data-automation-id="modal-close-button"]')
            .click();
        // Open a port with the background script, so that we can use the download API
        let downloadPort = chrome.runtime.connect({ name: 'download-port' });
        downloadPort.postMessage({
            url: downloadURL,
            date: downloadDate,
        });
        // Close port and dispatch custom event
        downloadPort.onMessage.addListener(() => {
            document.dispatchEvent(gvDownloaded);
            console.log('download event dispatched');
            downloadPort.disconnect();
        });
    }

    function deleteDownload() {
        let deletePort = chrome.runtime.connect({ name: 'delete-port' });
        deletePort.postMessage({ delete: true });
        deletePort.onMessage.addListener(() => {
            deletePort.disconnect();
        });
    }

    resetMenuState(); // Resets various publish state changes using stored chrome variables
    configureMenu(); // Sets the advanced options menu to the configured state

    // Open/close the menu
    menuButton.addEventListener('click', (e) => {
        e.preventDefault;
        toggle(menu);
        toggle(menuButton);
        resetMenuState();
        if (menu.classList.contains('on')) {
            addExitListeners(menuButton, menu);
        }
    });

    closeButton.addEventListener('click', (e) => {
        e.preventDefault;
        off(menu);
        off(menuButton);
    });

    // Toggle advanced options
    optionsButton.addEventListener('click', (e) => {
        e.preventDefault;
        toggle(optionsButton);
        toggle(optionsForm);
    });

    // These two buttons basically make up a 'radio button', only one should be on.
    inputs.staging.addEventListener('click', (e) => {
        e.preventDefault;
        off(inputs.release);
        on(inputs.staging);
    });

    inputs.release.addEventListener('click', (e) => {
        e.preventDefault;
        on(inputs.release);
        off(inputs.staging);
    });

    // Hitting save turns pointerevents off on the form inputs, shows a new 'restart' button where save was
    saveButton.addEventListener('click', async (e) => {
        e.preventDefault;
        Object.values(inputs).forEach((e) => {
            e.disabled = true;
        });

        off(saveButton);
        on(restartButton);

        off(publishButton);

        await storeConfigData(); //Updates configuration data in chrome storage/GUI
        configureMenu();
    });

    // Hitting restart undoes the previous changes and allows access to the form again
    restartButton.addEventListener('click', (e) => {
        e.preventDefault;
        Object.values(inputs).forEach((e) => {
            e.disabled = false;
        });

        on(saveButton);
        off(restartButton);

        // get('script-row').remove(); // Removes the fancy script publish
    });

    // By default the restart button shows 'Configured'; hovering over the restart button shows the text 'Restart'
    restartButton.addEventListener('mouseenter', (e) => {
        e.preventDefault;
        restartButton.innerHTML = 'Restart';
    });
    restartButton.addEventListener('mouseleave', (e) => {
        e.preventDefault;
        restartButton.innerHTML = 'Configured';
    });

    // Hitting publish shows the drag and drop page with the loading wheel, and begins automating the download
    publishButton.addEventListener('click', (e) => {
        off(page.one);
        on(page.two);

        downloadId = automateDownload(exportButton);
    });

    // Alerts user that their file was downloaded and replaces the loading wheel with a file upload icon
    document.addEventListener('gv-downloaded', () => {
        off(icons.loading);
        on(icons.file);
        on(uploadLabel);

        dropText.innerHTML = 'Drag your folder here, or click to upload';
    });

    // Dragging files over the drop area changes styles to alert the user; dropping the file sends a fetch request to the backend
    dropArea.addEventListener('dragenter', (e) => {
        e.preventDefault;
        on(dropArea);
    });
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault;
        on(dropArea);
    });
    dropArea.addEventListener('dragleave', (e) => {
        e.preventDefault;
        off(dropArea);
    });
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault;
        // Sends data stored in drag-and-drop API
        sendSiteData(e.dataTransfer.files[0]);

        off(icons.file);
        on(icons.loading);
        off(uploadLabel);
        off(dropArea);

        dropText.innerHTML = 'Publishing your files...';
    });

    // Ads the ability to use the upload field as an input button, as an alternative to dragging and dropping
    upload.addEventListener('change', (e) => {
        e.preventDefault;
        // Sends the .zip data
        sendSiteData(upload.files[0]);

        off(icons.file);
        on(icons.loading);
        off(uploadLabel);

        dropText.innerHTML = 'Publishing your files...';
    });

    // Shows checkmark icon and link to published site. Congrats!! Ya did it
    document.addEventListener('gv-complete', () => {
        off(icons.loading);
        on(icons.complete);
        off(dropText);
        on(link);
        deleteDownload();
    });
}
