import Icon from '@material-ui/core/Icon';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';
import { Document } from '../../model/document';
import { PlaybackSettings, RenderMode } from '../../model/editorState';
import { loadGifFromFile } from '../../util/loadGif';
import * as actions from '../../views/main/actions';
import { TimelineFrames } from './frames';


const LayerHeader = styled.div`
    padding: 0.4em 1em;
    padding-left: 0.2em;
    border-right: 1px solid black;
    
    display: flex;
    flex-direction: row;
    align-items: center;
    
    white-space: nowrap;

    & > * {
        display: block;
    }
`;

export function LayerView(props: {
    dispatch: React.Dispatch<actions.Actions>;
    playback: PlaybackSettings,
    model: Document,
    renderMode: RenderMode;
    onSelectGif: () => void,
}) {
    const onDrop = async (acceptedFiles: readonly File[]) => {
        if (!acceptedFiles.length) {
            return;
        }

        const file = acceptedFiles[0];
        const gif = await loadGifFromFile(file);
        props.dispatch(new actions.SetGif(gif));
    };

    const { getRootProps, isDragAccept } = useDropzone({ onDrop, accept: 'image/gif' });

    const maxHeight800 = useMediaQuery('(max-height:800px)');

    return (
        <div {...getRootProps()}
            className='layer'
            style={{
                outline: 'none',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                borderTop: '1px solid black',
                height: maxHeight800 ? '40px' : '60px',
                position: 'relative',
            }}>
            <LayerHeader>
                <TimelineControl
                    title="Load Gif"
                    icon='search'
                    onClick={() => props.onSelectGif()} />

                <TimelineControl
                    title={props.playback.playing ? 'Stop' : 'Play'}
                    icon={props.playback.playing ? 'stop' : 'play_arrow'}
                    onClick={() => props.dispatch(new actions.SetPlaying(!props.playback.playing))} />

            </LayerHeader>

            <TimelineFrames
                dispatch={props.dispatch}
                model={props.model}
                currentFrame={props.playback.currentFrameIndex} />

            {isDragAccept && <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: '#4447',
            }} />}
        </div>
    );
}

const TimelineButton = styled.button<{
    active?: boolean
}>`
    margin: 0 6px;
    padding: 4px;
    vertical-align: middle;
    text-align: center;

    border: none;
    border-radius: 100px;
    background: none;
    background-color: ${props => props.active ? 'var(--brand-color)' : ''};
    color: ${props => props.active ? 'var(--background-color)' : 'var(--text-color)'};

    &:active {
        opacity: 0.8;
    }

    &:disabled {
        opacity: 0.4;
    }

    &.material-icons {
        font-size: 1.6em;
    }

    &:hover:not(:disabled) {
        background-color: var(--brand-color);
        color: var(--background-color);
    }
`;

function TimelineControl(props: {
    title: string,
    icon: string,
    onClick: () => void,
    active?: boolean,
    disabled?: boolean,
}) {
    return (
        <TimelineButton
            title={props.title}
            disabled={props.disabled}
            active={props.active}
            onClick={e => {
                e.stopPropagation();
                props.onClick();
            }}>
            <Icon>{props.icon}</Icon>
        </TimelineButton>
    );
}