// // CLIPBOARD CONTENT SCRIPT

const TYPE_HTML = 'text/html';
const TYPE_PLAIN = 'text/plain';
const TYPE_XML = 'text/xml';

// Wait for DOM elements to appear, avoids querying bits of the WF designer that don't exist yet
function waitFor(waitClass, callback, interval) {
    let wait = setInterval(() => {
        let waitNode = document.querySelector(waitClass);
        if (waitNode) {
            clearInterval(wait);
            callback(waitNode);
        }
    }, interval);
}

// // SVG PASTE

waitFor('.w-codemirror', getEmbedInput, 1000);

const svgRegex = /^<\?xml version="1.0" encoding="UTF-8"\?>\s*/;

function getEmbedInput(embedInput) {
    embedInput.addEventListener('click', pasteSVG);
    embedInput.addEventListener('copy', pasteSVG);
    embedInput.addEventListener('focus', pasteSVG);
}

window.addEventListener('focus', pasteSVG);

async function SVGtoClipboard(svg) {
    const s = new XMLSerializer();
    const str = s.serializeToString(svg);
    await navigator.clipboard.writeText(str);
}

async function pasteSVG() {
    let svgText = await navigator.clipboard.readText();
    if (svgRegex.test(svgText)) {
        const parser = new DOMParser();
        let svgDoc = parser.parseFromString(svgText, TYPE_XML);

        let svg = svgDoc.querySelector('svg');
        svg.removeAttribute('xlmns');
        svg.removeAttribute('data-name');
        svg.removeAttribute('width');
        svg.removeAttribute('height');

        let defs = svgDoc.querySelector('defs')
        if (defs) {
            defs.remove();
        }

        await SVGtoClipboard(svgDoc);
    }
}

// // MARKDOWN PASTE

waitFor('.bem-RichTextInput', getRichTextInput, 1000);

const markdownRegex = /^@markdown\s*/;
const markdownStringNoNewLine = '@markdown';

function getRichTextInput(richTextInput) {
    const infoContainerContainer =
        richTextInput.parentElement.querySelector('div.bem-Field_Head');
    if (!infoContainerContainer) return;
    const infoContainer = infoContainerContainer.querySelector('div.bem-View');
    if (!infoContainer) return;
    infoContainer.classList.add('mp-container');
    richTextInput.addEventListener('click', pasteMarkdown);
    richTextInput.addEventListener('copy', pasteMarkdown);
    richTextInput.addEventListener('focus', pasteMarkdown);
    const info = document.createElement('div');
    info.innerHTML =
        'When pasting Markdown, make sure the contents start with <span class="mp-chip">@markdown</span> on its own line. <a class="mp-link" href="https://greenvision.media/docs/build-process/" target="_blank">Learn More</a>';
    info.classList.add('mp-info');
    infoContainer.appendChild(info);
}

async function formatMarkdownToHTML(text) {
    const markdownContents = text
        .replace(/\u00A0\//g, ' ')
        .replace(markdownRegex, '');
    const formattedText = markdown(markdownContents);

    return formattedText;
}

async function HTMLtoClipboard(str) {
    const newBlob = new Blob([str], { type: TYPE_HTML });
    const data = [new ClipboardItem({ [TYPE_HTML]: newBlob })];
    await navigator.clipboard.write(data);
}

async function pasteMarkdown() {
    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
            const blob = await clipboardItem.getType(type);
            const text = await blob.text();

            if (type === TYPE_PLAIN && markdownRegex.test(text)) {
                const htmlString = await formatMarkdownToHTML(text);
                await HTMLtoClipboard(htmlString);
            } else if (type === TYPE_HTML) {
                const parser = new DOMParser();
                const htmlDoc = parser.parseFromString(text, TYPE_HTML);
                const body = htmlDoc.querySelector('body');

                if (!body.textContent.startsWith(markdownStringNoNewLine))
                    return;

                let items = [];
                if (body.children.length >= 2) {
                    items = Array.from(body.children);
                } else if (
                    body.children.length === 1 &&
                    body.children[0].tagName.toLowerCase() === 'div' &&
                    body.children[0].children.length >= 2
                ) {
                    items = Array.from(body.children[0].children);
                } else {
                    return;
                }

                items = items
                    .filter((item) => item.tagName.toLowerCase() !== 'meta')
                    .slice(1); // get rid of the markdown

                const formattedHTMLStrings = [];
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    let str;
                    const name = item.tagName.toLowerCase();
                    if (name === 'p' || name === 'div') {
                        str = await formatMarkdownToHTML(item.textContent);
                    } else {
                        str = item.outerHTML;
                    }
                    formattedHTMLStrings.push(str);
                }

                if (formattedHTMLStrings.length === 0) return;

                await HTMLtoClipboard(formattedHTMLStrings.join('\n'));
            }
        }
    }
}

/**
 * drawdown.js
 * (c) Adam Leggett
 */

