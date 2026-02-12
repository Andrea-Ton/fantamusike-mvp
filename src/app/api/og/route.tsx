import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// export const runtime = 'edge';

// --- Load Assets from Filesystem ---
// This makes generation instant and avoids network issues.
const assetsPath = path.join(process.cwd(), 'src/assets/fonts');
const logoPath = path.join(process.cwd(), 'public/logo.png');
const logoPinkPath = path.join(process.cwd(), 'public/logo_pink.png');

// Note: We use try-catch/readFileSync for reliability.
let fontDataRegular: ArrayBuffer | null = null;
let fontDataBold: ArrayBuffer | null = null;
let fontDataBlackItalic: ArrayBuffer | null = null;
let logoData: ArrayBuffer | null = null;
let logoPinkData: ArrayBuffer | null = null;

try {
    const regular = fs.readFileSync(path.join(assetsPath, 'inter-400.woff'));
    const bold = fs.readFileSync(path.join(assetsPath, 'inter-700.woff'));
    const italic = fs.readFileSync(path.join(assetsPath, 'inter-900-italic.woff'));
    const logo = fs.readFileSync(logoPath);
    const logoPink = fs.readFileSync(logoPinkPath);

    // Precise conversion from Node Buffer to ArrayBuffer for Satori/DataView
    const toArrayBuffer = (buf: Buffer) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    fontDataRegular = toArrayBuffer(regular) as ArrayBuffer;
    fontDataBold = toArrayBuffer(bold) as ArrayBuffer;
    fontDataBlackItalic = toArrayBuffer(italic) as ArrayBuffer;
    logoData = toArrayBuffer(logo) as ArrayBuffer;
    logoPinkData = toArrayBuffer(logoPink) as ArrayBuffer;
} catch (e) {
    console.error('Failed to load local assets:', e);
}

