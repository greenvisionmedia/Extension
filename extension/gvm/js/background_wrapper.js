//Workaround to have two separate background scripts
try {
    importScripts('/js/background.js', '/gvm/background.js');
} catch (e) {
    console.log(e);
}