import * as React from 'react';
import { AppStage, AppState } from '../../model/appState';
import { DrawingToolType, Tools } from '../../model/drawing';
import { EditorState } from '../../model/editorState';
import { Renderer } from '../../renderer';
import { clamp } from '../../util/math';
import * as actions from '../../views/main/actions';
import * as editorActions from './actions';
import { EditorBottomBar } from './bottomBar';
import { SideBar } from './controls';
import { EditorArea } from './editorArea';

export function GifEditor(props: {
    dispatch: React.Dispatch<actions.Actions>,
    state: AppState,
    didTouchLayer: () => void,
}) {
    const editorRef = React.useRef<EditorArea>();
    const rendererRef = React.useRef<Renderer>();

    const dispatchEditor = React.useCallback((action: editorActions.EditorAction): void => {
        if (props.state.type !== AppStage.Ready) {
            return;
        }

        switch (action.type) {
            case editorActions.EditorActionType.SetDrawTool:
                {
                    return props.dispatch(new actions.UpdateDrawing({
                        ...props.state.editorState.drawingSettings,
                        tool: action.tool,
                    }));
                }
            case editorActions.EditorActionType.IncrementStroke:
                {
                    return dispatchEditor(new editorActions.SetStroke(props.state.editorState.drawingSettings.strokeSize + action.by));
                }
            case editorActions.EditorActionType.SetStroke:
                {
                    return props.dispatch(new actions.UpdateDrawing({
                        ...props.state.editorState.drawingSettings,
                        strokeSize: clamp(action.stroke, 1, 500)
                    }));
                }
            case editorActions.EditorActionType.SetWeight:
                {
                    return props.dispatch(new actions.UpdateDrawing({
                        ...props.state.editorState.drawingSettings,
                        frameShift: action.weight,
                    }));
                }
            case editorActions.EditorActionType.QuickShift:
                {
                    editorRef.current?.quickMask(action.quickShiftType);
                    return;
                }
            default:
                {
                    throw new Error(`Unknown editor action ${action}`);
                }
        }
    }, [props.state, props.dispatch]);

    React.useEffect(() => {
        const listerner = (e: KeyboardEvent) => {
            if (props.state.type !== AppStage.Ready) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case '=': return dispatchEditor(new editorActions.IncrementStroke(1));
                case '-': return dispatchEditor(new editorActions.IncrementStroke(-1));
                case '+': return dispatchEditor(new editorActions.IncrementStroke(5));
                case '_': return dispatchEditor(new editorActions.IncrementStroke(-5));

                case 'x':
                    {
                        const tool = props.state.editorState.drawingSettings.tool === DrawingToolType.Brush
                            ? DrawingToolType.Erase
                            : DrawingToolType.Brush;
                        return dispatchEditor(new editorActions.SetDrawTool(tool));
                    }

                case Tools.Brush.key: return dispatchEditor(new editorActions.SetDrawTool(DrawingToolType.Brush));
                case Tools.Erase.key: return dispatchEditor(new editorActions.SetDrawTool(DrawingToolType.Erase));
                case Tools.Line.key: return dispatchEditor(new editorActions.SetDrawTool(DrawingToolType.Line));

                case ' ': return props.dispatch(new actions.SetPlaying(!props.state.editorState.playback.playing));

                case 'arrowright': return props.dispatch(new actions.IncrementFrame(1));
                case 'arrowleft': return props.dispatch(new actions.IncrementFrame(-1));
            }
        };
        document.addEventListener('keydown', listerner);
        return () => {
            document.removeEventListener('keydown', listerner);
        };
    }, [props.state, props.dispatch]);

    const editorState = props.state.type === AppStage.Ready
        ? props.state.editorState
        : EditorState.empty;

    return (
        <>
            <SideBar
                dispatch={props.dispatch}
                dispatchEditor={dispatchEditor}
                editorState={editorState} />

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '100%',
                overflow: 'hidden',
            }}>
                <EditorArea
                    ref={editorRef as React.Ref<EditorArea>}
                    rendererRef={rendererRef}
                    dispatch={props.dispatch}
                    editorState={editorState}
                    didTouchLayer={props.didTouchLayer} />

                <EditorBottomBar
                    dispatch={props.dispatch}
                    editorState={editorState}
                    rendererRef={rendererRef} />
            </div>
        </>
    );
}

