import { Modal } from '@material-ui/core';
import * as React from 'react';
import { EditorState } from '../../model/editorState';
import { Renderer } from '../../renderer';
import { exportGif } from '../../renderer/renderGif';
import { LoadingSpinner } from '../loading_spinner';

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace State {
    export const enum Type {
        None,
        Exporting,
        Exported
    }

    export const None = { type: Type.None } as const;

    export const Exporting = { type: Type.Exporting } as const;

    export class Exported {
        readonly type = Type.Exported;

        constructor(
            public readonly url: string
        ) { }
    }

    export type State = typeof None | typeof State.Exporting | Exported;
}

export function ExportButton(props: {
    editorState: EditorState,
    beginExport: () => void,
    endExport: () => void,
    rendererRef: React.RefObject<Renderer | undefined>,
    style?: React.CSSProperties,
}) {
    const [state, setState] = React.useState<State.State>(State.None);

    const doExport = async () => {
        if (!props.rendererRef.current) {
            return;
        }

        setState(State.Exporting);
        props.beginExport();
        const url = await exportGif(props.rendererRef.current, props.editorState.doc);
        props.endExport();
        setState(new State.Exported(url));
    };

    const onCancel = () => {
        setState(State.None);
    };

    return (
        <>
            <button
                onClick={doExport}
                disabled={state.type === State.Type.Exporting}
                style={props.style}
            >Export</button>
            <Modal open={state.type === State.Type.Exporting || state.type === State.Type.Exported}>
                <div style={{
                    'display': 'flex',
                    margin: '0 auto',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: '100%',
                    width: '100%',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.7)',
                }}>
                    <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -1 }} onMouseDown={onCancel} />
                    <div style={{
                        margin: 'auto',
                        background: 'var(--background-color)',
                        maxWidth: '100vw',
                        padding: '1em',
                    }}>
                        <button className='material-icons' onMouseDown={onCancel} style={{
                            display: 'block',
                            marginBottom: '0.8em',
                            marginRight: '0.8em',
                        }}>close</button>

                        <div style={{
                            maxWidth: '100%',
                            minWidth: '200px'
                        }}>
                            {state.type === State.Type.Exported
                                ? <>
                                    <img src={state.url} style={{
                                        maxWidth: '100%',
                                    }} />
                                </>
                                : <>
                                    <h2>Generating</h2>
                                    <LoadingSpinner active={true} />
                                </>}
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}