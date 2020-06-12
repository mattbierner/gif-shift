import * as React from 'react';
import { AppStage, AppState } from '../../model/appState';
import { Gif } from '../../util/loadGif';
import * as actions from '../../views/main/actions';
import { LoadingSpinner } from '../loading_spinner';
import { SearchOverlay } from '../searchOverlay';
import { LayerView } from './layer';

interface TimelineState {
    showGifPickerFor: undefined | boolean;
}

export function Timeline(props: {
    dispatch: React.Dispatch<actions.Actions>;
    state: AppState,
}) {
    const [state, setState] = React.useState<TimelineState>({
        showGifPickerFor: undefined
    });

    function onSelectGif() {
        setState({ showGifPickerFor: true });
    }

    function didSelectGif(gif: Gif | undefined): void {
        if (!state.showGifPickerFor) {
            return;
        }

        if (gif) {
            props.dispatch(new actions.SetGif(gif));
        }

        setState({ showGifPickerFor: undefined });
    }

    let body: JSX.Element;
    if (props.state.type === AppStage.Loading) {
        body = (
            <LoadingSpinner active />
        );
    } else {
        const editorState = props.state.editorState;
        body = (
            <>
                <LayerView
                    model={editorState.doc}
                    renderMode={editorState.playback.renderMode}
                    dispatch={props.dispatch}
                    playback={editorState.playback}
                    onSelectGif={() => onSelectGif()} />
            </>
        );
    }

    return (
        <div style={{
            gridArea: 'timeline',
            borderTop: '1px solid lightgray',
            maxHeight: '50vh',
            minHeight: '40px',
            overflowY: 'scroll',
            overflowX: 'hidden',
        }}>
            {body}
            <SearchOverlay show={!!state.showGifPickerFor} onDidClose={didSelectGif} />
        </div>
    );
}