async function generateImage(data: any) {
    const {
        username = 'Manager',
        totalScore = '0',
        rank = '-',
        seasonName = 'Season 1',
        percentile,
        captainName = 'Nessuno',
        captainImage,
        roster = []
    } = data;

    const rosterSlots = [...roster];
    while (rosterSlots.length < 4) {
        rosterSlots.push({ name: "", image: null });
    }

    const fonts: any[] = [];
    if (fontDataRegular) fonts.push({ name: 'Inter', data: fontDataRegular, style: 'normal', weight: 400 });
    if (fontDataBold) fonts.push({ name: 'Inter', data: fontDataBold, style: 'normal', weight: 700 });
    if (fontDataBlackItalic) fonts.push({ name: 'Inter', data: fontDataBlackItalic, style: 'italic', weight: 900 });

    const getFontSize = (text: string, baseSize: number, charLimit: number) => {
        if (text.length <= charLimit) return baseSize;
        return Math.floor(baseSize * (charLimit / text.length));
    };

    const scoreFontSize = getFontSize(totalScore, 48, 4);
    const rankFontSize = getFontSize(`#${rank}`, 48, 4);
    const percentileText = percentile ? `Top ${percentile}` : '';
    const percentileFontSize = getFontSize(percentileText, 38, 7);

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#050507',
                    fontFamily: '"Inter"',
                    color: 'white',
                    position: 'relative',
                }}
            >
                {/* Background elements */}
                <div style={{
                    display: 'flex',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 0,
                }}>
                    <div style={{
                        display: 'flex',
                        position: 'absolute',
                        top: '-333px',
                        left: '-333px',
                        width: '666px',
                        height: '666px',
                        backgroundImage: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
                        borderRadius: '333px',
                        opacity: 0.2,
                    }}></div>
                    <div style={{
                        display: 'flex',
                        position: 'absolute',
                        bottom: '-333px',
                        right: '-333px',
                        width: '666px',
                        height: '666px',
                        backgroundImage: 'radial-gradient(circle, rgba(37, 99, 235, 0.4) 0%, transparent 70%)',
                        borderRadius: '333px',
                        opacity: 0.2,
                    }}></div>

                    {/* Pink Logo Watermark */}
                    <div style={{
                        display: 'flex',
                        width: '800px',
                        height: '800px',
                        opacity: 0.10,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        {logoPinkData && <img src={logoPinkData as any} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                    </div>
                </div>

                {/* Content Wrapper (Relative, with padding) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    padding: '54px',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    zIndex: 10, // Ensure content is above background
                }}>

                    {/* Header: Logo + Title */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        {logoData ? (
                            <img
                                src={logoData as any}
                                alt="Logo"
                                style={{ width: '66px', height: '66px', marginRight: '20px', objectFit: 'contain' }}
                            />
                        ) : (
                            <div style={{
                                width: '66px',
                                height: '66px',
                                marginRight: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                                fontSize: '34px',
                            }}>
                                <span></span>
                            </div>
                        )}
                        <div style={{ display: 'flex', fontSize: '34px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-2px' }}>
                            <span>fantamusiké</span>
                        </div>
                    </div>


                    {/* Captain Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '42px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', color: '#6b7280', fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px' }}>
                            <div style={{ width: '40px', height: '2px', backgroundColor: '#a855f7', marginRight: '14px' }}></div>
                            <span>Capitano</span>
                            <div style={{ width: '40px', height: '2px', backgroundColor: '#a855f7', marginLeft: '14px' }}></div>
                        </div>

                        <div style={{
                            position: 'relative',
                            width: '300px',
                            height: '300px',
                            borderRadius: '40px',
                            display: 'flex',
                            overflow: 'hidden',
                            border: '3px solid rgba(168, 85, 247, 0.4)',
                            background: '#0a0a0a',
                        }}>
                            {captainImage ? (
                                <img src={captainImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : null}

                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '120px',
                                backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                paddingBottom: '26px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    fontSize: `${getFontSize(captainName, 32, 12)}px`,
                                    fontWeight: 900,
                                    fontStyle: 'italic',
                                    textTransform: 'uppercase',
                                    letterSpacing: '-1px',
                                    textAlign: 'center'
                                }}>
                                    <span>{captainName}</span>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Roster Grid (2x2) */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', width: '500px', justifyContent: 'center', gap: '26px', marginBottom: '26px' }}>
                        {rosterSlots.slice(0, 4).map((artist, index) => (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '210px' }}>
                                <div style={{
                                    width: '180px',
                                    height: '180px',
                                    borderRadius: '30px',
                                    overflow: 'hidden',
                                    marginBottom: '14px',
                                    border: '2px solid rgba(255,255,255,0.15)',
                                    background: 'rgba(255,255,255,0.05)',
                                    position: 'relative',
                                    display: 'flex',
                                }}>
                                    {artist?.image ? (
                                        <img src={artist.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : null}
                                </div>
                                <div style={{ display: 'flex', fontSize: '18px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '-1px' }}>
                                    <span>{artist?.name || '-'}</span>
                                </div>
                            </div>
                        ))}
                    </div>


                    {/* Manager Name Hero Section (Full Width) */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '613px',
                        backgroundColor: 'rgba(168, 85, 247, 0.15)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        padding: '14px 26px',
                        borderRadius: '26px',
                        marginBottom: '26px',
                        zIndex: 20,
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', color: '#6b7280', marginBottom: '5px', letterSpacing: '3px' }}>
                            <span>Manager</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            fontSize: `${getFontSize(username, 30, 18)}px`,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            marginBottom: '5px',
                            letterSpacing: '3px',
                            textAlign: 'center'
                        }}>
                            <span>{username}</span>
                        </div>
                    </div>


                    {/* Footer Stats */}
                    <div style={{
                        display: 'flex',
                        width: '613px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '40px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        padding: '22px',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        marginBottom: '20px',
                        marginTop: '0px',
                        zIndex: 10,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            display: 'flex',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '200px',
                            height: '200px',
                            backgroundImage: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
                            borderRadius: '100px'
                        }}></div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
                            <div style={{ display: 'flex', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px', letterSpacing: '3px' }}>
                                <span>Punti</span>
                            </div>
                            <div style={{ display: 'flex', fontSize: `${scoreFontSize}px`, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: '#ffffff' }}>
                                <span>{totalScore}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
                            <div style={{ display: 'flex', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px', letterSpacing: '3px' }}>
                                <span>Posizione</span>
                            </div>
                            <div style={{ display: 'flex', fontSize: `${rankFontSize}px`, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: '#a855f7' }}>
                                <span>#{rank}</span>
                            </div>
                        </div>

                        {percentile && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '190px' }}>
                                <div style={{ display: 'flex', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px', letterSpacing: '3px' }}>
                                    <span>Ranking</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    fontSize: `${percentileFontSize}px`,
                                    fontWeight: 900,
                                    fontStyle: 'italic',
                                    textTransform: 'uppercase',
                                    color: '#fbbf24',
                                    textAlign: 'center'
                                }}>
                                    <span>{percentileText}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ),
        {
            width: 720,
            height: 1280,
            fonts: fonts.length > 0 ? fonts : undefined,
        },
    );
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const data: any = {
            username: searchParams.get('username'),
            totalScore: searchParams.get('totalScore'),
            rank: searchParams.get('rank'),
            seasonName: searchParams.get('seasonName'),
            percentile: searchParams.get('percentile'),
            captainName: searchParams.get('captainName'),
            captainImage: searchParams.get('captainImage'),
            roster: []
        };

        for (let i = 0; i < 4; i++) {
            const name = searchParams.get(`rosterName${i}`);
            const image = searchParams.get(`rosterImage${i}`);
            if (name) {
                data.roster.push({ name, image });
            }
        }

        return await generateImage(data);
    } catch (e: any) {
        return new Response(`Failed to generate the image`, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        return await generateImage(data);
    } catch (e: any) {
        return new Response(`Failed to generate the image`, { status: 500 });
    }
}
