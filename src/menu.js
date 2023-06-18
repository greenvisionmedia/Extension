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
    injectMenu
);

function injectMenu(exportButton) {
    // Inject HTML for publish menu
    exportButton.insertAdjacentHTML('afterEnd', '{{menu.html}}');

    // Setup a publish menu object with all UI elements and methods for closing, configuring data and reseting
    const Menu = {
        this: get('menu'),
        button: get('menu-button'),
        close: get('close'),
        page: {
            one: get('menu-page-1'),
            two: get('menu-page-2'),
        },
        publishButton: get('publish'),
        subtitle: get('subtitle'),
        options: get('options'),
        form: get('form'),
        save: get('save'),
        restart: get('restart'),
        site: get('site'),
        inputs: {
            domain: get('domain'),
            siteCode: get('site-code'),
            release: get('release'),
            staging: get('staging'),
            scripts: get('scripts'),
        },
        dropArea: get('drop-area'),
        dropText: get('drop-text'),
        link: get('link'),
        upload: get('upload'),
        uploadLabel: get('upload-label'),
        icons: {
            file: get('file'),
            loading: get('loading'),
            complete: get('complete'),
        },
        reset,
        configure,
        setConfig,
    };

    Menu.reset(); // Resets various publish state changes using stored chrome variables
    Menu.configure(); // Sets the advanced options menu to the configured state

    // Open the menu
    Menu.button.addEventListener('click', (e) => {
        e.preventDefault;
        on(Menu.this);
    });

    // Close the menu
    Menu.close.addEventListener('click', (e) => {
        e.preventDefault;
        off(Menu.this);
        Menu.reset();
    });

    document.addEventListener('keyup', (e) => {
        e.preventDefault;
        if (e.key === 'Escape') {
            off(Menu.this);
            Menu.reset();
        }
    });

    // Toggle advanced options
    Menu.options.addEventListener('click', (e) => {
        e.preventDefault;
        toggle(Menu.options);
        toggle(Menu.form);
    });

    // These two buttons basically make up a 'radio button', only one should be on. I'll use which element has the "on" class to determine which is pressed.
    Menu.inputs.staging.addEventListener('click', (e) => {
        e.preventDefault;
        off(Menu.inputs.release);
        on(Menu.inputs.staging);
    });

    Menu.inputs.release.addEventListener('click', (e) => {
        e.preventDefault;
        on(Menu.inputs.release);
        off(Menu.inputs.staging);
    });

    // Hitting save turns pointerevents off on the form inputs, shows a new 'restart' button where save was
    Menu.save.addEventListener('click', (e) => {
        e.preventDefault;
        Object.values(Menu.inputs).forEach((e) => {
            e.disabled = true;
        });
        
        off(Menu.save);
        on(Menu.restart);

        Menu.setConfig(); //Updates configuration data in chrome storage/GUI
    });

    // Hitting restart undoes the previous changes and allows access to the form again
    Menu.restart.addEventListener('click', (e) => {
        e.preventDefault;
        Object.values(Menu.inputs).forEach((e) => {
            e.disabled = false;
        });

        on(Menu.save);
        off(Menu.restart);

        get('script-row').remove(); // Removes the fancy script publish
    });

    // By default the restart button shows 'Configured'; hovering over the restart button shows the text 'Restart'
    Menu.restart.addEventListener('mouseenter', (e) => {
        e.preventDefault;
        Menu.restart.innerHTML = 'Restart';
    });
    Menu.restart.addEventListener('mouseleave', (e) => {
        e.preventDefault;
        Menu.restart.innerHTML = 'Configured';
    });

    // Hitting publish shows the drag and drop page with the loading wheel, and begins automating the download
    Menu.publishButton.addEventListener('click', (e) => {
        off(Menu.page.one);
        on(Menu.page.two);

        downloadId = automateDownload(exportButton);
    });

    // Alerts user that their file was downloaded and replaces the loading wheel with a file upload icon
    document.addEventListener('gv-downloaded', () => {
        off(Menu.icons.loading);
        on(Menu.icons.file);
        on(Menu.uploadLabel);

        Menu.dropText.innerHTML =
            'Drag your folder here, or click to upload';
    });

    // Dragging files over the drop area changes styles to alert the user; dropping the file sends a fetch request to the backend
    Menu.dropArea.addEventListener('dragenter', (e) => {
        e.preventDefault;
        on(Menu.dropArea);
    });
    Menu.dropArea.addEventListener('dragover', (e) => {
        e.preventDefault;
        on(Menu.dropArea);
    });
    Menu.dropArea.addEventListener('dragleave', (e) => {
        e.preventDefault;
        off(Menu.dropArea);
    });
    Menu.dropArea.addEventListener('drop', (e) => {
        e.preventDefault;
        // Sends data stored in drag-and-drop API
        sendSiteData(e.dataTransfer.files[0]);

        off(Menu.icons.file);
        on(Menu.icons.loading);
        off(Menu.uploadLabel);
        off(Menu.dropArea);

        Menu.dropText.innerHTML = 'Publishing your files...';
    });

    // Ads the ability to use the upload field as an input button, as an alternative to dragging and dropping
    Menu.upload.addEventListener('change', (e) => {
        e.preventDefault;
        // Sends the .zip data
        sendSiteData(Menu.upload.files[0]);

        off(Menu.icons.file);
        on(Menu.icons.loading);
        off(Menu.uploadLabel);

        Menu.dropText.innerHTML = 'Publishing your files...';
    });

    // Shows checkmark icon and link to published site. Congrats!! Ya did it
    document.addEventListener('gv-complete', () => {
        off(Menu.icons.loading);
        on(Menu.icons.complete);
        off(Menu.dropText);
        on(Menu.link);
        deleteDownload();
    });
}

