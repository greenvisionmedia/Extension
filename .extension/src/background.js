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
    });
});

chrome.storage.onChanged.addListener(() => {
    let configData = chrome.storage.local.get([
        'PROJECT',
        'DOMAIN',
        'SITE_CODE',
        'SCRIPTS',
        'STAGING',
        'LOGIN_STATE',
        'CONFIG_STATE',
        'DOWNLOAD_SIZE'
    ]);
    console.log(configData);
});

chrome.downloads.onCreated.addListener((item) => {
    chrome.storage.local.set({
        DOWNLOAD_SIZE: item.fileSize,
    });
    console.log(item.fileSize);
});
