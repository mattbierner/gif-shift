import * as THREE from 'three';
import { Gif } from '../util/loadGif';

export class Atlas {
    public static buildAtlas(
        gif: Gif,
        startingFrame: number,
        atlasSize: number
    ): { atlas: Atlas; index: number; } {
        const canvas = document.createElement('canvas');
        canvas.width = atlasSize;
        canvas.height = atlasSize;
        const ctx = canvas.getContext('2d')!;

        let x = 0;
        let y = 0;
        let frame = startingFrame;
        while (frame < gif.frames.length && y + gif.height < atlasSize) {
            ctx.drawImage(gif.frames[frame++].canvas, x, y, gif.width, gif.height);
            x += gif.width;
            if (x + gif.width > atlasSize) {
                x = 0;
                y += gif.height;
            }
        }

        const tex = new THREE.Texture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;

        return {
            atlas: new Atlas(tex, startingFrame),
            index: frame,
        };
    }

    private constructor(
        public readonly texture: THREE.Texture,
        public readonly startingFrame: number
    ) { }

    public dispose() {
        this.texture.dispose();
    }
}
