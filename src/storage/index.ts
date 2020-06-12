import * as localforage from 'localforage';
import { Document } from '../model/document';
import { EditorState } from '../model/editorState';
import { Gif, GifFrame } from '../util/loadGif';

const debug = true;

const version = 0;

const versionKey = 'gifShift-version';
const stateKey = 'gifShift-state';
const gifKey = 'gifShift-gif';
const maskKey = 'gifShift-mask';

export class Storage {

    private _pendingStore?: EditorState;
    private readonly _storeDelay = 1000;

    private _storedGif?: Gif;
    private _storedMask?: number;
    private _storedState: EditorState | undefined;

    public triggerStore(state: EditorState): void {
        if (!this._pendingStore) {
            setTimeout(() => {
                if (this._pendingStore) {
                    this.store(this._pendingStore);
                }
                this._pendingStore = undefined;
            }, this._storeDelay);
        }
        this._pendingStore = state;
    }

    private async store(state: EditorState): Promise<void> {
        if (!this.needsToBeStored(state)) {
            if (debug) {
                console.log('Skipped storing');
            }
            return;
        }

        if (debug) {
            console.log('Storing');
        }

        await localforage.setItem(versionKey, version);
        await localforage.setItem(stateKey, { ...state, doc: state.doc.toJson() });

        if (state.doc.gif) {
            if (this._storedGif !== state.doc.gif) {
                const data = (state.doc.gif.frames || []).map(x => x.canvas.toDataURL('image/png'));
                this._storedGif = state.doc.gif;
                if (debug) {
                    console.log(`Storing Gif`);
                }
                await localforage.setItem(gifKey, data);
            }
        }

        if (this._storedMask !== state.doc.maskVersion) {
            const mask = state.doc.maskCanvas!.toDataURL('image/png');
            this._storedMask = state.doc.maskVersion;
            if (debug) {
                console.log(`Storing Mask `);
            }
            await localforage.setItem(maskKey, mask);
        }
    }

    public async load(): Promise<EditorState | undefined> {
        const storedVersion = await localforage.getItem<number>(versionKey);
        if (storedVersion !== version) {
            return;
        }

        const serializedState = await localforage.getItem<EditorState | undefined>(stateKey);
        if (!serializedState) {
            return;
        }

        const serializedGif = serializedState.doc.gif;
        let frames: GifFrame[] = [];
        if (serializedGif) {
            const frameData = await localforage.getItem<string[]>(gifKey);
            const zipped = serializedGif.frames.map((x, i) => [x, frameData[i]] as const);
            frames = await Promise.all(zipped.map(async ([serializedFrame, currentFrameData]) => {
                const canvas = document.createElement('canvas');
                await drawDataUriToCanvas(canvas, serializedGif, currentFrameData);
                const frame: GifFrame = { info: serializedFrame.info, canvas };
                return frame;
            }));
        }

        const gif: Gif | undefined = serializedGif ? { ...serializedGif, frames } : undefined;

        const doc = Document.fromGif(gif);

        if (gif) {
            this._storedGif = gif;

            const maskData = await localforage.getItem<string>(maskKey);
            await drawDataUriToCanvas(doc.maskCanvas, gif, maskData);
            this._storedMask = doc.maskVersion;
        }

        const editorState = new EditorState(
            doc,
            serializedState.drawingSettings,
            serializedState.playback);

        this._storedState = editorState;
        return editorState;
    }

    public reset(): Promise<void> {
        return localforage.clear();
    }

    private needsToBeStored(state: EditorState): boolean {
        if (!this._storedState) {
            return true;
        }

        if (this._storedState !== state) {
            // TODO: exclude playback settings
            return true;
        }

        if (this._storedGif !== state.doc.gif) {
            return true;
        }

        if (this._storedMask !== state.doc.maskVersion) {
            return true;
        }

        return false;
    }
}

async function drawDataUriToCanvas(canvas: HTMLCanvasElement, gif: Gif, currentFrameData: string) {
    canvas.width = gif.width;
    canvas.height = gif.height;

    const ctx = canvas.getContext('2d')!;

    const img = new Image();
    const loadPromise = new Promise((resolve, reject) => {
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            resolve();
        };
        img.onerror = (e) => {
            console.error(e);
            reject(e);
        };
    });
    img.src = currentFrameData;
    await loadPromise;
    return canvas;
}
