export enum DrawingToolType {
    Brush,
    Erase,
    Line,
}

export interface DrawingTool {
    readonly type: DrawingToolType;
    readonly title: string;
    readonly icon: string;
    readonly key: string;
}

export interface DrawingSettings {
    readonly tool: DrawingToolType;
    readonly strokeSize: number;
    readonly frameShift: number;
}

export class Tools {
    static readonly Brush: DrawingTool = {
        type: DrawingToolType.Brush,
        title: "Brush",
        icon: 'images/icons/brush.svg',
        key: 'b',
    };

    static readonly Erase: DrawingTool = {
        type: DrawingToolType.Erase,
        title: "Erase",
        icon: 'images/icons/eraser.svg',
        key: 'e',
    };

    static readonly Line: DrawingTool = {
        type: DrawingToolType.Line,
        title: "Line",
        icon: 'images/icons/ruler.svg',
        key: 'g',
    };
}

export enum QuickShiftType {
    All,
    Clear,
    Right,
    Left,
    Bottom,
    Top
}

export interface QuickShift {
    readonly type: QuickShiftType;
    readonly title: string;
}

export const quickShifts = new Map<QuickShiftType, QuickShift>([
    [QuickShiftType.All, { type: QuickShiftType.All, title: "Shift All" }],
    [QuickShiftType.Clear, { type: QuickShiftType.Clear, title: "Clear Shift" }],
    [QuickShiftType.Right, { type: QuickShiftType.Right, title: "Shift Right Half" }],
    [QuickShiftType.Left, { type: QuickShiftType.Left, title: "Shift Left Half" }],
    [QuickShiftType.Bottom, { type: QuickShiftType.Bottom, title: "Shift Bottom Half" }],
    [QuickShiftType.Top, { type: QuickShiftType.Top, title: "Shift Top Half" }],
]);