import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface FantaMusikeBetaEmailProps {
    previewText?: string;
    headingText?: string;
    bodyText?: string;
    ctaText?: string;
    ctaUrl?: string;
    footerText?: string;
    showCta?: boolean;
}

// Simple helper to parse **bold** into <strong> tags
const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
            <Text key={i} className="text-gray-400 text-[15px] leading-[26px] my-4 font-medium">
                {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="text-white font-bold">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                })}
            </Text>
        );
    });
};

export const FantaMusikeBetaEmail = ({
    previewText = "Sei uno dei primi 40 Manager. Il tuo parere conta.",
    headingText = "Season Zero",
    bodyText = "Ciao Manager,\n\nSe stai leggendo questa mail, fai parte dei Pionieri del FantaMusiké. Sei tra i primissimi ad aver messo le mani sull’app, a esplorarla, stressarla e dirci cosa funziona (e cosa no). In breve: ci stai aiutando a costruirla.\n\nFantaMusiké è ancora in Beta: stiamo testando, bilanciando e migliorando ogni meccanica. Il nostro obiettivo non è creare 'solo' un fantasy game, ma reinventare gradualmente il modo in cui i fan vivono la musica.\n\nLa Season 1 nascerà dalle scelte che facciamo oggi. Anche grazie a te.",
    ctaText = "LASCIA IL SEGNO",
    ctaUrl = "https://forms.gle/6BErAaxK3aCjPsUY8",
    footerText = "© 2026 Musiké. Tutti i diritti riservati.",
    showCta = true,
}: FantaMusikeBetaEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                brand: "#010103",
                                surface: "#0d0d12",
                                primary: "#a855f7",
                                accent: "#d946ef",
                            },
                        },
                    },
                }}
            >
                <Body className="w-full h-full font-sans text-white p-[20px] bg-[#010103]">
                    {/* Main Container with solid border and background for stability */}
                    <Container className="my-[40px] mx-auto max-w-[600px] bg-[#0d0d12] border-t-[3px] border-t-[#a855f7] border-l border-r border-b border-[#1a1c22] rounded-b-2xl">

                        {/* Internal padding wrapper for consistent spacing across clients */}
                        <Section className="p-[40px]">
                            {/* Logo Section */}
                            <Section className="text-center">
                                <Img
                                    src="https://fanta.musike.fm/logo.png"
                                    width="70"
                                    height="70"
                                    alt="FantaMusiké"
                                    className="my-0 mx-auto rounded-[20px]"
                                />
                                <Heading className="text-white text-[32px] font-black italic uppercase tracking-tighter text-center p-0 my-[32px] mx-0">
                                    {headingText}
                                </Heading>
                            </Section>

                            {/* Main Message */}
                            <Section>
                                {formatText(bodyText)}

                                {/* Call To Action Button */}
                                {showCta && (
                                    <Section className="text-center mt-[48px] mb-[24px]">
                                        <Button
                                            className="bg-[#a855f7] rounded-[16px] text-white text-[12px] font-black italic tracking-tighter uppercase no-underline text-center px-[40px] py-[20px]"
                                            href={ctaUrl}
                                            style={{ display: 'inline-block' }}
                                        >
                                            {ctaText}
                                        </Button>
                                    </Section>
                                )}
                            </Section>

                            {/* Divider - Solid Hex to ensure visibility */}
                            <Section className="border-t border-[#26262e] mt-[48px] mb-[32px]" />

                            {/* Footer */}
                            <Section>
                                <Text className="text-gray-600 text-[9px] font-black tracking-[0.2em] text-center uppercase">
                                    {footerText}
                                </Text>
                            </Section>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html >
    );
};

export default FantaMusikeBetaEmail;