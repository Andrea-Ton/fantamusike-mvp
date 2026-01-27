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
        // Handle bold: **content** -> <strong>content</strong>
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
            <Text key={i} className="text-gray-300 text-[16px] leading-[24px] my-4">
                {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="text-white">{part.slice(2, -2)}</strong>;
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
    ctaText = "Lascia il segno su FantaMusiké!",
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
                                brand: "#13131a",
                                primary: "#7c3aed",
                                secondary: "#ec4899",
                            },
                        },
                    },
                }}
            >
                <Body className="w-full h-full font-sans text-white p-[20px] bg-[#13131a]">
                    <Container className="border border-white/20 rounded-2xl my-[40px] mx-auto p-[20px] max-w-[700px] bg-[#1c1c26]">

                        {/* Logo Section */}
                        <Section className="mt-[32px] text-center">
                            <Img
                                src="https://fantamusike-mvp.vercel.app/logo.png"
                                width="80"
                                height="80"
                                alt="FantaMusiké"
                                className="my-0 mx-auto rounded-full border-2 border-[#7c3aed]"
                            />
                            <Heading className="text-white text-[24px] font-bold text-center p-0 my-[20px] mx-0">
                                {headingText}
                            </Heading>
                        </Section>

                        {/* Main Message */}
                        <Section className="px-[10px]">
                            {formatText(bodyText)}

                            {/* Call To Action Button */}
                            {showCta && (
                                <Section className="text-center mt-[32px] mb-[32px]">
                                    <Button
                                        className="bg-[#7c3aed] rounded-[15px] text-white text-[14px] font-bold no-underline text-center px-8 py-4"
                                        href={ctaUrl}
                                    >
                                        {ctaText}
                                    </Button>
                                </Section>
                            )}
                        </Section>

                        {/* Footer */}
                        <Section className="border-t border-white/20 mt-[30px] pt-[20px]">
                            <Text className="text-gray-500 text-[12px] text-center">
                                {footerText}
                            </Text>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html >
    );
};

export default FantaMusikeBetaEmail;