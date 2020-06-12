import { useMediaQuery } from '@material-ui/core';
import * as React from 'react';
import styled from 'styled-components';
import { DrawingTool, quickShifts, QuickShiftType, Tools } from '../../model/drawing';
import { EditorState } from '../../model/editorState';
import * as actions from '../../views/main/actions';
import { LabeledNumberInput } from '../labeledNumberInput';
import { LabeledSlider } from '../labeledSlider';
import * as editorActions from './actions';


export function SideBar(props: {
    dispatch: React.Dispatch<actions.Actions>,
    dispatchEditor: React.Dispatch<editorActions.EditorAction>,
    editorState: EditorState,
}) {
    const createTool = (tool: DrawingTool): JSX.Element => {
        return <Tool key={tool.type} tool={tool}
            selected={props.editorState.drawingSettings.tool === tool.type}
            onClick={() => props.dispatchEditor(new editorActions.SetDrawTool(tool.type))} />;
    };

    const maxWidth700 = useMediaQuery('(max-width:700px)');

    return (
        <div style={{
            gridArea: 'side-bar',
            paddingBottom: '1em',
            width: '100%',
            maxWidth: '600px',
            margin: '0 auto',
            display: 'grid',
            gridTemplate: maxWidth700
                ? `
                    'tools'
                    'shift'
                `
                : `
                    'tools shift'
                    /auto 1fr
                `,
            gridGap: maxWidth700 ? '1em' : '2em',
        }}>
            <div style={{
                gridArea: 'tools',
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.4em',
                }}>
                    {createTool(Tools.Brush)}
                    {createTool(Tools.Erase)}
                    {createTool(Tools.Line)}
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <LabeledNumberInput
                        label="stroke"
                        value={props.editorState.drawingSettings.strokeSize}
                        min={1}
                        max={500}
                        onChange={value => props.dispatchEditor(new editorActions.SetStroke(value))} />

                    <QuickShiftTool dispatch={props.dispatchEditor} />
                </div>
            </div>

            <div style={{
                gridArea: 'shift',
                alignSelf: 'center',
            }}>
                <LabeledSlider
                    label="Frame Shift"
                    value={props.editorState.drawingSettings.frameShift}
                    min={-props.editorState.doc.frameCount}
                    max={props.editorState.doc.frameCount}
                    onChange={value => props.dispatchEditor(new editorActions.SetWeight(value))}
                    style={{
                        width: 'calc(100% - 2em)',
                        margin: '0 1em',
                        fontFamily: 'var(--monospace-font-family)',
                        fontSize: '0.8em',
                    }} />
            </div>
        </div>
    );
}


const ToolButton = styled.button<{
    tool: DrawingTool,
    selected?: boolean
}>`
    display: block;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 100px;
    margin: 0.4em;
    position: relative;
    background-color: ${props => props.selected ? `var(--brand-color)` : 'var(--lightest-gray)'};

    &:hover {
        background-color: var(--brand-color);
    }

    &:active {
        opacity: 0.8;
    }

    :after {
        display: block;
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${ props => props.selected ? `var(--background-color)` : 'var(--text-color)'};

        mask: ${ props => `url(${props.tool.icon})`};
        mask-repeat: no-repeat;
        mask-position: center;
        mask-size: 60%;
    }

    &:hover:after {
        background-color: var(--background-color);
    }
`;

function Tool(props: {
    tool: DrawingTool;
    selected?: boolean,
    onClick: () => void,
}) {
    return (
        <ToolButton
            onClick={props.onClick}
            title={`${props.tool.title} (${props.tool.key.toUpperCase()})`}
            tool={props.tool}
            selected={props.selected} />
    );
}

function QuickShiftTool(props: {
    dispatch: React.Dispatch<editorActions.EditorAction>,
    disabled?: boolean
}) {
    const options = Array.from(quickShifts.values()).map(mask =>
        <option key={mask.type} value={mask.type}>{mask.title}</option>);

    const onChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const action = quickShifts.get(+e.target.value as QuickShiftType);
        if (action) {
            props.dispatch(new editorActions.QuickShift(action.type));
        }
    }, [props.dispatch]);

    return (
        <select
            disabled={props.disabled}
            value='none'
            onChange={onChange}
            style={{
                display: 'block',
                margin: '0 1em',
            }}
        >
            <option value=''>Quick Shift</option>
            <option disabled>-----</option>
            {options}
        </select>
    );
}

