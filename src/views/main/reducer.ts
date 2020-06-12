import { AppStage, AppState, Ready } from '../../model/appState';
import { EditorState, RenderMode } from '../../model/editorState';
import * as actions from './actions';

function editorStateReducer(state: EditorState, action: actions.Actions): EditorState {
    switch (action.type) {
        case actions.ActionType.UpdateDoc:
            {
                return state.updateDocument(action.doc);
            }
        case actions.ActionType.SetGif:
            {
                return state
                    .updateDocument(state.doc.setGif(action.gif))
                    .setActiveFrame(0)
                    .updateDrawing({
                        ...state.drawingSettings,
                        frameShift: 1,
                    });
            }
        case actions.ActionType.UpdateDrawing:
            {
                return state.updateDrawing(action.drawing);
            }
        case actions.ActionType.SetRenderingMode:
            {
                return state.updatePlayback({
                    ...state.playback,
                    renderMode: state.playback.renderMode === RenderMode.Normal ? RenderMode.Mask : RenderMode.Normal,
                });
            }
        case actions.ActionType.ChangeZoom:
            {
                return state.updatePlayback({
                    ...state.playback,
                    zoom: action.value,
                });
            }
        case actions.ActionType.SetPlaying:
            {
                return state.setPlaying(action.playing);
            }
        case actions.ActionType.SetActiveFrame:
            {
                return state.setActiveFrame(action.index);
            }
        case actions.ActionType.IncrementFrame:
            {
                return state.setActiveFrame(state.playback.currentFrameIndex + action.by);
            }
        default:
            {
                throw new Error('Unknown action');
            }
    }
}

export function reducer(state: AppState, action: actions.Actions): AppState {
    switch (action.type) {
        case actions.ActionType.Loaded:
            {
                return new Ready(action.state);
            }
        default:
            if (state.type === AppStage.Ready) {
                return new Ready(editorStateReducer(state.editorState, action));
            }
            throw new Error('Bad state');
    }
}