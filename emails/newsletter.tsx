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

export const FantaMusikeBetaEmail = () => {
    return (
        <Html>
            <Head />
            <Preview>Sei uno dei primi 40 Manager. Il tuo parere conta.</Preview>
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
                                FantaMusiké <span style={{ color: "rgb(169 86 229)" }}>Season Zero</span>
                            </Heading>
                        </Section>

                        {/* Main Message */}
                        <Section className="px-[10px]">
                            <Text className="text-gray-300 text-[16px] leading-[24px]">
                                Ciao Manager,
                            </Text>
                            <Text className="text-gray-300 text-[16px] leading-[24px]">
                                Se stai leggendo questa mail, fai parte dei <strong>Pionieri</strong> del FantaMusiké.<br />
                                Sei tra i primissimi ad aver messo le mani sull’app, a esplorarla, stressarla e dirci cosa funziona (e cosa no). In breve: ci stai aiutando a <strong>costruirla</strong>.
                                <em> Grazie!</em>
                            </Text>
                            <Text className="text-gray-300 text-[16px] leading-[24px]">
                                FantaMusiké è ancora in <strong>Beta</strong>: stiamo testando, bilanciando e migliorando ogni meccanica.<br />
                                Il nostro obiettivo non è creare “solo” un fantasy game, ma reinventare gradualmente il modo in cui i fan vivono la musica e interagiscono con i loro artisti preferiti.
                            </Text>
                            <Text className="text-white text-[16px] leading-[24px] font-bold">
                                👉 La Season 1 nascerà dalle scelte che facciamo oggi. Anche grazie a te.
                            </Text>
                            <Text className="text-gray-300 text-[16px] leading-[24px]">
                                Per questo ti chiediamo un piccolo aiuto:<br />
                                ci bastano 5 minuti per capire cosa ti ha convinto, cosa ti ha confuso e cosa vorresti vedere migliorato.
                            </Text>

                            {/* Call To Action Button */}
                            <Section className="text-center mt-[32px] mb-[32px]">
                                <Button
                                    className="bg-[#7c3aed] rounded-[15px] text-white text-[14px] font-bold no-underline text-center px-8 py-4"
                                    href="https://forms.gle/6BErAaxK3aCjPsUY8"
                                >
                                    Lascia il segno su FantaMusiké!
                                </Button>
                            </Section>

                            <Text className="text-gray-400 text-[12px] leading-[20px] mt-[30px] text-center">
                                Come ringraziamento, tutti gli utenti che compileranno questo form riceveranno un <strong>Badge "Pioneer"</strong> esclusivo nel loro profilo al lancio ufficiale della Season 1.<br /><br />
                                Un segno permanente da mostrare a tutti, del fatto che c’eri dall’inizio.
                            </Text>
                        </Section>

                        {/* Footer */}
                        <Section className="border-t border-white/20 mt-[30px] pt-[20px]">
                            <Text className="text-gray-500 text-[12px] text-center">
                                © 2026 Musiké. Tutti i diritti riservati.
                            </Text>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html >
    );
};

export default FantaMusikeBetaEmail;