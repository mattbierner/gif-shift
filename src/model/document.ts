import { Gif, GifFrame } from '../util/loadGif';

export class Document {

    public static readonly empty = new Document(undefined, document.createElement('canvas'), 0);

    public static fromGif(gif: Gif | undefined) {
        return new Document(gif, document.createElement('canvas'), 0);
    }

    public readonly maskCtx: CanvasRenderingContext2D;

    private _maskVersion: number;

    private constructor(
        public readonly gif: Gif | undefined,
        public readonly maskCanvas: HTMLCanvasElement,
        maskVersion: number,
    ) {
        this._maskVersion = maskVersion;

        if (this.maskCanvas.width !== this.width || this.maskCanvas.height !== this.height) {
            this.maskCanvas.width = this.width;
            this.maskCanvas.height = this.height;
        }

        this.maskCtx = this.maskCanvas.getContext('2d')!;
    }

    public toJson() {
        return {
            gif: this.gif ? {
                ...this.gif,
                frames: this.gif.frames.map(frame => ({
                    info: frame.info
                }))
            } : undefined,
        };
    }

    public get width(): number {
        return this.gif?.width ?? 0;
    }

    public get height(): number {
        return this.gif?.height ?? 0;
    }

    public get frameCount(): number {
        return this.gif?.frames.length ?? 0;
    }

    public getFrame(index: number): GifFrame | undefined {
        if (!this.gif) {
            return undefined;
        }
        return this.gif.frames[index % this.gif.frames.length];
    }

    public setGif(gif: Gif): Document {
        return new Document(gif, this.maskCanvas, this._maskVersion);
    }

    public touchMask(): void {
        ++this._maskVersion;
    }

    public get maskVersion() { return this._maskVersion; }

}