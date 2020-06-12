import { DrawingToolType, QuickShiftType as QuickShiftType } from '../../model/drawing';

export enum EditorActionType {
    SetDrawTool,
    IncrementStroke,
    SetStroke,
    SetWeight,
    QuickShift,
}

export class SetDrawTool {
    public readonly type = EditorActionType.SetDrawTool;

    constructor(
        public readonly tool: DrawingToolType,
    ) { }
}

export class QuickShift {
    public readonly type = EditorActionType.QuickShift;

    constructor(
        public readonly quickShiftType: QuickShiftType,
    ) { }
}

export class IncrementStroke {
    public readonly type = EditorActionType.IncrementStroke;

    constructor(
        public readonly by: number
    ) { }
}

export class SetStroke {
    public readonly type = EditorActionType.SetStroke;

    constructor(
        public readonly stroke: number
    ) { }
}

export class SetWeight {
    public readonly type = EditorActionType.SetWeight;

    constructor(
        public readonly weight: number
    ) { }
}

export type EditorAction =
    | SetDrawTool
    | IncrementStroke
    | QuickShift
    | SetStroke
    | SetWeight
    ;