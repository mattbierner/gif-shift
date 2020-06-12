import { useMediaQuery } from '@material-ui/core';
import * as React from 'react';
import styled from 'styled-components';
import * as config from '../config';



const Link = styled('a')`
    font-family: var(--monospace-font-family);
    font-size: 0.85em;
    
    color: var(--brand-color);
    padding-left: 1.5em;
    
    &:hover {
        color: var(--brand-color2);
    }
`;


export function SiteHeader() {
    const maxHeight700 = useMediaQuery('(max-height:700px)');
    const maxWidth600 = useMediaQuery('(max-width:600px)');

    return (
        <header className='site-header' style={{
            gridArea: 'header',
            display: 'flex',
            justifyContent: 'center',
            maxWidth: '600px',
            margin: '0 auto',
            marginTop: '0.6em',
        }}>
            <a href='.' title={config.siteTitle} style={{
                marginRight: '2em',
            }}>
                <img
                    id='site-title'
                    className='site-logo'
                    src='images/logo.svg'
                    alt={config.siteTitle}
                    style={{
                        maxWidth: maxHeight700 ? '80px' : '110px',
                        width: '100%',
                    }} />
            </a>

            <nav style={{
                display: 'flex',
                flex: 1,
                flexDirection: maxWidth600 ? 'column' : 'row',
                alignItems: 'center',
            }}>
                <Link href={config.helpUrl} target='_blank' >About</Link>
                <Link href={config.sourceUrl} target='_blank' >Source</Link>
                <Link href={config.issueUrl}>Report Issue</Link>
            </nav>
        </header>
    );
}