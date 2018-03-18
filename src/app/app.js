/* global window, document, console, GlslCanvas, CaptureService, GuiService, TrailsService, CameraService, Stats, dat */

(function () {
    'use strict';

    //          (?<=\/{2} u_buffer_)(\d).*((.|\n)*?)\/{2} [u_buffer|main]|\z
    //          (?<=\/{2} main).*((.|\n)*?)\/{2} u_buffer|\z

    window.options = {
        vertex: '',
        fragment: document.getElementById('fragment').innerHTML,
    };

    function onLoad() {
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
            var o = window.options;
            document.querySelector('.errors').setAttribute('class', 'errors');
            document.querySelector('.welcome').setAttribute('class', 'welcome');
            o.vertex = o.vertex.trim().length > 0 ? o.vertex : null;
            o.fragment = o.fragment.trim().length > 0 ? o.fragment : null;
            if (o.fragment || o.vertex) {
                document.querySelector('body').setAttribute('class', 'ready');
            } else {
                document.querySelector('body').setAttribute('class', 'empty');
            }
            glsl.load(o.fragment, o.vertex);
            if (o.textures) {
                for (var t in o.textures) {
                    glsl.uniformTexture('u_texture_' + t, o.textures[t], {
                        filtering: 'mipmap',
                        repeat: true,
                    });
                }
            }
            console.log('glsl', glsl);
            /*
            gui.load(o.uniforms);
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

    window.addEventListener('load', onLoad);

}());

/*

Shadertoy uses technique called rendering to texture. Suppose gl is our WebGL context. First we need to create a texture first pass will draw to:

// desired size of the texture
const W = 800, H = 600;
const textureA = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, textureA);
// allocate texture data.
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
// may be change texture parameters (at least magnification and
// minification filters since we won't render mip levels.
Then we create framebuffer object so we can draw to our texture:

const framebufferA = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferA);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureA, 0);
Now we can draw:

gl.bindBuffer(gl.FRAMEBUFFER, framebufferA);
gl.viewport(0, 0, W, H);

// draw first pass, the one which supposed to write data for the channel 0
// it'll use fragment shader for bufferA

gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

// pass textureA as channel 0
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, textureA);
gl.uniform1i(channel0Uniform, 0);

// draw second pass, the one with uses channel 0
There're a lot of materials about rendering to texture, for example here.

*/