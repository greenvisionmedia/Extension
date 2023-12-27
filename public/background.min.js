/**
 * GV EXTENSION | Background script
 *
 * Primarily used to take advantage of the chrome.downloads API
 */

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
    if (port.name == 'download-port') {
        port.onMessage.addListener(async (message) => {
            const configData = await chrome.storage.local.get('PROJECT');
            chrome.downloads
                .download({
                    url: message.url,
                    filename: `${configData.PROJECT}-${message.date}`,
                })
                .then(() => {
                    port.postMessage({ response: 'pm-downloaded' });
                });
        });
    }
    if (port.name == 'delete-port') {
        port.onMessage.addListener(async () => {
            let downloads = await chrome.downloads.search({
                limit: 1,
                orderBy: ['-startTime'],
            });
            chrome.downloads.removeFile(downloads[0].id).then(() => {
                port.postMessage({ response: 'pm-deleted' });
            });
        });
    }
});