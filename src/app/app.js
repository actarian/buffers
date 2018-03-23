/* global window, document, console, GlslCanvas, CaptureService, GuiService, TrailsService, CameraService, Stats, dat */

(function () {
    'use strict';

    var GlslCanvasWrapper = function () {

        function GlslCanvasWrapper(canvas, options) {
            return new GlslCanvas(canvas, options);
        }

        GlslCanvas.prototype.TEXTURE_COUNT = 0;
        GlslCanvas.prototype.BUFFER_COUNT = 0;
        GlslCanvas.prototype.createBuffer = createBuffer;
        GlslCanvas.prototype.createSwappableBuffer = createSwappableBuffer;
        GlslCanvas.prototype.loadBuffers = loadBuffers;
        GlslCanvas.prototype.loadUniforms = loadUniforms;
        GlslCanvas.prototype.updateVariables = updateVariables;
        GlslCanvas.prototype.UpdateUniforms = UpdateUniforms;
        GlslCanvas.prototype.resizeBuffers = resizeBuffers;
        GlslCanvas.prototype.renderGl = renderGl;
        GlslCanvas.prototype.render = render;

        var _setMouse = GlslCanvas.prototype.setMouse;
        GlslCanvas.prototype.setMouse = setMouse;

        var _resize = GlslCanvas.prototype.resize;
        GlslCanvas.prototype.resize = resize;

        // GlslCanvas.prototype.uniform = uniform;

        function createBuffer(W, H, program) {
            var glsl = this,
                gl = glsl.gl,
                index = glsl.TEXTURE_COUNT + glsl.BUFFER_COUNT;
            glsl.BUFFER_COUNT++;
            var texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + index);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            var buffer = gl.createFramebuffer();
            // gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
            /*
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            gl.viewport(0, 0, W, H);
            gl.clear(gl.COLOR_BUFFER_BIT);
            */
            console.log('createBuffer', index);
            return {
                index: index,
                texture: texture,
                buffer: buffer,
            };
        }

        function createSwappableBuffer(W, H, program) {
            var glsl = this,
                gl = glsl.gl;
            var input = glsl.createBuffer(W, H, program);
            var output = glsl.createBuffer(W, H, program);
            return {
                input: input,
                output: output,
                swap: function () {
                    var temp = input;
                    input = output;
                    output = temp;
                    this.input = input;
                    this.output = output;
                },
                render: function (W, H, program, name) {
                    gl.useProgram(program);
                    // gl.uniform1i(gl.getUniformLocation(program, name), input.index); // removable
                    gl.viewport(0, 0, W, H); // removable
                    gl.bindFramebuffer(gl.FRAMEBUFFER, input.buffer);
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output.texture, 0);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                    /*
                    gl.activeTexture(gl.TEXTURE0 + input.index);
                    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, W, H, 0);
                    */
                    // gl.activeTexture(gl.TEXTURE0 + output.index);
                    // gl.clear(gl.COLOR_BUFFER_BIT);
                    /*
                    gl.uniform1i(gl.getUniformLocation(program, name), output.index);
                    gl.bindFramebuffer(gl.FRAMEBUFFER, output.buffer);
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, input.texture, 0);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                    this.swap();
                    */
                },
            };
        }

        function loadBuffers(buffers) {
            var glsl = this,
                gl = glsl.gl,
                i = 0;
            glsl.buffers = {};
            var vertex = createShader(glsl, glsl.vertexString, gl.VERTEX_SHADER);
            for (var key in buffers) {
                var buffer = buffers[key];
                var fragment = createShader(glsl, buffer.common + buffer.fragment, gl.FRAGMENT_SHADER);
                if (!fragment) {
                    fragment = createShader(glsl, 'void main(){\n\tgl_FragColor = vec4(1.0);\n}', gl.FRAGMENT_SHADER);
                    glsl.isValid = false;
                } else {
                    glsl.isValid = true;
                }
                var program = createProgram(glsl, [vertex, fragment]);
                buffer.name = 'u_buffer_' + i;
                buffer.program = program;
                buffer.bundle = glsl.createSwappableBuffer(glsl.canvas.width, glsl.canvas.height, program);
                // console.log(i, key, buffer.common + buffer.fragment, buffer.bundle);
                glsl.buffers[key] = buffer;
                gl.deleteShader(fragment);
                i++;
            }
            gl.deleteShader(vertex);
        }

        function _loadBuffers(buffers) {
            var glsl = this,
                gl = glsl.gl,
                i = 0;
            glsl.buffers = {};
            gl.bundle = function (program, i, W, H) {
                gl.useProgram(program);
                var textureOut = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0 + i * 2); //           <-- out activate
                gl.bindTexture(gl.TEXTURE_2D, textureOut);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                var textureIn = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0 + i * 2 + 1); //       <-- in activate
                gl.bindTexture(gl.TEXTURE_2D, textureIn);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                var buffer = gl.createFramebuffer();
                return {
                    textureIn: textureIn,
                    textureOut: textureOut,
                    render: function (W, H) {
                        gl.useProgram(program);
                        gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
                        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureOut, 0);
                        gl.activeTexture(gl.TEXTURE0 + i * 2); //           <-- out activate
                        gl.bindTexture(gl.TEXTURE_2D, textureOut); //       <-- out bind
                        gl.viewport(0, 0, W, H);
                        gl.drawArrays(gl.TRIANGLES, 0, 6); //               <-- out draw
                        gl.activeTexture(gl.TEXTURE0 + i * 2 + 1); //                   <-- in activate
                        gl.bindTexture(gl.TEXTURE_2D, textureIn); //                    <-- in bind
                        gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, W, H, 0); // <-- in copy                        
                    }
                };
            };

            var vertex = createShader(glsl, glsl.vertexString, gl.VERTEX_SHADER);
            for (var key in buffers) {
                var buffer = buffers[key];
                var fragment = createShader(glsl, buffer.common + buffer.fragment, gl.FRAGMENT_SHADER);
                if (!fragment) {
                    fragment = createShader(glsl, 'void main(){\n\tgl_FragColor = vec4(1.0);\n}', gl.FRAGMENT_SHADER);
                    glsl.isValid = false;
                } else {
                    glsl.isValid = true;
                }
                var program = createProgram(glsl, [vertex, fragment]);
                buffer.program = program;
                buffer.bundle = gl.bundle(program, i, glsl.canvas.width, glsl.canvas.height);
                // console.log(i, key, buffer.common + buffer.fragment, buffer.bundle);
                glsl.buffers[key] = buffer;
                gl.deleteShader(fragment);
                i++;
            }
            gl.deleteShader(vertex);
        }

        function resize() {
            var glsl = this;
            var flag = _resize.apply(glsl);
            /*
            if (flag) {
                glsl.resizeBuffers();
            }
            */
            return flag;
        }

        function resizeBuffers() {
            var glsl = this,
                gl = glsl.gl;
            if (glsl.buffers && Object.keys(glsl.buffers).length > 0) {
                var i = 0,
                    W = gl.canvas.width,
                    H = gl.canvas.height;
                gl.viewport(0, 0, W, H);
                for (var key in glsl.buffers) {
                    var buffer = glsl.buffers[key];
                    gl.useProgram(buffer.program);
                    // 
                    gl.activeTexture(gl.TEXTURE0 + i * 2);
                    gl.bindTexture(gl.TEXTURE_2D, buffer.bundle.textureOut);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                    // 
                    gl.activeTexture(gl.TEXTURE0 + i * 2 + 1);
                    gl.bindTexture(gl.TEXTURE_2D, buffer.bundle.textureIn);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                    i++;
                }
                gl.useProgram(glsl.program);
            }
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

        function setMouse(mouse) {
            // _setMouse(mouse);
            var glsl = this,
                gl = glsl.gl;
            var rect = this.canvas.getBoundingClientRect();
            if (mouse && mouse.x && mouse.x >= rect.left && mouse.x <= rect.right && mouse.y && mouse.y >= rect.top && mouse.y <= rect.bottom) {
                var x = mouse.x - rect.left;
                var y = this.canvas.height - (mouse.y - rect.top);
                // this.uniform('2f', 'vec2', 'u_mouse', x, y);
                if (glsl.buffers && Object.keys(glsl.buffers).length > 0) {
                    for (var key in glsl.buffers) {
                        var buffer = glsl.buffers[key];
                        gl.useProgram(buffer.program);
                        gl.uniform2f(gl.getUniformLocation(buffer.program, 'u_mouse'), x, y);
                    }
                }
                gl.useProgram(glsl.program);
                gl.uniform2f(gl.getUniformLocation(glsl.program, 'u_mouse'), x, y);
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

        function UpdateUniforms(program, key) {
            var glsl = this,
                gl = glsl.gl;

            gl.useProgram(program);

            gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), glsl.canvas.width, glsl.canvas.height);

            if (glsl.nTime > 1) {
                gl.uniform1f(gl.getUniformLocation(program, 'u_time'), glsl.variables.time);
            }

            if (glsl.nDelta > 1) {
                gl.uniform1f(gl.getUniformLocation(program, 'u_delta'), glsl.variables.delta);
            }

            if (glsl.nDate) {
                // Set date uniform: year/month/day/time_in_sec
                gl.uniform4f(gl.getUniformLocation(program, 'u_date'), glsl.variables.year, glsl.variables.month, glsl.variables.date, glsl.variables.daytime);
            }

            /*
            glsl.texureIndex = 0;
            for (var key in glsl.textures) {
                glsl.uniformTexture(key, {
                    filtering: 'mipmap',
                    repeat: true,
                });
            }
            */

            for (var key in glsl.buffers) {
                var buffer = glsl.buffers[key];
                gl.uniform1i(gl.getUniformLocation(program, buffer.name), buffer.bundle.input.index);
            }

            /*
            var i = 0;
            for (var key in glsl.buffers) {
                program.buffers = program.buffers || {};
                if (!program.buffers["u_buffer_" + i]) {
                    program.buffers["u_buffer_" + i] = true;
                    gl.uniform1i(gl.getUniformLocation(program, "u_buffer_" + i), i * 2 + 1);
                }
                i++;
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

        function renderGl() {
            var glsl = this,
                gl = glsl.gl,
                W = gl.canvas.width,
                H = gl.canvas.height;
            glsl.updateVariables();
            gl.viewport(0, 0, W, H);
            if (glsl.buffers && Object.keys(glsl.buffers).length > 0) {
                for (var key in glsl.buffers) {
                    var buffer = glsl.buffers[key];
                    glsl.UpdateUniforms(buffer.program, key);
                    buffer.bundle.render(W, H, buffer.program, buffer.name);
                    // buffer.program.blit(buffer.bundle.output.buffer);
                    buffer.bundle.swap();
                }
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }
            glsl.UpdateUniforms(glsl.program, 'main');
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        function render() {
            var glsl = this,
                gl = glsl.gl;
            glsl.visible = isCanvasVisible(glsl.canvas);
            // glsl.animated = true;
            if (glsl.forceRender || (glsl.animated && glsl.visible && !glsl.paused)) {
                glsl.renderGl();
                glsl.change = false;
                glsl.forceRender = false;
                glsl.trigger('render', {});
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
            /*
            program.blit = function () {
                gl.useProgram(program);
                gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
                gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(0);
                return function (destination) {
                    gl.useProgram(program);
                    gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
                    // gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                };
            }();
            */
            /*
            var numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
            for (var i = 0; i < numAttribs; ++i) {
                var attribInfo = gl.getActiveAttrib(program, i);
                if (!attribInfo) {
                    break;
                }
                console.log(gl.getAttribLocation(program, attribInfo.name), attribInfo.name);
            }
            */
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
        getResource("shaders/buffers/milk.glsl", function (fragment) {
            // (?<=\/{2} u_buffer_)(\d+).*((.|\n)*?)(?=\/{2} [u_buffer|main]|\z)
            // (?<=\/{2} main).*((.|\n)*?)(?=\/{2} u_buffer|\z)
            fragment = fragment.replace(new RegExp('(/{2} u_buffer_)(\\d+).*((.|\\n)*?)(?=/{2} u_buffer|/{2} main|$)', 'g'), function (match, name, i, fragment) {
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