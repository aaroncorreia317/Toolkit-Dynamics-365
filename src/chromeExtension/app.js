(function (global) {
    var _sourceHtml = null;

    function injectScript(file) {
        return new Promise((resolve, reject) => {
            let scriptTag = document.createElement('script');

            scriptTag.setAttribute('type', 'text/javascript');
            scriptTag.setAttribute('src', file);

            scriptTag.onload = () => {
                scriptTag.remove();
                resolve();
            };

            scriptTag.onerror = reject;

            (document.head || document.documentElement).appendChild(scriptTag);
        });
    }

    async function loadToolbox() {
        let root = document.createElement('div');
        root.innerHTML = _sourceHtml;
        root.setAttribute('data-hook', 'gotdibbs-toolbox-root');
        document.body.appendChild(root);

        return await injectScript(chrome.extension.getURL('toolkit/launcher.js'));
    }

    async function launchToolbox(version) {
        if (!version) {
            alert('It doesn\'t look like I can interact with this page. Sorry!');
            return;
        }

        if (document.querySelector('[data-hook="gotdibbs-toolbox"]')) {
            return;
        }

        try {
            if (!_sourceHtml) {
                let result = await fetch(chrome.extension.getURL('toolkit/launcher.fragment.html'));

                if (!result.ok) {
                    throw Error(r.statusText);
                }

                _sourceHtml = await result.text();
            }

            await loadToolbox();
        }
        catch (e) {
            onsole.error('Failed to load toolkit HTML');
            console.error(e);
            Honeybadger.notify(e, {
                message: 'Failed to load toolkit HTML'
            });
        }
    }

    async function loadDependencies() {
        await injectScript(chrome.extension.getURL('honeybadger.min.js'));
        await injectScript(chrome.extension.getURL('contextCommunicator.js'));
    }

    function sendMessage(type, content) {
        let message = new CustomEvent('gotdibbs-toolbox', {
            detail: {
                type,
                content
            }
        });

        message.initEvent('gotdibbs-toolbox', false, false);

        document.dispatchEvent(message);
    }

    function handleEvent(e) {
        let message = e.detail;

        switch (message.type) {
            case 'LAUNCH_TOOLBOX':
                launchToolbox(message.content);
                break;
        }
    }

    function validateVersion() {
        sendMessage('VALIDATE_VERSION');
    }

    function handleBackgroundMessage(e) {
        switch (e.type) {
            case 'LAUNCH_TOOLBOX':
                validateVersion();
                break;
        }
    }

    function attachListeners() {
        document.addEventListener('gotdibbs-toolbox', handleEvent);

        chrome.runtime.onMessage.addListener(handleBackgroundMessage);
    }

    function load() {
        Honeybadger.configure({
            apiKey: '3783205f',
            environment: 'production',
            revision: '1.7',
            onerror: false,
            onunhandledrejection: false
        });

        Honeybadger.setContext({
            source: 'chrome_extension'
        });

        Honeybadger.wrap(async function () {
            await loadDependencies();
            attachListeners();

            validateVersion();
        })();
    }

    global.GOTDIBBS = true;

    if (document.readyState === 'complete') {
        load();
    }
    else {
        global.addEventListener('load', load);
    }
}(this));