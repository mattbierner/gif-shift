import { GifFrame } from '../util/loadGif';
import { Document } from './document';
import { DrawingSettings, DrawingToolType } from './drawing';

export enum RenderMode {
    Normal,
    Mask,
}

export interface PlaybackSettings {
    readonly renderMode: RenderMode;
    readonly zoom: number;
    readonly currentFrameIndex: number;
    readonly playing: boolean;
}

export class EditorState {

    public static readonly empty = new EditorState(
        Document.empty,
        {
            tool: DrawingToolType.Brush,
            strokeSize: 40,
            frameShift: 1,
        },
        {
            renderMode: RenderMode.Normal,
            zoom: 1,
            currentFrameIndex: 0,
            playing: false
        },
    );

    public constructor(
        public readonly doc: Document,
        public readonly drawingSettings: DrawingSettings,
        public readonly playback: PlaybackSettings,
    ) { }

    public get currentFrame(): GifFrame | undefined {
        return this.doc?.gif?.frames[this.playback.currentFrameIndex];
    }

    public updateDocument(doc: Document): EditorState {
        return new EditorState(doc, this.drawingSettings, this.playback);
    }

    public updateDrawing(drawing: DrawingSettings): EditorState {
        return new EditorState(this.doc, drawing, this.playback);
    }

    public updatePlayback(settings: PlaybackSettings) {
        return new EditorState(this.doc, this.drawingSettings, settings);
    }

    public setPlaying(playing: boolean): EditorState {
        if (playing === this.playback.playing) {
            return this;
        }
        return this.updatePlayback({ ...this.playback, playing });
    }

    public setActiveFrame(index: number): EditorState {
        const frame = index % this.doc.frameCount;
        const newFrameIndex = frame < 0 ? this.doc.frameCount + frame : frame;

        if (newFrameIndex === this.playback.currentFrameIndex) {
            return this;
        }

        return this.updatePlayback({
            ...this.playback,
            currentFrameIndex: newFrameIndex,
        });
    }

    public advanceFrame(): EditorState {
        return this.setActiveFrame(this.playback.currentFrameIndex + 1);
    }
}
