import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Document } from '../../model/document';
import { DrawingToolType, QuickShiftType } from '../../model/drawing';
import { EditorState } from '../../model/editorState';
import { Vec, vecZero } from '../../model/vec';
import { Renderer } from '../../renderer';
import { clamp } from '../../util/math';
import * as actions from '../../views/main/actions';

interface EventWithPosition {
    readonly clientX: number;
    readonly clientY: number;
}

/**
 * State of the currently drawing tool
 */
interface ActiveToolState {
    readonly tool: DrawingToolType;
    readonly mouseDownPosition: Vec;
    readonly layerMovingShift: Vec;
}


interface Props {
    dispatch: React.Dispatch<actions.Actions>;
    editorState: EditorState;
    didTouchLayer: () => void;
    rendererRef: React.MutableRefObject<Renderer | undefined>
}

export class EditorArea extends React.Component<Props> {

    private _canvas?: HTMLCanvasElement;

    private _activeTool?: ActiveToolState;
    private _renderer?: Renderer;

    private _renderPending = false;

    componentDidMount() {
        const element = ReactDOM.findDOMNode(this) as HTMLElement;
        this._canvas = element.getElementsByTagName('canvas')[0];

        this._renderer = new Renderer(this._canvas);
        if (this.props.editorState.doc.gif) {
            this._renderer.setGif(this.props.editorState.doc.gif, this.props.editorState.doc.maskCanvas);
        }

        this.props.rendererRef.current = this._renderer;

        element.addEventListener('touchstart', this.onTouchStart, { passive: false });
        element.addEventListener('touchmove', this.onTouchMove, { passive: false });

        document.body.addEventListener('mouseup', this.onMouseUp);
        document.body.addEventListener('touchend', this.onTouchEnd);
    }

    UNSAFE_componentWillReceiveProps(newProps: Props) {
        if (this._renderer) {
            if (this.props.editorState.doc.gif !== newProps.editorState.doc.gif) {
                this._renderer.setGif(newProps.editorState.doc.gif!, newProps.editorState.doc.maskCanvas);
            }
            this.requestCanvasRender();
        }
    }

    componentWillUnmount() {
        const element = ReactDOM.findDOMNode(this) as HTMLElement;

        element.addEventListener('touchstart', this.onTouchStart);
        element.addEventListener('touchmove', this.onTouchMove);

        document.body.removeEventListener('mouseup', this.onMouseUp);
        document.body.removeEventListener('touchend', this.onTouchEnd);
    }

    render() {
        this.requestCanvasRender();

        const canvasWidth = Math.ceil(this.props.editorState.doc.width * this.props.editorState.playback.zoom);
        const canvasHeight = Math.ceil(this.props.editorState.doc.height * this.props.editorState.playback.zoom);

        this._renderer?.resize(canvasWidth, canvasHeight);

        return (
            <div
                onMouseDown={e => this.onMouseDown(e)}
                onMouseMove={e => this.onMouseMove(e)}
                style={{
                    gridArea: 'editor',
                    display: 'flex',
                    flex: 1,
                    overflow: 'scroll',
                    overflowY: 'scroll',
                    userSelect: 'none',
                    border: '10px solid transparent',
                    borderTop: 0,
                    borderBottom: 0,
                }}>
                <canvas
                    width={canvasWidth}
                    height={canvasHeight}
                    style={{
                        display: 'block',
                        border: '1px solid lightgrey',
                        alignSelf: 'center',
                        margin: 'auto',
                    }} />
            </div>
        );
    }

