import { Document } from '../../model/document';
import { DrawingSettings } from '../../model/drawing';
import { EditorState, RenderMode } from '../../model/editorState';
import { Gif } from '../../util/loadGif';

export enum ActionType {
    Loaded,
    UpdateDoc,

    SetGif,

    UpdateDrawing,
    ChangeZoom,

    SetRenderingMode,
    ToggleLayerVisibility,

    SetPlaying,
    SetActiveFrame,
    IncrementFrame,
}

export class Loaded {
    public readonly type = ActionType.Loaded;

    constructor(
        public readonly state: EditorState,
    ) { }
}

export class UpdateDoc {
    public readonly type = ActionType.UpdateDoc;

    constructor(
        public readonly doc: Document,
    ) { }
}

export class SetGif {
    public readonly type = ActionType.SetGif;

    constructor(
        public readonly gif: Gif,
    ) { }
}

export class UpdateDrawing {
    public readonly type = ActionType.UpdateDrawing;

    constructor(
        public readonly drawing: DrawingSettings,
    ) { }
}

export class SetRenderingMode {
    public readonly type = ActionType.SetRenderingMode;

    constructor(
        public readonly mode: RenderMode,
    ) { }
}

export class ChangeZoom {
    public readonly type = ActionType.ChangeZoom;

    constructor(
        public readonly value: number,
    ) { }
}

export class SetPlaying {
    public readonly type = ActionType.SetPlaying;

    constructor(
        public readonly playing: boolean
    ) { }
}

export class SetActiveFrame {
    public readonly type = ActionType.SetActiveFrame;

    constructor(
        public readonly index: number
    ) { }
}

export class IncrementFrame {
    public readonly type = ActionType.IncrementFrame;

    constructor(
        public readonly by: number
    ) { }
}


export type Actions =
    | Loaded
    | UpdateDoc

    | SetGif
    | UpdateDrawing
    | SetRenderingMode
    | ChangeZoom
    | SetPlaying
    | SetActiveFrame
    | IncrementFrame
    ;
