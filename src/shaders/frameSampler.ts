import * as THREE from 'three';
import { getMaxTextureSize } from './constants';

export const maxTextureSize = Math.min(8192, getMaxTextureSize());

export function frameSamplerShader(
    atlasFramesSize: THREE.Vector2,
): THREE.Shader {
    const framesPerAtlas = atlasFramesSize.x * atlasFramesSize.y;

    return {
        uniforms: {
            sourceTexture: { value: new THREE.Texture() },
            maskTexture: { value: new THREE.Texture() },
            atlas: { value: new THREE.Texture() },

            currentFrame: { value: 0 },
            totalNumberOfFrames: { value: 0 },
            atlasFirstFrame: { value: 0 },

            gifSize: { value: new THREE.Vector2(), },
        },
        vertexShader: /* glsl */`
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            uniform sampler2D sourceTexture;
            uniform sampler2D maskTexture;
            uniform sampler2D atlas;

            uniform int currentFrame;
            uniform float totalNumberOfFrames;
            uniform int atlasFirstFrame;

            uniform vec2 gifSize;
            
            varying vec2 vUv;
            
            /**
             * Returns accurate MOD when arguments are approximate integers.
             */
            float modI(float a, float b) {
                float m = a - floor((a + 0.5) / b) * b;
                return floor(m + 0.5);
            }

            void main() {
                vec4 maskSample = texture2D(maskTexture, vUv) * 256.0;
                int frameDelta = (maskSample.r >= 128.0 ? -1 : 1) * (
                    65536 * int(maskSample.r >= 128.0 ? maskSample.r - 128.0 : maskSample.r) +
                    256 * int(maskSample.g) +
                    int(maskSample.b)
                );

                int frameIndex = int(modI(float(currentFrame + frameDelta), float(totalNumberOfFrames)));
                int relativeFrameIndex = frameIndex - atlasFirstFrame;

                if (relativeFrameIndex >= 0 && relativeFrameIndex < ${framesPerAtlas}) {
                    vec2 atlasCoords = vec2(
                        modI(float(relativeFrameIndex), ${atlasFramesSize.x.toFixed(1)}),
                        floor(float(relativeFrameIndex) / ${atlasFramesSize.x.toFixed(1)}));

                    vec2 topLeft = gifSize * atlasCoords;
                    float x = (topLeft.x + vUv.x * gifSize.x) / ${maxTextureSize.toFixed(1)};
                    float y = 1.0 - ((topLeft.y + (1.0 - vUv.y) * gifSize.y) / ${maxTextureSize.toFixed(1)});
                    
                    gl_FragColor = vec4(texture2D(atlas, vec2(x, y)).xyz, 1.0);
                } else {
                    gl_FragColor = vec4(texture2D(sourceTexture, vUv).xyz, 1.0);
                }
            }
        `,
    };
}