function markdown(src) {
    var rx_lt = /</g;
    var rx_gt = />/g;
    var rx_space = /\t|\r|\uf8ff/g;
    var rx_escape = /\\([\\\|`*_{}\[\]()#+\-~])/g;
    var rx_hr = /^([*\-=_] *){3,}$/gm;
    var rx_blockquote = /\n *&gt; *([^]*?)(?=(\n|$){2})/g;
    var rx_list =
        /\n( *)(?:[*\-+]|((\d+)|([a-z])|[A-Z])[.)]) +([^]*?)(?=(\n|$){2})/g;
    var rx_listjoin = /<\/(ol|ul)>\n\n<\1>/g;
    var rx_highlight =
        /(^|[^A-Za-z\d\\])(([*_])|(~)|(\^)|(--)|(\+\+)|`)(\2?)([^<]*?)\2\8(?!\2)(?=\W|_|$)/g;
    var rx_code = /\n((```|~~~).*\n?([^]*?)\n?\2|((    .*?\n)+))/g;
    var rx_link =
        /((!?)\[(.*?)\]\((.*?)( ".*")?\)|\\([\\`*_{}\[\]()#+\-.!~]))/g;
    var rx_table = /\n(( *\|.*?\| *\n)+)/g;
    var rx_thead = /^.*\n( *\|( *\:?-+\:?-+\:? *\|)* *\n|)/;
    var rx_row = /.*\n/g;
    var rx_cell = /\||(.*?[^\\])\|/g;
    var rx_heading = /(?=^|>|\n)([>\s]*?)(#{1,6}) (.*?)( #*)? *(?=\n|$)/g;
    var rx_para = /(?=^|>|\n)\s*\n+([^<]+?)\n+\s*(?=\n|<|$)/g;
    var rx_stash = /-\d+\uf8ff/g;

    function replace(rex, fn) {
        src = src.replace(rex, fn);
    }

    function element(tag, content) {
        return '<' + tag + '>' + content + '</' + tag + '>';
    }

    function blockquote(src) {
        return src.replace(rx_blockquote, function (all, content) {
            return element(
                'blockquote',
                blockquote(highlight(content.replace(/^ *&gt; */gm, '')))
            );
        });
    }

    function list(src) {
        return src.replace(rx_list, function (all, ind, ol, num, low, content) {
            var entry = element(
                'li',
                highlight(
                    content
                        .split(
                            RegExp(
                                '\n ?' +
                                    ind +
                                    '(?:(?:\\d+|[a-zA-Z])[.)]|[*\\-+]) +',
                                'g'
                            )
                        )
                        .map(list)
                        .join('</li><li>')
                )
            );

            return (
                '\n' +
                (ol
                    ? '<ol start="' +
                      (num
                          ? ol + '">'
                          : parseInt(ol, 36) -
                            9 +
                            '" style="list-style-type:' +
                            (low ? 'low' : 'upp') +
                            'er-alpha">') +
                      entry +
                      '</ol>'
                    : element('ul', entry))
            );
        });
    }

    function highlight(src) {
        return src.replace(
            rx_highlight,
            function (all, _, p1, emp, sub, sup, small, big, p2, content) {
                return (
                    _ +
                    element(
                        emp
                            ? p2
                                ? 'strong'
                                : 'em'
                            : sub
                            ? p2
                                ? 's'
                                : 'sub'
                            : sup
                            ? 'sup'
                            : small
                            ? 'small'
                            : big
                            ? 'big'
                            : 'code',
                        highlight(content)
                    )
                );
            }
        );
    }

    function unesc(str) {
        return str.replace(rx_escape, '$1');
    }

    var stash = [];
    var si = 0;

    src = '\n' + src + '\n';

    replace(rx_lt, '&lt;');
    replace(rx_gt, '&gt;');
    replace(rx_space, '  ');

    // blockquote
    src = blockquote(src);

    // horizontal rule
    replace(rx_hr, '<hr/>');

    // list
    src = list(src);
    replace(rx_listjoin, '');

    // code
    replace(rx_code, function (all, p1, p2, p3, p4) {
        stash[--si] = element(
            'pre',
            element('code', p3 || p4.replace(/^    /gm, ''))
        );
        return si + '\uf8ff';
    });

    // link or image
    replace(rx_link, function (all, p1, p2, p3, p4, p5, p6) {
        stash[--si] = p4
            ? p2
                ? '<img src="' + p4 + '" alt="' + p3 + '"/>'
                : '<a href="' + p4 + '">' + unesc(highlight(p3)) + '</a>'
            : p6;
        return si + '\uf8ff';
    });

    // table
    replace(rx_table, function (all, table) {
        var sep = table.match(rx_thead)[1];
        return (
            '\n' +
            element(
                'table',
                table.replace(rx_row, function (row, ri) {
                    return row == sep
                        ? ''
                        : element(
                              'tr',
                              row.replace(rx_cell, function (all, cell, ci) {
                                  return ci
                                      ? element(
                                            sep && !ri ? 'th' : 'td',
                                            unesc(highlight(cell || ''))
                                        )
                                      : '';
                              })
                          );
                })
            )
        );
    });

    // heading
    replace(rx_heading, function (all, _, p1, p2) {
        return _ + element('h' + p1.length, unesc(highlight(p2)));
    });

    // paragraph
    replace(rx_para, function (all, content) {
        return element('p', unesc(highlight(content)));
    });

    // stash
    replace(rx_stash, function (all) {
        return stash[parseInt(all)];
    });

    return src.trim();
}