    private onMouseDown(e: EventWithPosition): void {
        if (!this.props.editorState.doc.gif) {
            return;
        }

        const editorState = this.props.editorState;
        const zoom = this.props.editorState.playback.zoom;

        const mouseDownPosition = this.getPositionInCanvas(e);
        this._activeTool = {
            tool: editorState.drawingSettings.tool,
            mouseDownPosition: mouseDownPosition,
            layerMovingShift: vecZero,
        };

        const maskCtx = this.props.editorState.doc.maskCtx;

        if (editorState.drawingSettings.tool === DrawingToolType.Erase) {
            maskCtx.fillStyle = 'white';
            maskCtx.strokeStyle = 'white';
            maskCtx.globalCompositeOperation = 'destination-out';
        } else {
            const color = this.getDrawingColor();
            maskCtx.fillStyle = color;
            maskCtx.strokeStyle = color;
            maskCtx.globalCompositeOperation = 'source-over';
        }
        maskCtx.lineJoin = maskCtx.lineCap = 'round';
        maskCtx.lineWidth = editorState.drawingSettings.strokeSize;

        switch (editorState.drawingSettings.tool) {
            case DrawingToolType.Brush:
            case DrawingToolType.Erase:
                {
                    const relativePosition = this.getPositionInLayer(mouseDownPosition, zoom);
                    maskCtx.beginPath();
                    maskCtx.moveTo(relativePosition.x, relativePosition.y);
                    maskCtx.lineTo(relativePosition.x, relativePosition.y);
                    maskCtx.stroke();
                    this.onDidEditMask();
                    break;
                }
        }
    }

    private getDrawingColor() {
        // Use the rgb values as a single 24bit int

        const maxWeight = 0x0fffff;
        const weight = clamp(Math.round(Math.abs(this.props.editorState.drawingSettings.frameShift)), -maxWeight, maxWeight);
        let red = (weight >> 16) & 0b01111111;
        const green = (weight >> 8) & 0xff;
        const blue = (weight) & 0xff;

        if (this.props.editorState.drawingSettings.frameShift < 0) {
            red |= 0b10000000;
        }

        return `rgb(${red}, ${green}, ${blue})`;
    }

    private onMouseMove(e: EventWithPosition) {
        if (!this._activeTool) {
            return;
        }

        if (!this.props.editorState.doc.gif) {
            return;
        }

        const maskCtx = this.props.editorState.doc.maskCtx;
        const zoom = this.props.editorState.playback.zoom;

        switch (this._activeTool.tool) {
            case DrawingToolType.Brush:
            case DrawingToolType.Erase:
                {
                    const { x, y } = this.getPositionInLayer(this.getPositionInCanvas(e), zoom);
                    maskCtx.lineTo(x, y);
                    maskCtx.stroke();
                    this.onDidEditMask(/* skipTouch */ true);
                    break;
                }
            case DrawingToolType.Line:
                {
                    const mouseDownRelativePosition = this.getPositionInLayer(this._activeTool.mouseDownPosition, zoom);
                    const { x, y } = this.getPositionInLayer(this.getPositionInCanvas(e), zoom);
                    const dx = mouseDownRelativePosition.x - x;
                    const dy = mouseDownRelativePosition.y - y;
                    const angle = Math.atan2(dy, dx);

                    maskCtx.clearRect(0, 0, 10000, 10000);

                    maskCtx.save();
                    maskCtx.translate(mouseDownRelativePosition.x, mouseDownRelativePosition.y);
                    maskCtx.rotate(angle);
                    maskCtx.fillRect(0, -1000, 1000, 2000);
                    maskCtx.restore();

                    maskCtx.save();
                    maskCtx.translate(mouseDownRelativePosition.x, mouseDownRelativePosition.y);
                    maskCtx.rotate(angle + Math.PI);
                    maskCtx.clearRect(0, -1000, 1000, 2000);
                    maskCtx.restore();
                    this.onDidEditMask(/* skipTouch */ true);

                    break;
                }
        }
    }

    private readonly onMouseUp = ((e: EventWithPosition) => {
        if (!this._activeTool) {
            return;
        }

        const mouseDownPosition = this._activeTool.mouseDownPosition;
        this._activeTool = undefined;

        if (!this.props.editorState.doc.gif) {
            return;
        }

        const zoom = this.props.editorState.playback.zoom;
        const mouseDownRelativePosition = this.getPositionInLayer(mouseDownPosition, zoom);
        const maskCtx = this.props.editorState.doc.maskCtx;

        switch (this.props.editorState.drawingSettings.tool) {
            case DrawingToolType.Brush:
            case DrawingToolType.Erase:
                {
                    maskCtx.closePath();
                    break;
                }
            case DrawingToolType.Line:
                {
                    const { x, y } = this.getPositionInLayer(this.getPositionInCanvas(e), zoom);
                    const dx = mouseDownRelativePosition.x - x;
                    const dy = mouseDownRelativePosition.y - y;
                    const angle = Math.atan2(dy, dx);

                    maskCtx.clearRect(0, 0, 10000, 10000);

                    maskCtx.save();
                    maskCtx.translate(mouseDownRelativePosition.x, mouseDownRelativePosition.y);
                    maskCtx.rotate(angle);
                    maskCtx.fillRect(0, -1000, 1000, 2000);
                    maskCtx.restore();

                    maskCtx.save();
                    maskCtx.translate(mouseDownRelativePosition.x, mouseDownRelativePosition.y);
                    maskCtx.rotate(angle + Math.PI);
                    maskCtx.clearRect(0, -1000, 1000, 2000);
                    maskCtx.restore();
                    break;
                }
        }

        this.onDidEditMask();
    }).bind(this);

