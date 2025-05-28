// vim: set ft=glsl:
// Saturation and brightness boost shader

precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D tex;

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec4 pixColor = texture2D(tex, v_texcoord);
    
    // Convert to HSV
    vec3 hsv = rgb2hsv(pixColor.rgb);
    
    // Increase saturation
    hsv.y *= 1.05; // Saturation boost
    hsv.y = min(hsv.y, 1.0); // Clamp to valid range
    
    // Increase brightness
    hsv.z *= 1.00; // Brightness boost
    hsv.z = min(hsv.z, 1.0); // Clamp to valid range
    
    // Convert back to RGB
    pixColor.rgb = hsv2rgb(hsv);
    
    // Additional color enhancement
    pixColor.rgb *= vec3(1.1, 1.1, 1.05); // Slight warm boost
    
    // Ensure we don't exceed maximum values
    pixColor.rgb = clamp(pixColor.rgb, 0.0, 1.0);
    
    gl_FragColor = pixColor;
}