// Function to reset the publish to the beginning state whenever user closes menu, and whenever Webflow is reloaded
async function reset() {
    // Gets the stored values and inputs them into the menu options
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
        on(this.inputs.staging);
        off(this.inputs.release);
    } else {
        off(this.inputs.staging);
        on(this.inputs.release);
    }

    // Resets to page 1
    on(this.page.one);
    off(this.page.two);

    // Resets the icons and undoes other various publish changes
    off(this.icons.file);
    on(this.icons.loading);
    off(this.icons.complete);
    off(this.options);
    off(this.form);
    off(this.link);
    on(this.dropText);
    off(this.uploadLabel);
    this.dropText.innerHTML = 'Downloading your files...';
}

// Ensures the advanced options publish is configured based on the current options
async function configure() {
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
        // Allow publish button to be clicked
        off(this.subtitle);
        on(this.publish);
        // Enter the existing config data
        this.inputs.domain.value = configData.DOMAIN;
        this.inputs.siteCode.value = configData.SITE_CODE;
        this.inputs.scripts.value = configData.SCRIPTS.join(', ');
        if (configData.STAGING) {
            on(this.inputs.staging);
            off(this.inputs.release);
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
            off(this.inputs.staging);
            on(this.inputs.release);
            this.link.setAttribute('href', `https:// ${configData.DOMAIN}`);
            this.site.setAttribute('href', `https:// ${configData.DOMAIN}`);
            this.site.querySelector('span').innerHTML = configData.DOMAIN;
        }

        // This is some code I wrote to give nice styles to the list of scripts, reminiscent of Webflow's class adder publish
        // Pretty much useless, but makes it more obvious which scripts are going to be added and looks cool

        // Adds a new div that sits on top of the existing script input element
        const scriptRow = document.createElement('div');
        scriptRow.id = 'script-row';
        scriptRow.classList.add('publish-text');

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
        off(this.save);
        on(this.restart);
    }
}

// Write and store configuration data
function setConfig() {
    // Reads the class on the fake radio buttons and sets a boolean accordingly
    let stagingBool = true;
    if (this.inputs.staging.classList.contains('on')) {
        stagingBool = true;
    } else {
        stagingBool = false;
    }

    // Get the project name from the webflow designer url 
    const projectString = window.location.pathname.split('/')[2]; // Gets WF project name from URL
    let scriptArray = this.inputs.scripts.value.split(', '); // Gets an array of script strings from comma + space delimited list

    chrome.storage.local
        .set({
            projectKey: {
                PROJECT: projectString,
                DOMAIN: this.inputs.domain.value,
                SITE_CODE: this.inputs.siteCode.value,
                SCRIPTS: scriptArray,
                STAGING: stagingBool,
                CONFIG_STATE: true,
            },
        })
        .then(this.configure());
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
    // Automates the normal user download process using queries and .click()
    const buttonRowSelector =
        'div[style="display: flex; justify-content: space-between; flex: 0 1 auto;"]';
    const exportModalSelector =
        'div[style^="opacity: 1; position: fixed; background-color: rgba(0, 0, 0, 0.8)"]';

    exportButton.click();
    const exportModal = await lookFor(exportModalSelector);
    exportModal.style.display = 'none';
    const zipButton = await lookFor(
        buttonRowSelector + ' button:nth-child(4)',
        10
    );
    zipButton.click();
    const downloadButton = await lookFor(
        buttonRowSelector + ' a[href^="blob:"]',
        10
    );
    // Get the blob URL of the zip file the href attribute of the download button
    let downloadURL = downloadButton.href;
    // Exit the download modal
    document.querySelector(buttonRowSelector + ' button:nth-child(3)').click();
    // Open a port with the background script, so that we can use the download API
    let downloadPort = chrome.runtime.connect({ name: 'download-port' });
    downloadPort.postMessage({ url: downloadURL });
    downloadPort.onMessage.addListener(() => {
        document.dispatchEvent(pmDownloaded);
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
