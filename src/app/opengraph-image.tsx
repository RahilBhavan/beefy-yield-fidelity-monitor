import { ImageResponse } from 'next/og';

export const alt = 'Yield/Fidelity — on-chain yield decision support for Beefy vaults on Base';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
    return new ImageResponse(
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: '#FE5238',
                color: '#1E1E1E',
                padding: '58px 64px',
                border: '14px solid #1E1E1E',
                fontFamily: 'Arial, sans-serif',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 700 }}>
                <span>YIELD/FIDELITY</span>
                <span>BASE · CHAIN 8453</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 86, lineHeight: 0.95, fontWeight: 900, letterSpacing: '-5px' }}>
                    FROM HEADLINE YIELD
                </span>
                <span style={{ fontSize: 86, lineHeight: 0.95, fontWeight: 900, letterSpacing: '-5px' }}>
                    TO DECISION SUPPORT.
                </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, fontWeight: 700 }}>
                <span>BREAK-EVEN · REALIZED PPS · EXCEPTION REVIEW</span>
                <span>RAHIL BHAVAN</span>
            </div>
        </div>,
        size,
    );
}
