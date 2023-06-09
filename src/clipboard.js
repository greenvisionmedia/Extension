// MAGIC CLIPBOARD /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Designed to modify the clipboard data when pasting into a Webflow embed block. Inspired by this extension: https://github.com/evanfrawley/magicpaste
 *
 * Automatically converts markdown to HTML.
 * Useful when you have many <pre> and <code> tags that don't translate well to Webflow
 * To paste into WF, write '<!--gv-markdown->' on its own line at the top of the document
 *
 * Automatically minifies SVG pasted from Illustrator.
 * Useful if you want to add global CSS properties like fill: and stroke:
 * or global SVG elements like <filter> and <gradient>
 *
 * Should be extensible if we need other clipboard modification stuff
 */

const SVGPragma = /^<\?xml version="1.0" encoding="UTF-8"\?>\s*/; // Using the xml version that always appears in illustrator SVG clipboards
const MDPragma = /^<!--gv-markdown-->\n*/; // Using HTML comment syntax means it won't appear in the Obsidian preview mode or if converted to HTML another way

// Wait for an embed modal to appear in the dom
lookFor('.bem-EmbedEditor_Modal', 100).then(injectCheckbox);

// Starts clipboard modification when embed is opened, with the option to disable SVG conversion
function injectCheckbox(HTMLEmbed) {
    // Inserts a checkbox to disable SVG compression
    if (!g('svg-checkbox')) {
        // Get the parent element of the checkboxes
        const checkboxDiv = HTMLEmbed.querySelector(
            ' .bem-Modal_Body > form > div:nth-child(3) > div:first-child'
        );

        // Change a few styles on the existing checkbox wrapper div
        checkboxDiv.style.display = 'flex';
        checkboxDiv.style.gap = '2rem';

        // Inject the checkboxes and the associated markup
        checkboxDiv.insertAdjacentHTML(
            'beforeEnd',
            `<label class="publish-checkbox-label">
                <input id="md-checkbox" class="gv-checkbox" type="checkbox"/>
                MD to HTML
            </label>
            <label class="publish-checkbox-label">
                <input id="svg-checkbox" class="gv-checkbox" type="checkbox"/>
                Compress SVG
            </label>
            <label class="publish-checkbox-label">
                <input id="uri-checkbox" class="gv-checkbox" type="checkbox"/>
                SVG to Data URI
            </label>`
        );

        // Register a magic clipboard ui object with both checkboxes and a config method
        const mc = {
            SVGCheckbox: g('svg-checkbox'),
            MDCheckbox: g('md-checkbox'),
            URICheckbox: g('uri-checkbox'),
            configure,
        };

        // Toggles a checkmark, and stores a local variable so these settings are persistant
        mc.SVGCheckbox.addEventListener('click', () => {
            if (mc.SVGCheckbox.checked) {
                chrome.storage.local.set({
                    SVG_STATE: true,
                });
            } else {
                chrome.storage.local.set({
                    SVG_STATE: false,
                });
            }
        });

        mc.URICheckbox.addEventListener('click', () => {
            if (mc.URICheckbox.checked) {
                chrome.storage.local.set({
                    URI_STATE: true,
                });
            } else {
                chrome.storage.local.set({
                    URI_STATE: false,
                });
            }
        });

        mc.MDCheckbox.addEventListener('click', () => {
            if (mc.MDCheckbox.checked) {
                chrome.storage.local.set({
                    MD_STATE: true,
                });
            } else {
                chrome.storage.local.set({
                    MD_STATE: false,
                });
            }
        });

        // Load the correct state of the checkmark based on local config data
        mc.configure();

        // Initiate the clibpoard modifications on embed load, on clicking into the embed,
        // and on refocusing the window (helpful if the user clicks away to Illustrator then clicks back in)
        // and on ctrl keyup (i.e. for ctrl+a when selecting everything inside the embed modal)
        modifyClipboard();
        HTMLEmbed.addEventListener('click', modifyClipboard);
        window.addEventListener('focus', () => {
            if (g('svg-checkbox')) {
                modifyClipboard;
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control' && g('svg-checkbox')) {
                modifyClipboard;
            }
        });
    }

    // Start wait loop again
    lookFor('.bem-EmbedEditor_Modal', 100).then(injectCheckbox);
}

async function configure() {
    const configData = await chrome.storage.local.get([
        'SVG_STATE',
        'MD_STATE',
        'URI_STATE',
    ]);
    if (configData.SVG_STATE) {
        this.SVGCheckbox.checked = true;
    }
    if (configData.MD_STATE) {
        this.MDCheckbox.checked = true;
    }
    if (configData.URI_STATE) {
        this.URICheckbox.checked = true;
    }
}

