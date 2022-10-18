//Open Udesly once the config is downloaded
  chrome.runtime.onMessage.addListener(() => {
      chrome.tabs.create({url: "https://udesly.com/app/jamstack"});
  });