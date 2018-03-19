#ifdef GL_ES
    precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

// u_buffer_0

void main() {
    vec3 color = vec3(1.0, 0.0, 0.0);
    gl_FragColor = vec4(color, 1.0);
}

// u_buffer_1

void main() {
    vec3 color = vec3(0.0, 1.0, 0.0);
    gl_FragColor = vec4(color, 1.0);
}

// main

void main() {
    vec3 color = vec3(0.0, 0.0, 1.0);
    // vec3 color = vec3(abs(cos(gl_FragCoord.x / u_resolution.x)), abs(sin(gl_FragCoord.y / u_resolution.y)), abs(sin(u_time)));
    gl_FragColor = vec4(color, 1.0);
}