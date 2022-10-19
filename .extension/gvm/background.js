////PUSHERMAN BACKGROUND SCRIPT

//Set configuration defaults
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    domain: '',
    siteCode: '',
    staging: true,
    static: true
  });
})

//Open Udesly once the config is downloaded
chrome.runtime.onMessage.addListener(() => {
  chrome.tabs.create({ url: "https://udesly.com/app/jamstack" });
});