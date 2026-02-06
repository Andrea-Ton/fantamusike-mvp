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
    console.time('OG Generation Total');
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

        console.timeEnd('OG Generation Total');
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
                    {/* Background elements for depth */}
                    <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.2 }}>
                        <div style={{ display: 'flex', position: 'absolute', top: '-500px', left: '-500px', width: '1000px', height: '1000px', backgroundColor: 'rgba(168, 85, 247, 0.3)', filter: 'blur(150px)', borderRadius: '500px' }}></div>
                        <div style={{ display: 'flex', position: 'absolute', bottom: '-500px', right: '-500px', width: '1000px', height: '1000px', backgroundColor: 'rgba(37, 99, 235, 0.3)', filter: 'blur(150px)', borderRadius: '500px' }}></div>
                    </div>

                    {/* Header: Logo + Title */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '60px', zIndex: 10 }}>
                        {logoData ? (
                            <img
                                src={logoData as any}
                                alt="Logo"
                                style={{ width: '100px', height: '100px', marginRight: '30px', objectFit: 'contain' }}
                            />
                        ) : (
                            <div style={{
                                width: '100px',
                                height: '100px',
                                marginRight: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                                fontSize: '50px',
                            }}>
                                <span></span>
                            </div>
                        )}
                        <div style={{ display: 'flex', fontSize: '52px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-4px' }}>
                            <span>WWW.FANTA.MUSIKE.FM</span>
                        </div>
                    </div>


                    {/* Captain Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '80px', zIndex: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', color: '#6b7280', fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '6px' }}>
                            <div style={{ width: '60px', height: '2px', backgroundColor: '#a855f7', marginRight: '20px' }}></div>
                            <span>Capitano</span>
                            <div style={{ width: '60px', height: '2px', backgroundColor: '#a855f7', marginLeft: '20px' }}></div>
                        </div>

                        <div style={{
                            position: 'relative',
                            width: '450px',
                            height: '450px',
                            borderRadius: '60px',
                            display: 'flex',
                            overflow: 'hidden',
                            border: '4px solid rgba(168, 85, 247, 0.3)',
                            background: '#0a0a0a',
                            boxShadow: '0 20px 80px rgba(168, 85, 247, 0.4)'
                        }}>
                            {captainImage ? (
                                <img src={captainImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : null}

                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '180px',
                                backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                paddingBottom: '40px'
                            }}>
                                <div style={{ display: 'flex', fontSize: '48px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-2px' }}>
                                    <span>{captainName}</span>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Roster Grid (2x2) */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', width: '650px', justifyContent: 'center', gap: '40px', marginBottom: '40px', zIndex: 10 }}>
                        {rosterSlots.slice(0, 4).map((artist, index) => (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '280px' }}>
                                <div style={{
                                    width: '240px',
                                    height: '240px',
                                    borderRadius: '40px',
                                    overflow: 'hidden',
                                    marginBottom: '20px',
                                    border: '2px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    position: 'relative',
                                    display: 'flex',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                                }}>
                                    {artist?.image ? (
                                        <img src={artist.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : null}
                                </div>
                                <div style={{ display: 'flex', fontSize: '24px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '-1px' }}>
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
                        width: '920px',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                        padding: '20px 40px',
                        borderRadius: '40px',
                        marginBottom: '40px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        zIndex: 20,
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px', letterSpacing: '4px' }}>
                            <span>Manager</span>
                        </div>
                        <div style={{ display: 'flex', fontSize: '45px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '4px' }}>
                            <span>{username}</span>
                        </div>
                    </div>


                    {/* Footer Stats */}
                    <div style={{
                        display: 'flex',
                        width: '920px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderRadius: '60px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '45px',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        marginBottom: '30px',
                        marginTop: '0px',
                        zIndex: 10,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', backgroundColor: 'rgba(168, 85, 247, 0.05)', filter: 'blur(80px)', borderRadius: '500px' }}></div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '280px' }}>
                            <div style={{ display: 'flex', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: '#6b7280', marginBottom: '10px', letterSpacing: '4px' }}>
                                <span>Punti Totali</span>
                            </div>
                            <div style={{ display: 'flex', fontSize: '72px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: '#ffffff' }}>
                                <span>{totalScore}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '280px' }}>
                            <div style={{ display: 'flex', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: '#6b7280', marginBottom: '10px', letterSpacing: '4px' }}>
                                <span>Posizione</span>
                            </div>
                            <div style={{ display: 'flex', fontSize: '72px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: '#a855f7' }}>
                                <span>#{rank}</span>
                            </div>
                        </div>

                        {percentile && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '280px' }}>
                                <div style={{ display: 'flex', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: '#6b7280', marginBottom: '10px', letterSpacing: '4px' }}>
                                    <span>Ranking</span>
                                </div>
                                <div style={{ display: 'flex', fontSize: '56px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: '#fbbf24' }}>
                                    <span>Top {percentile}</span>
                                </div>
                            </div>
                        )}
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
