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
        GlslCanvas.prototype.load = load;
        GlslCanvas.prototype.loadBuffers = loadBuffers;
        GlslCanvas.prototype.loadUniforms = loadUniforms;
        GlslCanvas.prototype.updateVariables = updateVariables;
        GlslCanvas.prototype.UpdateUniforms = UpdateUniforms;
        GlslCanvas.prototype.resizeSwappableBuffers = resizeSwappableBuffers;
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
            var float_texture_ext = gl.getExtension('OES_texture_float');
            var texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + index);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.FLOAT, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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
                resize: resize,
                W: W,
                H: H,
            };
            function resize(W, H) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
                var minW = Math.min(W, this.W);
                var minH = Math.min(H, this.H);
                var pixels = new Float32Array(minW * minH * 4);
                gl.readPixels(0, 0, minW, minH, gl.RGBA, gl.FLOAT, pixels);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                // create new texture;
                var newIndex = glsl.TEXTURE_COUNT + glsl.BUFFER_COUNT;
                // glsl.BUFFER_COUNT++; // reuse index
                var newTexture = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0 + newIndex);
                gl.bindTexture(gl.TEXTURE_2D, newTexture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.FLOAT, null);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                // copy
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, minW, minH, gl.RGBA, gl.FLOAT, pixels);
                //
                var newBuffer = gl.createFramebuffer();
                //
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.deleteTexture(texture);
                //
                gl.activeTexture(gl.TEXTURE0 + index);
                gl.bindTexture(gl.TEXTURE_2D, newTexture);
                index = this.index = index;
                texture = this.texture = newTexture;
                buffer = this.buffer = newBuffer;
                this.W = W;
                this.H = H;
                console.log(index, W, H);
                /*
                gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, W, H, 0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, W, H, 0);
                //
                gl.bindFramebuffer(gl.FRAMEBUFFER, newBuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, newTexture, 0);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                */
                /*
                var v = [0, 0, Math.min(this.mXres, oldXres), Math.min(this.mYres, oldYres)];
                this.mRenderer.SetBlend(false);
                this.mRenderer.SetViewport(v);
                this.mRenderer.AttachShader(this.mProgramCopy);
                var l1 = this.mRenderer.GetAttribLocation(this.mProgramCopy, "pos");
                var vOld = [0, 0, oldXres, oldYres];
                this.mRenderer.SetShaderConstant4FV("v", vOld);

                // Resize each double buffer
                var texture1 = this.mRenderer.CreateTexture(this.mRenderer.TEXTYPE.T2D, this.mXres, this.mYres, this.mRenderer.TEXFMT.C4F32, (needCopy) ? this.mBuffers[i].mTexture[0].mFilter : this.mRenderer.FILTER.NONE, (needCopy) ? this.mBuffers[i].mTexture[0].mWrap : this.mRenderer.TEXWRP.CLAMP, null);
                var target1 = this.mRenderer.CreateRenderTarget(texture1, null, null, null, null, false);

                // Copy old buffers 1 to new buffer
                this.mRenderer.SetRenderTarget(target1);
                this.mRenderer.AttachTextures(1, this.mBuffers[i].mTexture[0], null, null, null);
                this.mRenderer.DrawUnitQuad_XY(l1);
                mGL.bindBuffer(mGL.ARRAY_BUFFER, mVBO_Quad);
                mGL.vertexAttribPointer(vpos, 2, mGL.FLOAT, false, 0, 0);
                mGL.enableVertexAttribArray(vpos);
                mGL.drawArrays(mGL.TRIANGLES, 0, 6);
                mGL.disableVertexAttribArray(vpos);
                mGL.bindBuffer(mGL.ARRAY_BUFFER, null);
                // Deallocate old memory
                this.mRenderer.DestroyTexture(this.mBuffers[i].mTexture[0]);
                this.mRenderer.DestroyRenderTarget(this.mBuffers[i].mTarget[0]);
                // Store new buffers
                this.mBuffers[i].mTexture = [texture1, texture2],
                    this.mBuffers[i].mTarget = [target1, target2],
                    this.mBuffers[i].mLastRenderDone = 0;
                this.mRenderer.DettachTextures();
                this.mRenderer.DetachShader();
                this.mRenderer.SetRenderTarget(null);
                */
            }
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
                    // gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, input.texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RGBA, gl.FLOAT, null);
                    */
                    // gl.bindTexture(gl.TEXTURE_2D, null);
                    // this.swap();

                    /*
                    var id = inp.id;
                    texID[i] = buffers[id].mTexture[buffers[id].mLastRenderDone];
                    resos[3 * i + 0] = xres;
                    resos[3 * i + 1] = yres;
                    resos[3 * i + 2] = 1;
                    // hack. in webgl2.0 we have samplers, so we don't need this crap here
                    var filter = this.mRenderer.FILTER.NONE;
                    if (inp.mInfo.mSampler.filter === "linear") filter = this.mRenderer.FILTER.LINEAR;
                    else if (inp.mInfo.mSampler.filter === "mipmap") filter = this.mRenderer.FILTER.MIPMAP;
                    this.mRenderer.SetSamplerFilter(texID[i], filter);
                    this.mTextureCallbackFun(this.mTextureCallbackObj, i, { texture: inp.image, data: buffers[id].mThumbnailBuffer }, false, 9, 1, -1, this.mID);
                    this.mRenderer.AttachTextures(4, texID[0], texID[1], texID[2], texID[3]);
                    */

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
                    */
                },
                resize: function (W, H, program, name) {
                    gl.useProgram(program);
                    gl.viewport(0, 0, W, H); // removable
                    this.input.resize(W, H);
                    this.output.resize(W, H);
                },
            };
        }

        function resizeSwappableBuffers() {
            var glsl = this,
                gl = glsl.gl;
            if (glsl.buffers && Object.keys(glsl.buffers).length > 0) {
                var i = 0,
                    W = gl.canvas.width,
                    H = gl.canvas.height;
                gl.viewport(0, 0, W, H);
                for (var key in glsl.buffers) {
                    var buffer = glsl.buffers[key];
                    buffer.bundle.resize(W, H, buffer.program, buffer.name);
                    /*
                    gl.useProgram(buffer.program);
                    // 
                    gl.activeTexture(gl.TEXTURE0 + i * 2);
                    gl.bindTexture(gl.TEXTURE_2D, buffer.bundle.textureOut);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                    // 
                    gl.activeTexture(gl.TEXTURE0 + i * 2 + 1);
                    gl.bindTexture(gl.TEXTURE_2D, buffer.bundle.textureIn);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                    */
                    i++;
                }
                gl.useProgram(glsl.program);
            }
        }

        /*
        function resizeSwappableBuffer(oldXres, oldYres) {
            var needCopy = (oldXres !== null && oldYres !== null);
            // first time!
            if (!needCopy) {
                var thumnailRes = [256, 128];
                for (var i = 0; i < this.mMaxBuffers; i++) {
                    this.mBuffers[i] = {
                        mTexture: [null, null],
                        mTarget: [null, null],
                        mLastRenderDone: 0,
                        mThumbnailRenderTarget: null,//thumbnailRenderTarget,
                        mThumbnailTexture: null,//thumbnailTexture,
                        mThumbnailBuffer: null,//thumbnailBuffer,
                        mThumbnailRes: thumnailRes
                    };
                }
            }

            // Prepare for rendering
            if (needCopy) {
                var v = [0, 0, Math.min(this.mXres, oldXres), Math.min(this.mYres, oldYres)];
                this.mRenderer.SetBlend(false);
                this.mRenderer.SetViewport(v);
                this.mRenderer.AttachShader(this.mProgramCopy);
                var l1 = this.mRenderer.GetAttribLocation(this.mProgramCopy, "pos");
                var vOld = [0, 0, oldXres, oldYres];
                this.mRenderer.SetShaderConstant4FV("v", vOld);
            }

            // Resize each double buffer
            for (var i = 0; i < this.mMaxBuffers; i++) {
                var texture1 = this.mRenderer.CreateTexture(this.mRenderer.TEXTYPE.T2D,
                    this.mXres, this.mYres,
                    this.mRenderer.TEXFMT.C4F32,
                    (needCopy) ? this.mBuffers[i].mTexture[0].mFilter : this.mRenderer.FILTER.NONE,
                    (needCopy) ? this.mBuffers[i].mTexture[0].mWrap : this.mRenderer.TEXWRP.CLAMP,
                    null);
                var target1 = this.mRenderer.CreateRenderTarget(texture1, null, null, null, null, false);

                var texture2 = this.mRenderer.CreateTexture(this.mRenderer.TEXTYPE.T2D,
                    this.mXres, this.mYres,
                    this.mRenderer.TEXFMT.C4F32,
                    (needCopy) ? this.mBuffers[i].mTexture[1].mFilter : this.mRenderer.FILTER.NONE,
                    (needCopy) ? this.mBuffers[i].mTexture[1].mWrap : this.mRenderer.TEXWRP.CLAMP,
                    null);

                var target2 = this.mRenderer.CreateRenderTarget(texture2, null, null, null, null, false);

                if (needCopy) {
                    // Copy old buffers 1 to new buffer
                    this.mRenderer.SetRenderTarget(target1);
                    this.mRenderer.AttachTextures(1, this.mBuffers[i].mTexture[0], null, null, null);
                    this.mRenderer.DrawUnitQuad_XY(l1);

                    // Copy old buffers 2 to new buffer
                    this.mRenderer.SetRenderTarget(target2);
                    this.mRenderer.AttachTextures(1, this.mBuffers[i].mTexture[1], null, null, null);
                    this.mRenderer.DrawUnitQuad_XY(l1);

                    // Deallocate old memory
                    this.mRenderer.DestroyTexture(this.mBuffers[i].mTexture[0]);
                    this.mRenderer.DestroyRenderTarget(this.mBuffers[i].mTarget[0]);
                    this.mRenderer.DestroyTexture(this.mBuffers[i].mTexture[1]);
                    this.mRenderer.DestroyRenderTarget(this.mBuffers[i].mTarget[1]);
                    //this.mRenderer.DestroyTexture(this.mBuffers[i].thumbnailTexture);
                }
                // Store new buffers
                this.mBuffers[i].mTexture = [texture1, texture2],
                    this.mBuffers[i].mTarget = [target1, target2],
                    this.mBuffers[i].mLastRenderDone = 0;
            }

            if (needCopy) {
                this.mRenderer.DettachTextures();
                this.mRenderer.DetachShader();
                this.mRenderer.SetRenderTarget(null);
            }

        }

        function CreateTexture(type, xres, yres, format, filter, wrap, buffer) {
            var glsl = this,
                gl = glsl.gl;
            var LEN = gl.UNSIGNED_BYTE; // 16
            // var LEN = gl.FLOAT; // 32;

            var id = gl.createTexture();
            var glFoTy = iFormatPI2GL(format);
            var glWrap = gl.REPEAT;
            if (wrap === me.TEXWRP.CLAMP) {
                glWrap = gl.CLAMP_TO_EDGE;
            }
            if (type === me.TEXTYPE.T2D) {
                gl.bindTexture(gl.TEXTURE_2D, id);
                //if (buffer==null)
                //gl.texStorage2D(gl.TEXTURE_2D, 0, gl.RGBA, xres, yres);
                //else
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, xres, yres, 0, gl.RGBA, LEN, buffer);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, glWrap);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, glWrap);
                if (filter === me.FILTER.NONE) {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                } else if (filter === me.FILTER.LINEAR) {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                } else if (filter === me.FILTER.MIPMAP) {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                    gl.generateMipmap(gl.TEXTURE_2D);
                } else {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
                    gl.generateMipmap(gl.TEXTURE_2D);
                }
                gl.bindTexture(gl.TEXTURE_2D, null);
            } else if (type === me.TEXTYPE.T3D) {
                if (mIs20) {
                    gl.bindTexture(gl.TEXTURE_3D, id);
                    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
                    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, Math.log2(xres));
                    if (filter === me.FILTER.NONE) {
                        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    } else if (filter === me.FILTER.LINEAR) {
                        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    } else if (filter === me.FILTER.MIPMAP) {
                        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                    } else {
                        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
                        gl.generateMipmap(gl.TEXTURE_3D);
                    }
                    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA, xres, yres, yres, 0, gl.RGBA, LEN, buffer);
                    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, glWrap);
                    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, glWrap);
                    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, glWrap);
                    if (filter === me.FILTER.MIPMAP) {
                        gl.generateMipmap(gl.TEXTURE_3D);
                    }
                    gl.bindTexture(gl.TEXTURE_3D, null);
                } else {
                    return null;
                }
            } else {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, id);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
            }
            return { mObjectID: id, mXres: xres, mYres: yres, mFormat: format, mType: type, mFilter: filter, mWrap: wrap, mVFlip: false };
        };

        function CreateRenderTarget(color0, color1, color2, color3, depth, wantZbuffer) {
            var id = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, id);
            if (depth === null) {
                if (wantZbuffer === true) {
                    var zb = gl.createRenderbuffer();
                    gl.bindRenderbuffer(gl.RENDERBUFFER, zb);
                    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, color0.mXres, color0.mYres);

                    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, zb);
                }
            } else {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth.mObjectID, 0);
            }
            if (color0 != null) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color0.mObjectID, 0);
            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
                return null;
            }
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return {
                mObjectID: id
            };
        }
        */

        function load(fragString, vertString, line) {
            var glsl = this, gl = glsl.gl;
            // Load vertex shader if there is one
            if (vertString) {
                glsl.vertexString = vertString;
            }
            // Load fragment shader if there is one
            if (fragString) {
                glsl.fragmentString = fragString;
            }
            glsl.animated = false;
            glsl.nDelta = (glsl.fragmentString.match(/u_delta/g) || []).length;
            glsl.nTime = (glsl.fragmentString.match(/u_time/g) || []).length;
            glsl.nDate = (glsl.fragmentString.match(/u_date/g) || []).length;
            glsl.nMouse = (glsl.fragmentString.match(/u_mouse/g) || []).length;
            glsl.animated = glsl.nDate > 1 || glsl.nTime > 1 || glsl.nMouse > 1;
            var nTextures = glsl.fragmentString.search(/sampler2D/g);
            if (nTextures) {
                var lines = glsl.fragmentString.split('\n');
                for (var i = 0; i < lines.length; i++) {
                    var match = lines[i].match(/uniform\s*sampler2D\s*([\w]*);\s*\/\/\s*([\w|\:\/\/|\.|\-|\_]*)/i);
                    if (match) {
                        var ext = match[2].split('.').pop().toLowerCase();
                        if (match[1] && match[2] && (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'ogv' || ext === 'webm' || ext === 'mp4')) {
                            glsl.setUniform(match[1], match[2]);
                        }
                    }
                    var main = lines[i].match(/\s*void\s*main\s*/g);
                    if (main) {
                        break;
                    }
                }
            }
            var vertexShader = createShader(glsl, glsl.vertexString, gl.VERTEX_SHADER);
            var fragmentShader = createShader(glsl, glsl.fragmentString, gl.FRAGMENT_SHADER, line);
            // If Fragment shader fails load a empty one to sign the error
            if (!fragmentShader) {
                fragmentShader = createShader(glsl, 'void main(){\n\tgl_FragColor = vec4(1.0);\n}', gl.FRAGMENT_SHADER);
                glsl.isValid = false;
            } else {
                glsl.isValid = true;
            }
            // Create and use program
            var program = createProgram(glsl, [vertexShader, fragmentShader]);//, [0,1],['a_texcoord','a_position']);
            gl.useProgram(program);
            // Delete shaders
            // gl.detachShader(program, vertexShader);
            // gl.detachShader(program, fragmentShader);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            glsl.program = program;
            glsl.change = true;
            // Trigger event
            glsl.trigger('load', {});
            glsl.forceRender = true;
        }

        function loadBuffers(buffers) {
            var glsl = this,
                gl = glsl.gl,
                i = 0;
            glsl.buffers = {};
            var vertex = createShader(glsl, glsl.vertexString, gl.VERTEX_SHADER);
            for (var key in buffers) {
                var buffer = buffers[key];
                var fragment = createShader(glsl, buffer.common + buffer.fragment, gl.FRAGMENT_SHADER, buffer.line);
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

        /*
        function ub() {
            if (tex.mType === me.TEXTYPE.T2D) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, tex.mObjectID);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, tex.mVFlip);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, x0, y0, xres, yres, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }
        }
        */
        /*
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
        */

        function resize() {
            var glsl = this;
            var flag = _resize.apply(glsl);
            if (flag) {
                glsl.resizeSwappableBuffers();
            }
            return flag;
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

        function createShader(glsl, source, type, line) {
            var gl = glsl.gl;
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (!compiled) {
                var lastError = gl.getShaderInfoLog(shader);
                console.log(lastError);
                console.error('*** Error compiling shader ' + shader + ':' + lastError);
                glsl.trigger('error', {
                    shader: shader,
                    source: source,
                    type: type,
                    error: lastError,
                    line: line || 0,
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
            var source = fragment; var line;
            options.main = null;
            // (?<=\/{2} u_buffer_)(\d+).*((.|\n)*?)(?=\/{2} [u_buffer|main]|\z)
            // (?<=\/{2} main).*((.|\n)*?)(?=\/{2} u_buffer|\z)
            fragment = fragment.replace(new RegExp('(/{2} u_buffer_)(\\d+).*((.|\\n)*?)(?=/{2} u_buffer|/{2} main|$)', 'g'), function (match, name, i, fragment, end, offset) {
                // console.log('u_buffer_.replace', arguments);
                line = source.substr(0, offset).split('\n').length;
                // console.log('line', line);
                options.buffers['u_buffer_' + i] = {
                    fragment: fragment,
                    line: line,
                };
                return '';
            });

            fragment = fragment.replace(new RegExp('(/{2} main).*((.|\\n)*)(?=/{2} u_buffer|$)', 'g'), function (match, name, main, end, offset) {
                options.main = main;
                return '';
            });

            var linediff = fragment.split('\n').length;

            line = 0;
            if (options.main) {
                source.replace(new RegExp('(/{2} main).*((.|\\n)*)(?=/{2} u_buffer|$)', 'g'), function (match, name, main, end, offset) {
                    line = source.substr(0, offset).split('\n').length - linediff;
                    return '';
                });
            }

            // console.log('getResource', fragment, options.buffers);
            for (var key in options.buffers) {
                options.buffers[key].common = fragment;
                options.buffers[key].line -= linediff;
            }

            options.fragment = fragment + (options.main || '');
            options.line = line;
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
            glsl.load(options.fragment, options.vertex, options.line);
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
        console.log('onGlslError.error', message);
        var options = window.options;
        var errors = [],
            warnings = [];
        message.error.replace(/ERROR: \d+:(\d+): \'(.+)\' : (.+)/g, function (m, l, v, t) {
            var line = Number(l) + message.line;
            var error = 'ERROR (' + v + ') ' + t;
            var li = '<li><a class="error" unselectable href="' + encodeURI('command:glsl-canvas.revealGlslLine?' + JSON.stringify([options.uri, line, error])) + '"><span class="line">ERROR line ' + line + '</span> <span class="value" title="' + v + '">' + v + '</span> <span class="text" title="' + t + '">' + t + '</span></a></li>';
            errors.push(li);
            return li;
        });
        message.error.replace(/WARNING: \d+:(\d+): \'(.*\n*|.*|\n*)\' : (.+)/g, function (m, l, v, t) {
            var line = Number(l) + message.line;
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

    window.addEventListener('load', init);

}());