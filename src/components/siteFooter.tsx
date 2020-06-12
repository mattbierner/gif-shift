import * as React from 'react';
import styled from 'styled-components';
import * as config from '../config';


const Link = styled('a')`
    color: var(--background-color);
    padding-left: 1.5em;
    
    &:hover {
        color: var(--brand-color2);
    }
`;

export function SiteFooter() {
    return (
        <footer className='site-footer' style={{
            gridArea: 'footer',
            fontFamily: 'var(--monospace-font-family)',
            color: 'var(--background-color)',
            fontSize: '0.9em',
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: 'var(--brand-color)',
            padding: '0.2em 0.4em',
        }}>
            <span className='copyright' style={{
                flex: 1
            }}>
                &copy; {config.year} <Link href='https://mattbierner.com'>Matt Bierner</Link>
            </span>
        </footer >
    );
}

