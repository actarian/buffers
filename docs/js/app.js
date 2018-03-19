/* global window, document, console, GlslCanvas, CaptureService, GuiService, TrailsService, CameraService, Stats, dat */

(function () {
    'use strict';

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
            fragment = fragment.replace(new RegExp('(/{2} u_buffer_)(\\d+).*((.|\\n)*?)(?=/{2} [u_buffer|main]|\\z)', 'g'), function (match, name, index, fragment) {
                // console.log('u_buffer_.replace', arguments);
                options.buffers['u_buffer_' + index] = {
                    fragment: fragment,
                };
                return '';
            });

            console.log('fragment-------', fragment);

            fragment = fragment.replace(new RegExp('(/{2} main)((.|\\n)*?)(?=/{2} u_buffer|\\z)', 'g'), function (match, name, main) {
                console.log('main.replace---------', arguments);
                options.main = main;
                return '';
            });

            console.log('getResource-------', fragment, options.buffers);
            for (var key in options.buffers) {
                options.buffers[key].common = fragment;
            }

            options.fragment = fragment + (options.main || '');
            createCanvas();
        });
    }

    function createCanvas() {
        var content = document.querySelector('.content');
        var canvas = document.querySelector('.shader');

        resize(true);

        var glsl = new GlslCanvas(canvas, {
            premultipliedAlpha: false,
            preserveDrawingBuffer: true,
            backgroundColor: 'rgba(1,1,1,1)',
        });
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
            if (options.textures) {
                for (var t in options.textures) {
                    glsl.uniformTexture('u_texture_' + t, options.textures[t], {
                        filtering: 'mipmap',
                        repeat: true,
                    });
                }
            }
            console.log('glsl', glsl);
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

        function GlslCanvasWrapper() {
            return GlslCanvas();
        }

        GlslCanvas.prototype.render = render;
        GlslCanvas.prototype.loadBuffers = loadBuffers;

        function createFrameBuffer(gl, index, W, H, internalFormat, format, type, param) {
            gl.activeTexture(gl.TEXTURE0 + index);
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, W, H, 0, format, type, null);
            var frameBuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            gl.viewport(0, 0, W, H);
            gl.clear(gl.COLOR_BUFFER_BIT);
            return [texture, frameBuffer, index];
        }

        function loadBuffers(buffers) {
            var glsl = this,
                gl = glsl.gl;
            glsl.buffers = {};
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
                    buffer.frame = createFrameBuffer(gl, i, glsl.canvas.width, glsl.canvas.height, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST);
                }
                // Create and use program
                var program = createProgram(glsl, [vertex, fragment]);
                buffer.program = program;
                console.log('buffer', buffer);
                glsl.buffers[key] = buffer;
                // glsl.gl.useProgram(program);
                // Delete shaders
                gl.deleteShader(fragment);
            }
            gl.deleteShader(vertex);
            gl.binder = function () {
                gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
                gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(0);
                return function (destination) {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
                    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
                };
            }();
        }

        function render() {
            var glsl = this,
                gl = glsl.gl;

            glsl.visible = isCanvasVisible(glsl.canvas);
            if (glsl.forceRender || (glsl.animated && glsl.visible && !glsl.paused)) {
                var date = new Date();
                var now = performance.now();
                glsl.timeDelta = (now - glsl.timePrev) / 1000.0;
                glsl.timePrev = now;
                if (glsl.nDelta > 1) {
                    // set the delta time uniform
                    glsl.uniform('1f', 'float', 'u_delta', glsl.timeDelta);
                }

                if (glsl.nTime > 1) {
                    // set the elapsed time uniform
                    glsl.uniform('1f', 'float', 'u_time', (now - glsl.timeLoad) / 1000.0);
                }

                if (glsl.nDate) {
                    // Set date uniform: year/month/day/time_in_sec
                    glsl.uniform('4f', 'float', 'u_date', date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() * 0.001);
                }

                // set the resolution uniform
                glsl.uniform('2f', 'vec2', 'u_resolution', glsl.canvas.width, glsl.canvas.height);

                glsl.texureIndex = 0;
                for (var tex in glsl.textures) {
                    glsl.uniformTexture(tex);
                }

                // TODO RENDER MULTIPLE BUFFERS            
                if (glsl.buffers && Object.keys(glsl.buffers).length > 0) {
                    for (var key in glsl.buffers) {
                        var buffer = glsl.buffers[key];
                        glsl.uniformTexture(key, buffer.frame[0], {
                            filtering: 'mipmap',
                            repeat: true,
                        });
                        gl.useProgram(buffer.program);
                        gl.binder(buffer.frame);
                    }
                    gl.useProgram(glsl.program);
                }

                // Draw the rectangle.
                gl.drawArrays(gl.TRIANGLES, 0, 6);

                // Trigger event
                glsl.trigger('render', {});

                glsl.change = false;
                glsl.forceRender = false;

                /*
                // Shadertoy uses technique called rendering to texture. Suppose gl is our WebGL context. First we need to create a texture first pass will draw to:
                // desired size of the texture
                var W = glsl.canvas.width,
                    H = glsl.canvas.height;

                var textureBuffer0 = gl.createTexture();
                var frameBuffer0 = gl.createFramebuffer();
                var u_buffer_0 = gl.getUniformLocation(glsl.program, "u_buffer_0");

                gl.bindTexture(gl.TEXTURE_2D, textureBuffer0);
                // allocate texture data.
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                // may be change texture parameters (at least magnification and
                // minification filters since we won't render mip levels.
                // Then we create framebuffer object so we can draw to our texture:
                gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer0);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureBuffer0, 0);
                // Now we can draw:
                gl.bindBuffer(gl.FRAMEBUFFER, frameBuffer0);
                gl.viewport(0, 0, W, H);
                // draw first pass, the one which supposed to write data for the channel 0
                // it'll use fragment shader for bufferA
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
                // pass textureBuffer0 as channel 0
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, textureBuffer0);
                gl.uniform1i(u_buffer_0, 0);
                // draw second pass, the one with uses channel 0
                // There 're a lot of materials about rendering to texture, for example here.
                */
            }
        }

        function createShader(glsl, source, type) {
            var gl = glsl.gl;
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (!compiled) {
                // Something went wrong during compilation; get the error
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
            var ii;
            var program = gl.createProgram();
            for (ii = 0; ii < shaders.length; ++ii) {
                gl.attachShader(program, shaders[ii]);
            }
            if (optAttribs) {
                for (ii = 0; ii < optAttribs.length; ++ii) {
                    gl.bindAttribLocation(
                        program,
                        optLocations ? optLocations[ii] : ii,
                        optAttribs[ii]);
                }
            }
            gl.linkProgram(program);
            // Check the link status
            var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (!linked) {
                // something went wrong with the link
                lastError = gl.getProgramInfoLog(program);
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

}());