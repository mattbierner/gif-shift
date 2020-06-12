import * as React from 'react';
import styled from 'styled-components';
import { NumberInput } from './labeledNumberInput';

const Input = styled.input`
    display: block;
    width: 100%;
`;

/**
 * Number slider with a title and description of values.
 */
export function LabeledSlider(props: {
    label?: string,
    units?: string,
    value: number,
    min: number,
    max: number,
    onChange: (value: number) => void,
    style?: React.CSSProperties,
}) {
    const title = props.label ? (<div className='control-title'>{props.label}</div>) : '';

    return (
        <div style={props.style}>
            {title}

            <Input className="slider"
                type="range"
                min={props.min}
                max={props.max}
                value={props.value}
                onChange={e => props.onChange(+e.target.value)} />

            <span className="min label" style={{
                display: 'block',
                float: 'left',
                marginLeft: '0.2em',
            }}>{props.min}</span>

            <span className="max label" style={{
                display: 'block',
                float: 'right',
                marginRight: '0.2em',
            }}>{props.max}</span>

            <NumberInput
                value={props.value}
                min={props.min}
                max={props.max}
                onChange={props.onChange} />
        </div>
    );
}
