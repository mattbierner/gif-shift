import * as THREE from 'three';
import { RenderMode } from '../model/editorState';
import * as shiftShader from '../shaders/frameSampler';
import { maskShader } from '../shaders/maskShader';
import screen_shader from '../shaders/screen';
import { Gif } from '../util/loadGif';
import { Atlas } from './Atlas';

interface RenderOptions {
    readonly frame: number;
    readonly renderMode?: RenderMode;
}

class RenderState {

    public static readonly empty = new RenderState(
        [],
        new THREE.Vector2(),
        0,
        new THREE.Vector2(),
        undefined);

    public static from(gif: Gif, mask: THREE.Texture | undefined) {
        const atlasDimensions = new THREE.Vector2(
            Math.floor(shiftShader.maxTextureSize / gif.width),
            Math.floor(shiftShader.maxTextureSize / gif.height)
        );

        return new RenderState(
            Array.from(this.buildAtlases(gif)),
            new THREE.Vector2(gif.width, gif.height),
            gif.frames.length,
            atlasDimensions,
            mask,
        );
    }

    private static *buildAtlases(gif: Gif): Iterable<Atlas> {
        let imageIndex = 0;
        while (imageIndex < gif.frames.length) {
            const { atlas, index } = Atlas.buildAtlas(gif, imageIndex, shiftShader.maxTextureSize);
            imageIndex = index;
            yield atlas;
        }
    }

    private constructor(
        public readonly atlases: readonly Atlas[],
        public readonly gifSize: THREE.Vector2,
        public readonly frameCount: number,
        public readonly atlasDimensions: THREE.Vector2,
        public readonly mask: THREE.Texture | undefined,
    ) { }

    public dispose() {
        for (const atlas of this.atlases) {
            atlas.dispose();
        }
        this.mask?.dispose();
    }
}

export class Renderer {

    private readonly _scene: THREE.Scene;
    private readonly _sceneRTT: THREE.Scene;

    private _renderer!: THREE.WebGLRenderer;
    private _rt1!: THREE.WebGLRenderTarget;
    private _rt2!: THREE.WebGLRenderTarget;

    private _camera!: THREE.OrthographicCamera;

    private _frameSamplerMaterial!: THREE.ShaderMaterial;
    private _maskMaterial!: THREE.ShaderMaterial;
    private _materialScreen!: THREE.ShaderMaterial;

    private _dataBuffer: any;

    private _samplerMesh!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    private _maskMesh!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

    private _state = RenderState.empty;

    constructor(canvas: HTMLCanvasElement) {
        this._scene = new THREE.Scene();
        this._sceneRTT = new THREE.Scene();

        this.initRenderer(canvas);
        this.resize(1, 1);

        this.initMaterials();
        this.initGeometry();
    }

    public clone(renderer: Renderer) {
        this._state = renderer._state;
        this.resize(this._state.gifSize.x, this._state.gifSize.y);

        this._frameSamplerMaterial = new THREE.ShaderMaterial(shiftShader.frameSamplerShader(this._state.atlasDimensions)).clone();
        this._samplerMesh.material = this._frameSamplerMaterial;
    }

