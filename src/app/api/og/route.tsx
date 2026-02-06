import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// export const runtime = 'edge';

// --- Load Assets from Filesystem ---
// This makes generation instant and avoids network issues.
const assetsPath = path.join(process.cwd(), 'src/assets/fonts');
const logoPath = path.join(process.cwd(), 'public/logo.png');

// Note: We use try-catch/readFileSync for reliability.
let fontDataRegular: ArrayBuffer | null = null;
let fontDataBold: ArrayBuffer | null = null;
let fontDataBlackItalic: ArrayBuffer | null = null;
let logoData: ArrayBuffer | null = null;

try {
    const regular = fs.readFileSync(path.join(assetsPath, 'inter-400.woff'));
    const bold = fs.readFileSync(path.join(assetsPath, 'inter-700.woff'));
    const italic = fs.readFileSync(path.join(assetsPath, 'inter-900-italic.woff'));
    const logo = fs.readFileSync(logoPath);

    // Precise conversion from Node Buffer to ArrayBuffer for Satori/DataView
    const toArrayBuffer = (buf: Buffer) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    fontDataRegular = toArrayBuffer(regular) as ArrayBuffer;
    fontDataBold = toArrayBuffer(bold) as ArrayBuffer;
    fontDataBlackItalic = toArrayBuffer(italic) as ArrayBuffer;
    logoData = toArrayBuffer(logo) as ArrayBuffer;
} catch (e) {
    console.error('Failed to load local assets:', e);
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Debug: Log all params
        console.log('API OG Params:', Object.fromEntries(searchParams.entries()));

        // --- Extract Data from Query Params ---
        const username = searchParams.get('username') || 'Manager';
        const totalScore = searchParams.get('totalScore') || '0';
        const rank = searchParams.get('rank') || '-';
        const seasonName = searchParams.get('seasonName') || 'Season 1';
        const percentile = searchParams.get('percentile'); // Optional

        // Captain Data
        const captainName = searchParams.get('captainName') || 'Nessuno';
        const captainImage = searchParams.get('captainImage'); // URL

        // Roster Data
        const roster = [];
        for (let i = 0; i < 4; i++) {
            const name = searchParams.get(`rosterName${i}`);
            const image = searchParams.get(`rosterImage${i}`);
            if (name) {
                roster.push({ name, image });
            }
        }

        const rosterSlots = [...roster];
        while (rosterSlots.length < 4) {
            rosterSlots.push({ name: "", image: null });
        }


        // --- Render ---
        const fonts: any[] = [];
        if (fontDataRegular) fonts.push({ name: 'Inter', data: fontDataRegular, style: 'normal', weight: 400 });
        if (fontDataBold) fonts.push({ name: 'Inter', data: fontDataBold, style: 'normal', weight: 700 });
        if (fontDataBlackItalic) fonts.push({ name: 'Inter', data: fontDataBlackItalic, style: 'italic', weight: 900 });

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        backgroundColor: '#050507',
                        backgroundImage: 'radial-gradient(circle at 50% 30%, #1a1a2e 0%, #050507 70%)',
                        padding: '80px',
                        fontFamily: '"Inter"',
                        color: 'white',
                    }}
                >
                    {/* Header: Logo + Title */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                        {logoData ? (
                            <img
                                src={logoData as any}
                                alt="Logo"
                                style={{ width: '80px', height: '80px', marginRight: '20px', objectFit: 'contain' }}
                            />
                        ) : (
                            <div style={{
                                width: '80px',
                                height: '80px',
                                marginRight: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                                fontSize: '40px',
                            }}>
                                <span>M</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', fontSize: '60px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-2px' }}>
                            <span>FantaMusiké</span>
                        </div>
                    </div>


                    {/* Captain Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '60px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', color: '#6b7280', fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px' }}>
                            <div style={{ width: '50px', height: '2px', backgroundColor: '#a855f7', marginRight: '15px' }}></div>
                            <span>Capitano</span>
                            <div style={{ width: '50px', height: '2px', backgroundColor: '#a855f7', marginLeft: '15px' }}></div>
                        </div>

                        <div style={{
                            position: 'relative',
                            width: '400px',
                            height: '400px',
                            borderRadius: '40px',
                            display: 'flex',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: '#0a0a0a',
                            boxShadow: '0 20px 50px -10px rgba(168, 85, 247, 0.3)'
                        }}>
                            {captainImage ? (
                                <img src={captainImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : null}

                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '150px',
                                backgroundImage: 'linear-gradient(to top, #000 0%, transparent 100%)',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                paddingBottom: '30px'
                            }}>
                                <div style={{ display: 'flex', fontSize: '32px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
                                    <span>{captainName}</span>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Roster Grid (2x2) */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', width: '600px', justifyContent: 'center', gap: '30px', marginBottom: '60px' }}>
                        {rosterSlots.map((artist, index) => (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '250px' }}>
                                <div style={{
                                    width: '200px',
                                    height: '200px',
                                    borderRadius: '30px',
                                    overflow: 'hidden',
                                    marginBottom: '15px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: '#111',
                                    position: 'relative',
                                    display: 'flex'
                                }}>
                                    {artist?.image ? (
                                        <img src={artist.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : null}
                                </div>
                                <div style={{ display: 'flex', fontSize: '18px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', textAlign: 'center' }}>
                                    <span>{artist?.name || '-'}</span>
                                </div>
                            </div>
                        ))}
                    </div>


                    {/* Performance Badge (if percentile exists) */}
                    {percentile && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: 'rgba(59, 7, 100, 0.5)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            padding: '15px 30px',
                            borderRadius: '50px',
                            marginBottom: '60px',
                            boxShadow: '0 0 30px rgba(168, 85, 247, 0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '24px', fontWeight: 900, fontStyle: 'italic', color: 'white' }}>
                                <span>MEGLIO DEL&nbsp;</span>
                                <span style={{ color: '#ffcc00' }}>{percentile}</span>
                                <span>&nbsp;DEI MANAGERS</span>
                            </div>
                        </div>
                    )}


                    {/* Footer Stats */}
                    <div style={{
                        display: 'flex',
                        width: '900px',
                        backgroundColor: '#111',
                        borderRadius: '40px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '40px',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        marginBottom: '40px'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ display: 'flex', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '5px', letterSpacing: '2px' }}>
                                <span>Manager</span>
                            </div>
                            <div style={{ display: 'flex', fontSize: '36px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
                                <span>{username}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ display: 'flex', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '5px', letterSpacing: '2px' }}>
                                <span>Punti Totali</span>
                            </div>
                            <div style={{ display: 'flex', fontSize: '48px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: '#e5e7eb' }}>
                                <span>{totalScore}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ display: 'flex', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '5px', letterSpacing: '2px' }}>
                                <span>Posizione</span>
                            </div>
                            <div style={{ display: 'flex', fontSize: '48px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: '#d8b4fe' }}>
                                <span>#{rank}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Watermark */}
                    <div style={{ display: 'flex', fontSize: '14px', fontWeight: 700, letterSpacing: '3px', color: '#4b5563', fontStyle: 'italic' }}>
                        <span>WWW.FANTA.MUSIKE.FM</span>
                    </div>

                </div>
            ),
            {
                width: 1080,
                height: 1920,
                fonts: fonts.length > 0 ? fonts : undefined,
            },
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
