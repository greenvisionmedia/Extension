////PUSHERMAN BACKGROUND SCRIPT

//Set configuration defaults
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        PROJECT: 'hello-world',
        DOMAIN: 'hello.world',
        SITECODE: 'hw',
        SCRIPTS: ['hello', 'world'],
        STAGING: true,
        LOGINSTATE: false,
        CONFIGSTATE: false,
    });
});

chrome.storage.onChanged.addListener(() => {
    let configData = chrome.storage.local.get([
        'PROJECT',
        'DOMAIN',
        'SITECODE',
        'SCRIPTS',
        'STAGING',
        'LOGINSTATE',
        'CONFIGSTATE',
    ]);
    console.log(configData);
});
