/**
 * GV EXTENSION | Background script
 *
 * Sends data from the extension to the pusherman node application.
 * Also sends download data back to the content script to update the carbon meter.
 */

// PUBLISH MODAL ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Set configuration defaults (in SCREAMING_SNAKE)
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        PROJECT: 'hello-world',
        DOMAIN: 'hello.world',
        SITE_CODE: 'hw',
        SCRIPTS: ['hello', 'world'],
        STAGING: true,
        LOGIN_STATE: false,
        CONFIG_STATE: false,
    });
});

// Handle downloading the files using chrome's download API, then deleting that download when the content script requests
chrome.runtime.onConnect.addListener((port) => {
    let downloading, downloadId;
    if (port.name == 'download-port') {
        port.onMessage.addListener((message) => {
            downloading = chrome.downloads.download({ url: message.url });
            downloading.then((id) => {
                port.postMessage({ response: 'pm-downloaded', id: id });
            });
        });
    }
    if (port.name == 'delete-port') {
        port.onMessage.addListener(() => {
            console.log(downloadId);
            chrome.downloads
                .removeFile(downloadId)
                .then(port.postMessage({ response: 'pm-deleted' }));
        });
    }
});

// CARBON METER ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Store download size for use by carbon meter
chrome.downloads.onCreated.addListener((item) => {
    chrome.storage.local.set({
        FILE_SIZE: item.fileSize,
        FILENAME: item.filename,
    });
});