async function modifyClipboard() {
    const text = await navigator.clipboard.readText(),
        configData = await chrome.storage.local.get([
            'SVG_STATE',
            'MD_STATE',
            'URI_STATE',
        ]);
    if (SVGPragma.test(text)) {
        // Checking config data to see if SVG compression is on
        if (configData.SVG_STATE) {
            // If so, compress and load that text to the clipboard
            const compressedSVG = compressSVG(text);
            navigator.clipboard.writeText(compressedSVG);
        } else if (configData.URI_STATE) {
            const convertedSVG = convertSVG(text);
            navigator.clipboard.writeText(convertedSVG);
        }
    }
    if (MDPragma.test(text)) {
        if (configData.MD_STATE) {
            const convertedMD = markdown(text.replace(MDPragma, ''));
            navigator.clipboard.writeText(convertedMD);
        }
    }
}

// This is a severe minification, removes everything but the essential path data including colors, kerning, strokes and stroke effects
// Best for small icons or simple shapes (which are the best use-cases for inline SVG in Webflow)

function convertSVG(svg) {
    svg = svg.trim();
    // remove xml, doctype, generator...
    svg = svg.slice(svg.indexOf('<svg'));
    // soft validate
    if (!svg.startsWith('<svg') || !svg.endsWith('svg>')) return;
    // add namespace if necessary
    if (!svg.includes('http://www.w3.org/2000/svg'))
        svg = svg.replace(/<svg/g, `<svg xmlns='http://www.w3.org/2000/svg'`);
    // remove comments
    svg = svg.replace(/<!--.{1,}-->/g, '');
    // remove unnecessary attributes
    svg = svg.replace(/version=[\"\'](.{0,}?)[\"\'](?=[\s>])/g, '');
    svg = svg.replace(/id=[\"\'](.{0,}?)[\"\'](?=[\s>])/g, '');
    svg = svg.replace(/class=[\"\'](.{0,}?)[\"\'](?=[\s>])/g, '');
    svg = svg.replace(/data-name=[\"\'](.{0,}?)[\"\'](?=[\s>])/g, '');
    svg = svg.replace(/encoding=[\"\'](.{0,}?)[\"\'](?=[\s>])/g, '');
    // replace nested quotes
    svg = svg.replace(/"'(.{1,})'"/g, "'$1'");
    // replace double quotes
    svg = svg.replace(/"/g, "'");
    // remove empty spaces between tags
    svg = svg.replace(/>\s{1,}</g, '><');
    // remove duplicate spaces
    svg = svg.replace(/\s{2,}/g, ' ');
    // trim again
    svg = svg.trim();
    // soft validate again
    if (!svg.startsWith('<svg') || !svg.endsWith('svg>')) return;
    // replace ampersand
    svg = svg.replace(/&/g, '&amp;');
    // encode only unsafe symbols
    svg = svg.replace(/[%#<>?\[\\\]^`{|}]/g, encodeURIComponent);
    // build data uri
    svg = `data:image/svg+xml,${svg}`;
    // ok, ship it!
    return svg;
}

// This is a severe minification, removes everything but the essential path data including colors, kerning, strokes and stroke effects
// Best for small icons or simple shapes (which are the best use-cases for inline SVG in Webflow)

function compressSVG(svg) {
    svg = svg.trim();
    // remove xml, doctype, generator...
    svg = svg.slice(svg.indexOf('<svg'));
    // soft validate
    if (!svg.startsWith('<svg') || !svg.endsWith('svg>')) return;
    // add namespace if necessary
    if (!svg.includes('http://www.w3.org/2000/svg'))
        svg = svg.replace(/<svg/g, `<svg xmlns='http://www.w3.org/2000/svg'`);
    // remove comments
    svg = svg.replace(/<!--.{1,}-->/g, '');
    // remove unnecessary attributes
    svg = svg.replace(/version=[\"\'](.{0,}?)[\"\'](?=[\s>])/g, '');
    svg = svg.replace(/id=[\"\'](.{0,}?)[\"\'](?=[\s>])/g, '');
    svg = svg.replace(/class=[\"\'](.{0,}?)[\"\'](?=[\s>])/g, '');
    svg = svg.replace(/data-name=[\"\'](.{0,}?)[\"\'](?=[\s>])/g, '');
    svg = svg.replace(/encoding=[\"\'](.{0,}?)[\"\'](?=[\s>])/g, '');
    svg = svg.replace(/style=[\"\'](.{0,}?)[\"\'](?=[\s>])/g, '');
    svg = svg.replace(/fill=[\"\'](.{0,}?)[\"\'](?=[\s>])/g, '');

    return svg;
}
