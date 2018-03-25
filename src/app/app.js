/* global window, document, console, CanvasService, GlslCanvas, CaptureService, GuiService, TrailsService, CameraService, Stats, dat, JSZip, saveAs, Promise */

(function () {
    'use strict';

    var options = window.options = {
        vertex: '',
        fragment: '',
        main: '',
        buffers: {},
    };

    function onLoad() {
        getResource("shaders/buffers/milk.glsl", function (fragment) {
            var source = fragment;
            var offset;
            options.main = null;
            // (?<=\/{2} u_buffer_)(\d+).*((.|\n)*?)(?=\/{2} [u_buffer|main]|\z)
            // (?<=\/{2} main).*((.|\n)*?)(?=\/{2} u_buffer|\z)
            fragment = fragment.replace(new RegExp('(/{2} u_buffer_)(\\d+).*((.|[\\r\\n]+)*?)(?=/{2} u_buffer|/{2} main|$)', 'g'), function (match, name, i, fragment, end, offset) {
                // console.log('u_buffer_.replace', arguments);
                offset = source.substr(0, offset).split('\n').length;
                // console.log('offset', offset);
                options.buffers['u_buffer_' + i] = {
                    fragment: fragment,
                    offset: offset,
                };
                return '';
            });

            fragment = fragment.replace(new RegExp('(/{2} main).*((.|[\\r\\n]+)*)(?=/{2} u_buffer|$)', 'g'), function (match, name, main, end, offset) {
                options.main = main;
                return '';
            });

            var linediff = fragment.split('\n').length;

            offset = 0;
            if (options.main) {
                source.replace(new RegExp('(/{2} main).*((.|[\\r\\n]+)*)(?=/{2} u_buffer|$)', 'g'), function (match, name, main, end, offset) {
                    // console.log('main.replace', arguments);
                    offset = source.substr(0, offset).split('\n').length - linediff;
                    return '';
                });
            }

            // console.log('getResource', fragment, options.buffers);
            for (var key in options.buffers) {
                options.buffers[key].common = fragment;
                options.buffers[key].offset -= linediff;
            }

            options.fragment = fragment + (options.main || '');
            options.offset = offset;
            // console.log('fragment', options.fragment);
            createCanvas();
        });
    }

    function createCanvas() {
        var content = document.querySelector('.content');
        var canvas = document.querySelector('.shader');
        var btnDownload = document.querySelector('.btn-download');

        resize(true);

        var glsl = new CanvasService(canvas, {
            premultipliedAlpha: false,
            preserveDrawingBuffer: true,
            backgroundColor: 'rgba(1,1,1,1)',
        });
        glsl.on('error', onGlslError);
        glsl.on('render', function () {
            // glsl.forceRender = true;
        });

        load();

        function load() {
            var options = window.options;
            document.querySelector('.errors').setAttribute('class', 'errors');
            document.querySelector('.welcome').setAttribute('class', 'welcome');
            options.vertex = options.vertex.trim().length > 0 ? options.vertex : null;
            options.fragment = options.fragment.trim().length > 0 ? options.fragment : null;
            if (options.fragment || options.vertex) {
                document.querySelector('body').setAttribute('class', 'ready');
            } else {
                document.querySelector('body').setAttribute('class', 'empty');
            }
            glsl.load(options.fragment, options.vertex, options.offset);
            glsl.loadPrograms(options.buffers);
            glsl.loadUniforms(options);
            // console.log('glsl', glsl);
            /*
            gui.load(options.uniforms);
            glsl.setUniforms(gui.uniforms());
            */
        }

        function resize(init) {
            var w = content.offsetWidth;
            var h = content.offsetHeight;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            if (init) {
                canvas.width = w;
                canvas.height = h;
            } else {
                glsl.resize();
            }
        }

        var ri;

        function onResize() {
            if (ri) {
                clearTimeout(ri);
            }
            ri = setTimeout(resize, 50);
        }

        function onDownload() {
            var urls = [
                "css/app.css",
                "css/app.min.css",
                "css/vendors.css",
                "css/vendors.min.css",
                "js/app.js",
                "js/app.min.js",
                "js/vendors.js",
                "js/vendors.min.js",
                "shaders/buffers/milk.glsl",
                "index.html",
            ];
            var zip = new JSZip();
            Promise.all(urls.map(function (url) {
                return new Promise(function (resolve) {
                    var request = new XMLHttpRequest();
                    request.open("GET", url);
                    request.onload = function () {
                        zip.file(url, this.responseText);
                        resolve();
                    };
                    request.send();
                });
            })).then(function () {
                console.log(zip);
                zip.generateAsync({
                    type: "blob"
                }).then(function (content) {
                    /*
                    var a = document.querySelector("a");
                    a.download = "folder" + new Date().getTime();
                    a.href = URL.createObjectURL(content);
                    a.innerHTML = "download " + a.download;
                    */
                    saveAs(content, "glsl-canvas.zip");
                });
            });
        }

        btnDownload.addEventListener('click', onDownload);
        window.addEventListener('resize', onResize);

        resize();
    }

    function onGlslError(message) {
        console.log('onGlslError.error', message);
        var options = window.options;
        var errors = [],
            warnings = [];
        message.error.replace(/ERROR: \d+:(\d+): \'(.+)\' : (.+)/g, function (m, l, v, t) {
            var line = Number(l) + message.offset;
            var error = 'ERROR (' + v + ') ' + t;
            var li = '<li><a class="error" unselectable href="' + encodeURI('command:glsl-canvas.revealGlslLine?' + JSON.stringify([options.uri, line, error])) + '"><span class="line">ERROR line ' + line + '</span> <span class="value" title="' + v + '">' + v + '</span> <span class="text" title="' + t + '">' + t + '</span></a></li>';
            errors.push(li);
            return li;
        });
        message.error.replace(/WARNING: \d+:(\d+): \'(.*\n*|.*|\n*)\' : (.+)/g, function (m, l, v, t) {
            var line = Number(l) + message.offset;
            var warning = 'WARNING (' + v + ') ' + t;
            var li = '<li><a class="warning" unselectable href="' + encodeURI('command:glsl-canvas.revealGlslLine?' + JSON.stringify([options.uri, line, warning])) + '"><span class="line">WARN line ' + line + '</span> <span class="text" title="' + t + '">' + t + '</span></a></li>';
            warnings.push(li);
            return li;
        });
        var output = '<div class="errors-content"><p>glslCanvas error</p><ul>';
        output += errors.join('\n');
        output += warnings.join('\n');
        output += '</ul></div>';
        document.querySelector('.errors').setAttribute('class', 'errors active');
        document.querySelector('.errors').innerHTML = output;
        document.querySelector('body').setAttribute('class', 'idle');
    }

    function getResource(url, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.addEventListener('load', function () {
            callback(request.responseText);
        });
        request.send();
    }

    window.addEventListener('load', onLoad);

}());