    private initRenderer(canvas: HTMLCanvasElement) {
        this._renderer = new THREE.WebGLRenderer({ canvas });
        this._renderer.setClearColor(0xffffff, 0);
        this._renderer.setPixelRatio(1);

        const renderTargetOptions: THREE.WebGLRenderTargetOptions = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            format: THREE.RGBFormat,
            depthBuffer: false,
            stencilBuffer: false,
        };
        this._rt1 = new THREE.WebGLRenderTarget(1, 1, renderTargetOptions);
        this._rt2 = new THREE.WebGLRenderTarget(1, 1, renderTargetOptions);
    }

    private initMaterials() {
        this._frameSamplerMaterial = new THREE.ShaderMaterial(shiftShader.frameSamplerShader(new THREE.Vector2())).clone();
        this._maskMaterial = new THREE.ShaderMaterial(maskShader).clone();

        this._materialScreen = new THREE.ShaderMaterial(screen_shader).clone();
    }

    private initGeometry() {
        const plane = new THREE.PlaneGeometry(2, 2);

        this._samplerMesh = new THREE.Mesh(plane, this._frameSamplerMaterial);
        this._sceneRTT.add(this._samplerMesh);

        this._maskMesh = new THREE.Mesh(plane, this._maskMaterial);
        this._sceneRTT.add(this._maskMesh);

        this._scene.add(new THREE.Mesh(plane, this._materialScreen));
    }

    public setGif(gif: Gif, mask: HTMLCanvasElement) {
        const maskTexture = new THREE.Texture(mask);
        maskTexture.minFilter = THREE.LinearFilter;
        maskTexture.wrapS = THREE.ClampToEdgeWrapping;
        maskTexture.wrapT = THREE.ClampToEdgeWrapping;
        maskTexture.needsUpdate = true;

        this._state.dispose();
        this._state = RenderState.from(gif, maskTexture);

        this._frameSamplerMaterial.dispose();
        this._frameSamplerMaterial = new THREE.ShaderMaterial(shiftShader.frameSamplerShader(this._state.atlasDimensions)).clone();
        this._samplerMesh.material = this._frameSamplerMaterial;

        this.resize(gif.width, gif.height);
    }

    public resize(width: number, height: number) {
        this._camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, -10000, 10000);
        this._camera.position.z = 100;

        this._rt1.setSize(width, height);
        this._rt2.setSize(width, height);
        this._renderer.setSize(width, height);
    }

    /**
     * Main render function.
     */
    public render(options: RenderOptions) {
        const target = this.renderToTexture(options);
        this.renderTextureToScreen(target.texture);
    }

    private _ensureDataBuffer(width: number, height: number) {
        const size = 4 * width * height;
        if (!this._dataBuffer || this._dataBuffer.length !== size) {
            this._dataBuffer = new Uint8Array(size);
        }
        return this._dataBuffer;
    }

    public renderToBuffer(options: RenderOptions) {
        const target = this.renderToTexture(options);

        const { width, height } = target;
        const pixels = this._ensureDataBuffer(width, height);

        this._materialScreen.uniforms.flip.value = 1;
        this._materialScreen.uniformsNeedUpdate = true;

        this.renderTextureToScreen(target.texture);
        const gl = this._renderer.getContext();
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return pixels;
    }

    private renderTextureToScreen(texture: THREE.Texture) {
        this._materialScreen.uniforms.tDiffuse.value = texture;
        this._materialScreen.uniformsNeedUpdate = true;

        this._renderer.setRenderTarget(null);
        this._renderer.render(this._scene, this._camera);
    }

    private renderToTexture(options: RenderOptions): THREE.WebGLRenderTarget {
        if (!this._state.mask) {
            return this._rt1;
        }
        this._state.mask.needsUpdate = true;

        switch (options.renderMode) {
            case RenderMode.Mask:
                {
                    return this.renderMask(this._rt2);
                }
            case RenderMode.Normal:
            default:
                {
                    let source = this._rt1;
                    let dest = this._rt2;

                    for (const atlas of this._state.atlases) {
                        source = this.renderAtlas(dest, atlas, options.frame, source);

                        // Swap
                        dest = dest === this._rt1 ? this._rt2 : this._rt1;
                    }
                    return source;
                }
        }
    }

    private renderAtlas(
        target: THREE.WebGLRenderTarget,
        atlas: Atlas,
        currentFrame: number,
        source: THREE.WebGLRenderTarget,
    ): THREE.WebGLRenderTarget {
        this._samplerMesh.visible = true;
        this._maskMesh.visible = false;

        this._frameSamplerMaterial.uniforms.atlas.value = atlas.texture;
        this._frameSamplerMaterial.uniforms.maskTexture.value = this._state.mask;
        this._frameSamplerMaterial.uniforms.sourceTexture.value = source.texture;

        this._frameSamplerMaterial.uniforms.gifSize.value = this._state.gifSize;
        this._frameSamplerMaterial.uniforms.currentFrame.value = currentFrame;
        this._frameSamplerMaterial.uniforms.totalNumberOfFrames.value = this._state.frameCount;
        this._frameSamplerMaterial.uniforms.atlasFirstFrame.value = atlas.startingFrame;

        this._frameSamplerMaterial.uniformsNeedUpdate = true;

        this._renderer.setRenderTarget(target);
        this._renderer.clear();
        this._renderer.render(this._sceneRTT, this._camera);

        return target;
    }

    private renderMask(
        dest: THREE.WebGLRenderTarget,
    ): THREE.WebGLRenderTarget {
        this._samplerMesh.visible = false;
        this._maskMesh.visible = true;

        this._maskMaterial.uniforms.maskTexture.value = this._state.mask;
        this._maskMaterial.uniforms.totalNumberOfFrames.value = this._state.frameCount;
        this._maskMaterial.uniformsNeedUpdate = true;

        this._renderer.setRenderTarget(dest);
        this._renderer.clear();
        this._renderer.render(this._sceneRTT, this._camera);

        return dest;
    }
}
