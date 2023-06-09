let hostname = window.location.hostname;

fetch(`https://api.thegreenwebfoundation.org/api/v3/greencheck/${hostname}`, {
    method: 'GET',
}).then(async (response) => {
    const data = await response.json();
    if (data.green) {
        chrome.runtime.sendMessage({
            action: 'changeIconActive',
        });
    }
});