    private readonly onTouchEnd = ((e: TouchEvent) => {
        if (e.touches.length === 1) {
            this.onMouseUp(e.touches[0]);
        }
    }).bind(this);

    private readonly onTouchStart = ((e: TouchEvent) => {
        if (e.touches.length === 1) {
            this.onMouseDown(e.touches[0]);
            e.preventDefault();
        }
    }).bind(this);

    private readonly onTouchMove = ((e: TouchEvent) => {
        if (e.touches.length === 1) {
            this.onMouseMove(e.touches[0]);
            e.preventDefault();
        }
    }).bind(this);


    public quickMask(mask: QuickShiftType) {
        const doc = this.props.editorState.doc;
        if (!doc.gif) {
            return;
        }

        switch (mask) {
            case QuickShiftType.All: return this.maskAll(doc);
            case QuickShiftType.Clear: return this.clearMask(doc);
            case QuickShiftType.Right: return this.maskRight(doc);
            case QuickShiftType.Left: return this.maskLeft(doc);
            case QuickShiftType.Bottom: return this.maskBottom(doc);
            case QuickShiftType.Top: return this.maskTop(doc);
        }
    }

    private clearMask(doc: Document): void {
        doc.maskCtx.clearRect(0, 0, 10000, 10000);
        this.onDidEditMask();
    }

    private maskAll(doc: Document): void {
        doc.maskCtx.save();
        {
            doc.maskCtx.globalCompositeOperation = 'source-over';
            doc.maskCtx.fillStyle = this.getDrawingColor();
            doc.maskCtx.fillRect(0, 0, 10000, 10000);
        }
        doc.maskCtx.restore();
        this.onDidEditMask();
    }

    private maskLeft(doc: Document): void {
        this.maskAll(doc);
        doc.maskCtx.clearRect(doc.gif!.width / 2, 0, doc.gif!.width, doc.gif!.height);
        this.onDidEditMask();
    }

    private maskRight(doc: Document): void {
        this.maskAll(doc);
        doc.maskCtx.clearRect(0, 0, doc.gif!.width / 2, doc.gif!.height);
        this.onDidEditMask();
    }

    private maskTop(doc: Document): void {
        this.maskAll(doc);
        doc.maskCtx.clearRect(0, doc.gif!.height / 2, doc.gif!.width, doc.gif!.height / 2);
        this.onDidEditMask();
    }

    private maskBottom(doc: Document): void {
        this.maskAll(doc);
        doc.maskCtx.clearRect(0, 0, doc.gif!.width, doc.gif!.height / 2);
        this.onDidEditMask();
    }

    private onDidEditMask(skipTouch?: boolean) {
        if (!skipTouch) {
            this.props.editorState.doc.touchMask();
            this.props.didTouchLayer();
        }
        this.requestCanvasRender();
    }

    private requestCanvasRender() {
        if (this._renderPending) {
            return;
        }

        this._renderPending = true;
        requestAnimationFrame(() => {
            this._renderPending = false;
            this._renderer?.render({
                frame: this.props.editorState.playback.currentFrameIndex,
                renderMode: this.props.editorState.playback.renderMode,
            });
        });
    }

    private getPositionInLayer(canvasPos: Vec, zoom: number): Vec {
        const x = (canvasPos.x / zoom);
        const y = (canvasPos.y / zoom);
        return { x, y };
    }

    private getPositionInCanvas(e: EventWithPosition): Vec {
        if (!this._canvas) {
            return vecZero;
        }

        const rect = this._canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left),
            y: (e.clientY - rect.top),
        };
    }
}
