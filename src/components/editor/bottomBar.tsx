import * as React from 'react';
import styled from 'styled-components';
import { EditorState, RenderMode } from '../../model/editorState';
import { Renderer } from '../../renderer';
import * as actions from '../../views/main/actions';
import { ExportButton } from './exportButton';

const EditorStat = styled('span')`
    margin-right: 1em;
    display: inline-block;
`;

export function EditorBottomBar(props: {
    dispatch: React.Dispatch<actions.Actions>,
    editorState: EditorState,
    rendererRef: React.RefObject<Renderer | undefined>
}) {
    return (
        <div style={{
            borderTop: '1px solid lightgrey',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            backgroundColor: '#eee',
            padding: '0 4px',
        }}>
            <div style={{ fontFamily: 'var(--monospace-font-family)', fontSize: '12px', textAlign: 'left', }}>
                <EditorStat>width={props.editorState.doc.width}px</EditorStat>
                <EditorStat>height={props.editorState.doc.height}px</EditorStat>
                <EditorStat>frames={props.editorState.doc.frameCount}</EditorStat>
            </div>
            <div style={{
                display: 'flex',
                alignItems: 'start',
            }}>
                <ExportButton
                    editorState={props.editorState}
                    beginExport={() => { console.log('begin export'); }}
                    endExport={() => { console.log('end export'); }}
                    rendererRef={props.rendererRef}
                    style={{
                        display: 'block',
                        marginRight: '2em'
                    }} />

                <RenderModeSelector
                    dispatch={props.dispatch}
                    renderMode={props.editorState.playback.renderMode}
                    style={{
                        display: 'block',
                        marginRight: '1em'
                    }} />

                <ZoomControl
                    value={props.editorState.playback.zoom}
                    onChange={value => props.dispatch(new actions.ChangeZoom(value))}
                    style={{
                        display: 'block',
                    }} />
            </div>
        </div>
    );
}


function ZoomControl(props: {
    value: number,
    onChange: (value: number) => void,
    style?: React.CSSProperties,
}) {
    const zoomLevels = [0.25, 0.5, 1, 1.5, 2];

    const options = zoomLevels.map((value: number) =>
        <option key={value} value={value}>{value * 100}%</option>);

    return (
        <select value={props.value} onChange={e => props.onChange(+e.target.value)} style={props.style}>
            {options}
        </select>
    );
}

function RenderModeSelector(props: {
    dispatch: React.Dispatch<actions.Actions>,
    renderMode: RenderMode,
    style?: React.CSSProperties,
}) {
    const onChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        props.dispatch(new actions.SetRenderingMode(e.target.value === 'mask' ? RenderMode.Mask : RenderMode.Normal));
    };

    return (
        <select value={props.renderMode === RenderMode.Mask ? 'mask' : 'normal'} onChange={onChange} style={props.style}>
            <option value='normal'>Normal</option>
            <option value='mask'>Mask</option>
        </select>
    );
}