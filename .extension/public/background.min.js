////PUSHERMAN BACKGROUND SCRIPT

//Set configuration defaults
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    DOMAIN: '',
    SITECODE: '',
    PASSWORD: '',
    STAGING: true,
  });
})

chrome.storage.onChanged.addListener(() => {
  let configData = chrome.storage.sync.get();
});