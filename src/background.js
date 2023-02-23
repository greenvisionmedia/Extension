/**
 * GV EXTENSION | Background script
 *
 * Sends data from the extension to the pusherman node application.
 * Also sends download data back to the content script to update the carbon meter.
 */

// Set configuration defaults
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        PROJECT: 'hello-world',
        DOMAIN: 'hello.world',
        SITE_CODE: 'hw',
        SCRIPTS: ['hello', 'world'],
        STAGING: true,
        LOGIN_STATE: false,
        CONFIG_STATE: false,
        SVG_STATE: false,
        DOWNLOAD_SIZE: 0,
    });
});

// PUBLISH MODAL ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Handle messages from the content script
chrome.runtime.onConnect.addListener((port) => {
    console.log('onConnect triggered');
    port.onMessage.addListener((request) => {
        console.log('onMessage triggered');
        if (port.name == 'login') {
            console.log('port name login registered');
            let url = 'https://pusher.free.beeceptor.com';
            fetch(url, {
                method: 'POST',
                body: {
                    username: request.username,
                    password: request.password,
                },
            })
                .then(() => {
                    port.postMessage({ response: 'pm-login' });
                    port.disconnect();
                })
                .catch((e) => {
                    console.log(e);
                    port.disconnect();
                });
        }
        if (port.name == 'site') {
            let url = 'https://pusher.free.beeceptor.com',
                formData = new FormData();
            // Append both the file and the configuration data
            formData.append('file', request.file);
            formData.append('config', request.config);
            fetch(url, {
                method: 'POST',
                body: formData,
            })
                .then(() => {
                    port.postMessage({ response: 'pm-complete' });
                    port.disconnect();
                })
                .catch((e) => {
                    console.log(e);
                    port.disconnect();
                });
        }
    });
});

// CARBON METER ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Store download size for use by
chrome.downloads.onCreated.addListener((item) => {
    chrome.storage.local.set({
        DOWNLOAD_SIZE: item.fileSize,
    });
});
