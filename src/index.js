// GLOBAL DEFINITIONS ///////////////////////////////////////////////////////////////////////////

/**
 * Adds useful functions and event constructors for all components
 */

// Query shorthand
const get = (i) => document.getElementById(i);

// Class manipulation shorthands
const on = (e) => e.classList.add('on');
const off = (e) => e.classList.remove('on');
const toggle = (e) => e.classList.toggle('on');

// Wait for DOM elements to appear, avoids querying bits of the Webflow designer that haven't loaded yet
function lookFor(lookClass, interval) {
    return new Promise((resolve) => {
        const look = setInterval(() => {
            const lookNode = document.querySelector(lookClass);
            if (lookNode) {
                clearInterval(look);
                resolve(lookNode);
            }
        }, interval);
    });
}


// Register custom events for when the site .zip file is downloaded,
// when a user successfully logs in, and whenever files are successfully uploaded
const gvDownloaded = new Event('gv-downloaded');
const gvLogin = new Event('gv-login');
const gvComplete = new Event('gv-complete');

/**
 * This removes certain elements of the Webflow editor that we at Greenvision generally do not use,
 * including Ecommerce, Users, Logic (soon), and the default methods of sharing and publishing
 */

const removedElements = [
    'share-site-button',
    'left-sidebar-commerce-button',
    'left-sidebar-cms-button',
    'left-sidebar-users-button',
];

lookFor('[data-automation-id="publish-menu-button"]', 100).then(simplifyUI);

function simplifyUI(publishButton) {
    publishButton.style.display = 'none';
    removedElements.forEach((e) => {
        lookFor(`[data-automation-id="'${e}'"]`, 1000).then((e) => {
            e.style.display = 'none';
        });
    });
}

/**
 * Gets the date/time in a nice easy to parse format for timestamping
 */

function dateFormat(inputDate, format) {
    //parse the input date
    const date = new Date(inputDate);
    //extract the parts of the date
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    //replace the month
    format = format.replace('MM', month.toString().padStart(2, '0'));
    //replace the year
    if (format.indexOf('yyyy') > -1) {
        format = format.replace('yyyy', year.toString());
    } else if (format.indexOf('yy') > -1) {
        format = format.replace('yy', year.toString().substr(2, 2));
    }
    //replace the day
    format = format.replace('dd', day.toString().padStart(2, '0'));
    //replace the hour
    format = format.replace('hh', hours.toString().padStart(2, '0'));
    //replace the minute
    format = format.replace('mm', minutes.toString().padStart(2, '0'));

    return format;
}
