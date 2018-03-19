#ifdef GL_ES
    precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

uniform sampler2D u_buffer_0;
uniform sampler2D u_buffer_1;

#define st gl_FragCoord.xy / u_resolution
    
// u_buffer_0

void main() {
    vec3 color = vec3(1.0, 0.0, 0.0);
    // gl_FragColor = vec4(color * abs(sin(u_time)), 1.0);
    gl_FragColor = vec4(0.5 + u_time, 0.0, 0.0, 1.0);
}

// u_buffer_1

void main() {
    vec3 color = vec3(0.0, 1.0, 0.0);
    gl_FragColor = vec4(color * abs(cos(u_time)), 1.0);
}

// main

void main() {
    vec3 color = vec3(0.0, 0.0, 1.0);
    vec4 c = texture2D(u_buffer_1, st, 0.0);
    gl_FragColor = vec4(c.rgb, 1.0);
}
