////PUSHERMAN BACKGROUND SCRIPT

//Set configuration defaults
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        PROJECT: 'hello-world',
        DOMAIN: 'hello.world',
        SITE_CODE: 'hw',
        SCRIPTS: ['hello', 'world'],
        STAGING: true,
        LOGIN_STATE: false,
        CONFIG_STATE: false,
        DOWNLOAD_SIZE: 0,
        SVG_STATE: false
    });
});

chrome.downloads.onCreated.addListener((item) => {
    chrome.storage.local.set({
        DOWNLOAD_SIZE: item.fileSize,
    });
    console.log(item.fileSize);
});
