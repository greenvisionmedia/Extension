/**
 * GV EXTENSION | Background script
 *
 * Primarily used to take advantage of the chrome.downloads API
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
    if (port.name == 'download-port') {
        port.onMessage.addListener(async (message) => {
            const configData = await chrome.storage.local.get('PROJECT');
            chrome.downloads
                .download({
                    url: message.url,
                    filename: `${configData.PROJECT}-${dateFormat(
                        Date.now(),
                        'MM-dd-yyyy-hh-mm'
                    )}`,
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

function dateFormat(inputDate, format) {
    //parse the input date
    const date = new Date(inputDate);
    //extract the parts of the date
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    //replace the month
    format = format.replace('MM', month.toString().padStart(2, '0'));
    //replace the year
    if (format.indexOf('yyyy') > -1) {
        format = format.replace('yyyy', year.toString());
    } else if (format.indexOf('yy') > -1) {
        format = format.replace('yy', year.toString().substr(2, 2));
    }
    //replace the day
    format = format.replace('dd', day.toString().padStart(2, '0'));
    //replace the hour
    format = format.replace('hh', hours.toString().padStart(2, '0'));
    //replace the minute
    format = format.replace('mm', minutes.toString().padStart(2, '0'));

    return format;
}

// CARBON METER ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Store download size for use by carbon meter
chrome.downloads.onCreated.addListener((item) => {
    chrome.storage.local.set({
        FILE_SIZE: item.fileSize,
    });
});
