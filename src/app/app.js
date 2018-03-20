/* global window, document, console, GlslCanvas, CaptureService, GuiService, TrailsService, CameraService, Stats, dat */

(function () {
    'use strict';

    var GlslCanvasWrapper = function () {
        // TODO LOAD CREATE MULTIPLE PROGRAMS
        /*
        lass GLProgram {
        constructor (vertexShader, fragmentShader) {
            this.uniforms = {};
            this.program = gl.createProgram();

            gl.attachShader(this.program, vertexShader);
            gl.attachShader(this.program, fragmentShader);
            gl.linkProgram(this.program);

            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                throw gl.getProgramInfoLog(this.program);
            }

            const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
            for (let i = 0; i < uniformCount; i++) {
                const uniformName = gl.getActiveUniform(this.program, i).name;
                this.uniforms[uniformName] = gl.getUniformLocation(this.program, uniformName);
            }
        }
        bind () {
            gl.useProgram(this.program);
        }
        }
        */

        function GlslCanvasWrapper(canvas, options) {
            return new GlslCanvas(canvas, options);
        }

        GlslCanvas.prototype.loadBuffers = loadBuffers;
        GlslCanvas.prototype.loadUniforms = loadUniforms;
        GlslCanvas.prototype.updateVariables = updateVariables;
        GlslCanvas.prototype.updateUniforms = updateUniforms;
        GlslCanvas.prototype.updateBuffers = updateBuffers;
        GlslCanvas.prototype.uniform = uniform;
        GlslCanvas.prototype.render = render;
        /*
        function createFrameBuffer(gl, i, W, H) {
            gl.activeTexture(gl.TEXTURE0 + i);
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            var buffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            gl.viewport(0, 0, W, H);
            gl.clear(gl.COLOR_BUFFER_BIT);
            console.log(W, H, i);
            return [texture, buffer, i];
        }
        */

        function loadBuffers(buffers) {
            var glsl = this,
                gl = glsl.gl,
                i = 0;
            glsl.buffers = {};
            gl.bundle = function (program, i, W, H) {
                gl.useProgram(program);
                var texture = gl.createTexture();
                var buffer = gl.createFramebuffer();
                var uniform = gl.getUniformLocation(program, "u_buffer_" + i);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                return {
                    texture: texture,
                    buffer: buffer,
                    uniform: uniform,
                    link: function () {
                        gl.useProgram(program);
                        gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
                        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
                        /*
                        gl.bindBuffer(gl.FRAMEBUFFER, buffer);
                        */
                        gl.viewport(0, 0, W, H);
                        /*
                        // draw first pass, the one which supposed to write data for the channel i
                        // it'll use fragment shader for bufferA
                        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
                        // pass texture as channel i
                        */
                        gl.activeTexture(gl.TEXTURE0 + i);
                        gl.bindTexture(gl.TEXTURE_2D, texture);
                        // draw second pass, the one with uses channel i
                        // There 're a lot of materials about rendering to texture, for example here.
                    }
                };
            };

            var vertex = createShader(glsl, glsl.vertexString, gl.VERTEX_SHADER);
            for (var key in buffers) {
                var buffer = buffers[key];
                var fragment = createShader(glsl, buffer.common + buffer.fragment, gl.FRAGMENT_SHADER);
                // If Fragment shader fails load a empty one to sign the error
                if (!fragment) {
                    fragment = createShader(glsl, 'void main(){\n\tgl_FragColor = vec4(1.0);\n}', gl.FRAGMENT_SHADER);
                    glsl.isValid = false;
                } else {
                    glsl.isValid = true;
                }
                // Create and use program
                var program = createProgram(glsl, [vertex, fragment]);
                buffer.program = program;

                // buffer.frame = createFrameBuffer(gl, i, glsl.canvas.width, glsl.canvas.height);
                buffer.bundle = gl.bundle(program, i, glsl.canvas.width, glsl.canvas.height);
                // console.log(i, key, buffer.common + buffer.fragment, buffer.bundle);

                // console.log('buffer', buffer);
                glsl.buffers[key] = buffer;
                // glsl.gl.useProgram(program);
                // Delete shaders
                gl.deleteShader(fragment);
                i++;
            }
            gl.deleteShader(vertex);
            /*
            gl.binder = function () {
                gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
                gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(0);
                return function (buffer) {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
                    // gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                };
            }();
            */
        }

        function loadUniforms(options) {
            if (options.textures) {
                for (var key in options.textures) {
                    glsl.uniformTexture('u_texture_' + key, options.textures[key], {
                        filtering: 'mipmap',
                        repeat: true,
                    });
                }
            }
        }

        function updateVariables() {
            var glsl = this,
                gl = glsl.gl;
            var date = new Date();
            var now = performance.now();
            glsl.variables = glsl.variables || {};
            glsl.variables.prev = glsl.variables.prev || now;
            glsl.variables.delta = (now - glsl.variables.prev) / 1000.0;
            glsl.variables.prev = now;
            glsl.variables.load = glsl.timeLoad;
            glsl.variables.time = (now - glsl.timeLoad) / 1000.0;
            glsl.variables.year = date.getFullYear();
            glsl.variables.month = date.getMonth();
            glsl.variables.date = date.getDate();
            glsl.variables.daytime = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() * 0.001;
        }

        function updateUniforms(program, key) {
            var glsl = this,
                gl = glsl.gl;

            /*
            // if (glsl.nDelta > 1) {
            // set the delta time uniform
            glsl.uniform(program, '1f', 'float', 'u_delta', glsl.variables.delta);
            // }
            */

            // if (glsl.nTime > 1) {
            // set the elapsed time uniform
            // var u_time = glsl.uniform(program, '1f', 'float', 'u_time', glsl.variables.time);
            gl.uniform1f(gl.getUniformLocation(program, 'u_time'), glsl.variables.time);
            // }

            /*
            // if (glsl.nDate) {
            // Set date uniform: year/month/day/time_in_sec
            glsl.uniform(program, '4f', 'float', 'u_date', glsl.variables.year, glsl.variables.month, glsl.variables.date, glsl.variables.daytime);
            // }
            */

            // set the resolution uniform
            // var u_reolution = glsl.uniform(program, '2f', 'vec2', 'u_resolution', glsl.canvas.width, glsl.canvas.height);
            gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), glsl.canvas.width, glsl.canvas.height);

            var i = 0;
            for (var p in glsl.buffers) {
                gl.uniform1i(gl.getUniformLocation(program, "u_buffer_" + i), i); // texture unit 0
                i++;
            }
            // console.log('updateUniforms', glsl.variables.time);

            /*
            glsl.texureIndex = 0;
            for (var key in glsl.textures) {
                glsl.uniformTexture(key, {
                    filtering: 'mipmap',
                    repeat: true,
                });
            }
            */

            /*
            var i = 0,
                au = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
            while (i < au) {
                var info = gl.getActiveUniform(program, i);
                console.log('info', key, info);
                i++;
            }
            console.log('status', key, 'link', gl.getProgramParameter(program, gl.LINK_STATUS), 'validate', gl.getProgramParameter(program, gl.VALIDATE_STATUS));
            */

            // console.log(key, 'u_time', u_time.location);

        }

        function uniform(program, method, type, name) {
            var glsl = this,
                gl = glsl.gl;
            var value = Array.prototype.slice.call(arguments).slice(3);
            glsl.uniforms = glsl.uniforms || {};
            glsl.uniforms[name] = glsl.uniforms[name] || {};
            var uniform = glsl.uniforms[name];
            var change = true; // isDiff(uniform.value, value);
            if (change || glsl.change || uniform.location === undefined || uniform.value === undefined) {
                uniform.name = name;
                uniform.value = value;
                uniform.type = type;
                uniform.method = 'uniform' + method;
                uniform.location = gl.getUniformLocation(program, name);
                gl[uniform.method].apply(gl, [uniform.location].concat(uniform.value));
            }
            return uniform;
        }

        function updateBuffers() {
            var glsl = this,
                gl = glsl.gl;
            if (glsl.buffers && Object.keys(glsl.buffers).length > 0) {
                for (var key in glsl.buffers) {
                    var buffer = glsl.buffers[key];
                    gl.useProgram(buffer.program);
                    glsl.updateUniforms(buffer.program, key);
                    buffer.bundle.link();
                    // gl.bindFramebuffer(gl.FRAMEBUFFER, buffer.bundle.buffer);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                }
                gl.useProgram(glsl.program);
                glsl.updateUniforms(glsl.program, 'main');
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            }
        }

        function render() {
            var glsl = this,
                gl = glsl.gl;
            glsl.visible = isCanvasVisible(glsl.canvas);
            glsl.animated = true;
            if (glsl.forceRender || (glsl.animated && glsl.visible && !glsl.paused)) {
                glsl.updateVariables();
                glsl.updateBuffers();
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                glsl.trigger('render', {});
                glsl.change = false;
                glsl.forceRender = false;
            }
        }

        function createShader(glsl, source, type) {
            var gl = glsl.gl;
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (!compiled) {
                var lastError = gl.getShaderInfoLog(shader);
                console.error('*** Error compiling shader ' + shader + ':' + lastError);
                glsl.trigger('error', {
                    shader: shader,
                    source: source,
                    type: type,
                    error: lastError
                });
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }

        function createProgram(glsl, shaders, optAttribs, optLocations) {
            var gl = glsl.gl;
            var i;
            var program = gl.createProgram();
            for (i = 0; i < shaders.length; ++i) {
                gl.attachShader(program, shaders[i]);
            }
            if (optAttribs) {
                for (i = 0; i < optAttribs.length; ++i) {
                    gl.bindAttribLocation(program, optLocations ? optLocations[i] : i, optAttribs[i]);
                }
            }
            gl.linkProgram(program);
            var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (!linked) {
                var lastError = gl.getProgramInfoLog(program);
                console.log('Error in program linking:' + lastError);
                gl.deleteProgram(program);
                return null;
            }
            return program;
        }

        function isCanvasVisible(canvas) {
            return ((canvas.getBoundingClientRect().top + canvas.height) > 0) && (canvas.getBoundingClientRect().top < (window.innerHeight || document.documentElement.clientHeight));
        }

        return GlslCanvasWrapper;

    }();

    var options = window.options = {
        vertex: '',
        fragment: '',
        main: '',
        buffers: {},
    };

    function init() {
        getResource("shaders/buffers.glsl", function (fragment) {
            // (?<=\/{2} u_buffer_)(\d+).*((.|\n)*?)(?=\/{2} [u_buffer|main]|\z)
            // (?<=\/{2} main).*((.|\n)*?)(?=\/{2} u_buffer|\z)
            fragment = fragment.replace(new RegExp('(/{2} u_buffer_)(\\d+).*((.|\\n)*?)(?=/{2} [u_buffer|main]|\\z)', 'g'), function (match, name, i, fragment) {
                // console.log('u_buffer_.replace', arguments);
                options.buffers['u_buffer_' + i] = {
                    fragment: fragment,
                };
                return '';
            });

            fragment = fragment.replace(new RegExp('(/{2} main).*((.|\\n)*)(?=/{2} u_buffer|$)', 'g'), function (match, name, main) {
                options.main = main;
                return '';
            });

            // console.log('getResource', fragment, options.buffers);
            for (var key in options.buffers) {
                options.buffers[key].common = fragment;
            }

            options.fragment = fragment + (options.main || '');
            // console.log('fragment', options.fragment);
            createCanvas();
        });
    }

    function createCanvas() {
        var content = document.querySelector('.content');
        var canvas = document.querySelector('.shader');

        resize(true);

        var glsl = new GlslCanvasWrapper(canvas, {
            premultipliedAlpha: false,
            preserveDrawingBuffer: true,
            backgroundColor: 'rgba(1,1,1,1)',
        });
        glsl.animated = true;
        glsl.on('error', onGlslError);
        glsl.on('render', function () {
            glsl.forceRender = true;
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
            glsl.load(options.fragment, options.vertex);
            glsl.loadBuffers(options.buffers);
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

        window.addEventListener('resize', onResize);

        resize();
    }

    function onGlslError(message) {
        console.log('onGlslError.error', message.error);
        var options = window.options;
        var errors = [],
            warnings = [];
        message.error.replace(/ERROR: \d+:(\d+): \'(.+)\' : (.+)/g, function (m, l, v, t) {
            var message = 'ERROR (' + v + ') ' + t;
            var li = '<li><a class="error" unselectable href="' + encodeURI('command:glsl-canvas.revealGlslLine?' + JSON.stringify([options.uri, Number(l), message])) + '"><span class="line">ERROR line ' + Number(l) + '</span> <span class="value" title="' + v + '">' + v + '</span> <span class="text" title="' + t + '">' + t + '</span></a></li>';
            errors.push(li);
            return li;
        });
        message.error.replace(/WARNING: \d+:(\d+): \'(.*\n*|.*|\n*)\' : (.+)/g, function (m, l, v, t) {
            var li = '<li><a class="warning" unselectable href="' + encodeURI('command:glsl-canvas.revealGlslLine?' + JSON.stringify([options.uri, Number(l), message])) + '"><span class="line">WARN line ' + Number(l) + '</span> <span class="text" title="' + t + '">' + t + '</span></a></li>';
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

    window.addEventListener('load', init);

}());