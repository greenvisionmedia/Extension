//Open Udesly once the config is downloaded
function handleMessage(request, sender, sendResponse) {
    console.log(`A content script sent a message: ${request.greeting}`);
    sendResponse({ response: "Response from background script" });
    chrome.tabs.create({url: "https://www.udesly.com/app/jamstack/"});
  }
  
  chrome.runtime.onMessage.addListener(handleMessage);