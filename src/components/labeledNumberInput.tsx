import * as React from 'react';
import { clamp } from '../util/math';

export function LabeledNumberInput(props: {
    label: string;
    value: number;
    min: number;
    max: number;
    disabled?: boolean;
    onChange: (value: number) => void;
}) {
    return (
        <div>
            <label htmlFor={props.label} style={{ fontFamily: 'var(--monospace-font-family)', fontSize: '0.8em' }}>{props.label}</label>=<NumberInput {...props} />
        </div>
    );
}

export function NumberInput(props: {
    label?: string;
    value: number;
    min: number;
    max: number;
    disabled?: boolean | undefined;
    onChange: (value: number) => void;
}) {
    return <input id={props.label}
        type='text'
        pattern={props.min < 0 ? '\\\\-?[0-9\\.]*' : '[0-9\\.]*'}
        disabled={props.disabled}
        value={props.value}
        onChange={e => {
            const value = clamp(+e.target.value, props.min, props.max);
            props.onChange(isNaN(value) ? 0 : value);
        }}
        style={{
            maxWidth: '40px',
            textAlign: 'center',
        }} />;
}

