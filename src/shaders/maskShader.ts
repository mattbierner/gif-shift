import * as THREE from 'three';

export const maskShader: THREE.Shader = {
    uniforms: {
        maskTexture: { value: new THREE.Texture() },
        totalNumberOfFrames: { value: 0 },
    },
    vertexShader: /* glsl */`
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */`
        uniform sampler2D maskTexture;

        uniform int currentFrame;
        uniform int totalNumberOfFrames;

        varying vec2 vUv;
        
        void main() {
            vec4 maskSample = texture2D(maskTexture, vUv) * 256.0;
            int frameDelta = (maskSample.r >= 128.0 ? -1 : 1) * (
                65536 * int(maskSample.r >= 128.0 ? maskSample.r - 128.0 : maskSample.r) +
                256 * int(maskSample.g) +
                int(maskSample.b)
            );

            float frameShift = float(frameDelta) / float(totalNumberOfFrames);

            gl_FragColor = vec4(
                frameShift > 0.0 ?  frameShift : 0.0,
                0.0,
                frameShift < 0.0 ? -frameShift : 0.0,
                1.0);
        }
    `,
};