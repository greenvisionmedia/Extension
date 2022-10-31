////PUSHERMAN BACKGROUND SCRIPT

//Set configuration defaults
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    PROJECT: 'hello-world',
    DOMAIN: 'hello.world',
    SITECODE: 'hw',
    SCRIPTS: ['hello', 'world'],
    STAGING: true
  });
})

chrome.storage.onChanged.addListener(() => {
  let configData = chrome.storage.sync.get([
    'PROJECT',
    'DOMAIN',
    'SITECODE',
    'SCRIPTS',
    'STAGING'
  ])
  console.log(configData);
});