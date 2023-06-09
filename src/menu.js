// PUBLISH MENU /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * This speeds up the process of exporting code from Webflow and uploading it to the server.
 *
 * Rather than downloading the .zip, uncompressing it, uploading to github/udesly/netlify etc.,
 * you just hit publish. The zip gets downloaded automatically, at which point you can drag it
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
    const publish = {
        menu: g('menu'),
        menuButton: g('menu-button'),
        close: g('close'),
        page: {
            one: g('menu-page-1'),
            two: g('menu-page-2'),
        },
        publishButton: g('publish'),
        subtitle: g('subtitle'),
        options: g('options'),
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
        reset,
        configure,
        setConfig,
    };

    publish.reset(); // Resets various publish state changes using stored chrome variables
    publish.configure(); // Sets the advanced options menu to the configured state

    // Open the menu
    publish.menuButton.addEventListener('click', (e) => {
        e.preventDefault;
        publish.menu.classList.add('on');
    });

    // Close the menu
    publish.close.addEventListener('click', (e) => {
        e.preventDefault;
        publish.menu.classList.remove('on');
        publish.reset();
    });

    document.addEventListener('keyup', (e) => {
        e.preventDefault;
        if (e.key === 'Escape') {
            publish.menu.classList.remove('on');
            publish.reset();
        }
    });

    // Toggle advanced options
    publish.options.addEventListener('click', (e) => {
        e.preventDefault;
        publish.options.classList.toggle('on');
        publish.form.classList.toggle('on');
    });

    // These two buttons basically make up a 'radio button', only one should be on. I'll use which element has the "on" class to determine which is pressed.
    publish.inputs.staging.addEventListener('click', (e) => {
        e.preventDefault;
        publish.inputs.release.classList.remove('on');
        publish.inputs.staging.classList.add('on');
    });

    publish.inputs.release.addEventListener('click', (e) => {
        e.preventDefault;
        publish.inputs.release.classList.add('on');
        publish.inputs.staging.classList.remove('on');
    });

    // Hitting save turns pointerevents off on the form inputs, shows a new 'restart' button where save was
    publish.save.addEventListener('click', (e) => {
        e.preventDefault;
        Object.values(publish.inputs).forEach((e) => {
            e.disabled = true;
        });
        publish.save.classList.remove('on');
        publish.restart.classList.add('on');

        publish.setConfig(); //Updates configuration data in chrome storage/GUI
    });

    // Hitting restart undoes the previous changes and allows access to the form again
    publish.restart.addEventListener('click', (e) => {
        e.preventDefault;
        Object.values(publish.inputs).forEach((e) => {
            e.disabled = false;
        });
        publish.save.classList.add('on');
        publish.restart.classList.remove('on');

        g('script-row').remove(); // Removes the fancy script publish
    });

    // By default the restart button shows 'Configured'; hovering over the restart button shows the text 'Restart'
    publish.restart.addEventListener('mouseenter', (e) => {
        e.preventDefault;
        publish.restart.innerHTML = 'Restart';
    });
    publish.restart.addEventListener('mouseleave', (e) => {
        e.preventDefault;
        publish.restart.innerHTML = 'Configured';
    });

    // Hitting publish shows the drag and drop page with the loading wheel, and begins automating the download
    publish.publishButton.addEventListener('click', (e) => {
        publish.page.one.classList.remove('on');
        publish.page.two.classList.add('on');

        downloadId = automateDownload(exportButton);
    });

    // Alerts user that their file was downloaded and replaces the loading wheel with a file upload icon
    document.addEventListener('gv-downloaded', () => {
        publish.icons.loading.classList.remove('on');
        publish.icons.file.classList.add('on');
        publish.uploadLabel.classList.add('on');
        publish.dropText.innerHTML =
            'Drag your folder here, or click to upload';
    });

    // Dragging files over the drop area changes styles to alert the user; dropping the file sends a fetch request to the backend
    publish.dropArea.addEventListener('dragenter', (e) => {
        e.preventDefault;
        publish.dropArea.classList.add('on');
    });
    publish.dropArea.addEventListener('dragover', (e) => {
        e.preventDefault;
        publish.dropArea.classList.add('on');
    });
    publish.dropArea.addEventListener('dragleave', (e) => {
        e.preventDefault;
        publish.dropArea.classList.remove('on');
    });
    publish.dropArea.addEventListener('drop', (e) => {
        e.preventDefault;
        // Sends data stored in drag-and-drop API
        sendSiteData(e.dataTransfer.files[0]);
        publish.icons.file.classList.remove('on');
        publish.icons.loading.classList.add('on');
        publish.uploadLabel.classList.remove('on');
        publish.dropArea.classList.remove('on');
        publish.dropText.innerHTML = 'Publishing your files...';
    });

    // Ads the ability to use the upload field as an input button, as an alternative to dragging and dropping
    publish.upload.addEventListener('change', (e) => {
        e.preventDefault;
        // Sends the .zip data
        sendSiteData(publish.upload.files[0]);
        publish.icons.file.classList.remove('on');
        publish.icons.loading.classList.add('on');
        publish.uploadLabel.classList.remove('on');
        publish.dropText.innerHTML = 'Publishing your files...';
    });

    // Shows checkmark icon and link to published site. Congrats!! Ya did it
    document.addEventListener('gv-complete', () => {
        publish.icons.loading.classList.remove('on');
        publish.icons.complete.classList.add('on');
        publish.dropText.classList.remove('on');
        publish.link.classList.add('on');
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
        this.inputs.staging.classList.add('on');
        this.inputs.release.classList.remove('on');
    } else {
        this.inputs.staging.classList.remove('on');
        this.inputs.release.classList.add('on');
    }

    // Resets to page 1
    this.page.one.classList.add('on');
    this.page.two.classList.remove('on');

    // Resets the icons and undoes other various publish changes
    this.icons.file.classList.remove('on');
    this.icons.loading.classList.add('on');
    this.icons.complete.classList.remove('on');
    this.options.classList.remove('on');
    this.form.classList.remove('on');
    this.link.classList.remove('on');
    this.dropText.classList.add('on');
    this.uploadLabel.classList.remove('on');
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
        this.save.classList.remove('on');
        this.restart.classList.add('on');
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

    const projectString = window.location.pathname.split('/')[2]; // Gets WF project name from URL
    let scriptArray = this.inputs.scripts.value.split(', '); // Gets an array of script strings from comma + space delimited list
    const projectKey = projectString.toUpperCase();

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
