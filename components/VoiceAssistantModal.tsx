import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import Modal from './common/Modal';

interface VoiceAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    addNotification: (message: string) => void;
    onUpdateDues: (daireNo: number, odendi: boolean) => string;
    onAddExpense: (aciklama: string, tutar: number, kategori: string) => string;
}

const expenseCategories = ['Fatura', 'Bakım', 'Personel', 'Demirbaş', 'Diğer'];

const updateDuesStatusTool: FunctionDeclaration = {
    name: 'updateDuesStatus',
    description: 'Bir dairenin en son döneme ait aidat borcunun ödenip ödenmediğini günceller.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            daireNo: {
                type: Type.NUMBER,
                description: 'İşlem yapılacak dairenin numarası.',
            },
            odendi: {
                type: Type.BOOLEAN,
                description: 'Aidatın ödenip ödenmediğini belirten durum. Ödendiyse true, ödenmediyse false.',
            },
        },
        required: ['daireNo', 'odendi'],
    },
};

const addExpenseTool: FunctionDeclaration = {
    name: 'addExpense',
    description: 'Apartman için yeni bir masraf kaydı oluşturur.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            tutar: {
                type: Type.NUMBER,
                description: 'Masrafın Türk Lirası cinsinden tutarı.',
            },
            aciklama: {
                type: Type.STRING,
                description: 'Masrafın neyle ilgili olduğunu belirten kısa bir açıklama. Örneğin "Elektrik Faturası".',
            },
            kategori: {
                type: Type.STRING,
                description: `Masrafın kategorisi. Seçenekler: ${expenseCategories.join(', ')}.`,
                enum: expenseCategories,
            },
        },
        required: ['tutar', 'aciklama', 'kategori'],
    },
};

const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose, addNotification, onUpdateDues, onAddExpense }) => {
    const [isListening, setIsListening] = useState(false);
    const [userTranscript, setUserTranscript] = useState('');
    const [assistantTranscript, setAssistantTranscript] = useState('');
    const [status, setStatus] = useState('Asistan hazır. Konuşmak için mikrofon simgesine dokunun.');
    const [conversation, setConversation] = useState<{ speaker: 'user' | 'assistant', text: string }[]>([]);

    const sessionPromise = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTime = useRef(0);
    const sources = useRef(new Set<AudioBufferSourceNode>());
    
    // Initialize audio contexts
    useEffect(() => {
        if (isOpen) {
            if (!inputAudioContextRef.current) {
                inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }
            if (!outputAudioContextRef.current) {
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
        }
    }, [isOpen]);

    const stopPlayback = () => {
        if (outputAudioContextRef.current) {
            sources.current.forEach(source => {
                try { source.stop(); } catch (e) { console.warn("Error stopping audio source:", e); }
            });
            sources.current.clear();
            nextStartTime.current = 0;
        }
    };
    
    const handleClose = () => {
        stopListening();
        onClose();
    };

    const stopListening = useCallback(() => {
        sessionPromise.current?.then(session => session.close()).catch(e => console.warn("Error closing session:", e));
        sessionPromise.current = null;
        
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
            mediaStreamSourceRef.current = null;
        }

        setIsListening(false);
        setStatus('Asistan hazır. Konuşmak için mikrofon simgesine dokunun.');
        stopPlayback();
    }, []);

    const startListening = async () => {
        if (isListening) {
            stopListening();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsListening(true);
            setStatus('Dinliyorum...');
            setConversation([]);
            setUserTranscript('');
            setAssistantTranscript('');

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            sessionPromise.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        console.log('Session opened.');
                        const inputCtx = inputAudioContextRef.current!;
                        mediaStreamSourceRef.current = inputCtx.createMediaStreamSource(stream);
                        scriptProcessorRef.current = inputCtx.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                             for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromise.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };

                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        let currentInput = '';
                        let currentOutput = '';
                        if (message.serverContent?.inputTranscription) {
                            currentInput = message.serverContent.inputTranscription.text;
                            setUserTranscript(prev => prev + currentInput);
                        }
                        if (message.serverContent?.outputTranscription) {
                             setStatus('Asistan konuşuyor...');
                             currentOutput = message.serverContent.outputTranscription.text;
                             setAssistantTranscript(prev => prev + currentOutput);
                        }
                        if (message.serverContent?.turnComplete) {
                            setConversation(prev => {
                                const finalInput = userTranscript + currentInput;
                                const finalOutput = assistantTranscript + currentOutput;
                                return [...prev, { speaker: 'user', text: finalInput }, { speaker: 'assistant', text: finalOutput }];
                            });
                            setUserTranscript('');
                            setAssistantTranscript('');
                            setStatus('Dinliyorum...');
                        }
                        
                        if (message.toolCall) {
                           setStatus('İşlem yapılıyor...');
                           for (const fc of message.toolCall.functionCalls) {
                               let result = "Hata: Bilinmeyen bir fonksiyon çağrıldı.";
                               try {
                                   if (fc.name === 'updateDuesStatus') {
                                       result = onUpdateDues(fc.args.daireNo, fc.args.odendi);
                                   } else if (fc.name === 'addExpense') {
                                       result = onAddExpense(fc.args.aciklama, fc.args.tutar, fc.args.kategori);
                                   }
                               } catch (e: any) {
                                   result = `İşlem sırasında bir hata oluştu: ${e.message}`;
                               }
                               sessionPromise.current?.then((session) => {
                                   session.sendToolResponse({
                                     functionResponses: [{
                                       id: fc.id,
                                       name: fc.name,
                                       response: { result: result },
                                     }]
                                   });
                               });
                           }
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio) {
                            const outCtx = outputAudioContextRef.current!;
                            nextStartTime.current = Math.max(nextStartTime.current, outCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
                            const source = outCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outCtx.destination);
                            source.addEventListener('ended', () => sources.current.delete(source));
                            source.start(nextStartTime.current);
                            nextStartTime.current += audioBuffer.duration;
                            sources.current.add(source);
                        }
                        
                        if (message.serverContent?.interrupted) {
                            stopPlayback();
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        addNotification(`Sesli asistan hatası: ${e.message}`);
                        stopListening();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Session closed.', e);
                        stopListening();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    systemInstruction: `Sen bir apartman yönetimi asistanısın. Kullanıcının aidatları ve masrafları yönetmesine yardımcı ol. Kullanıcı bir komut verdiğinde, ilgili aracı (fonksiyonu) çağır. Eğer komutta eksik bilgi varsa, işlemi tamamlamak için kullanıcıya soru sor. Örneğin, kullanıcı "fatura ekle" derse, "Elbette, fatura tutarı ne kadar?" diye sor. Tüm cevapların Türkçe olsun. Mevcut tarih: ${new Date().toLocaleDateString('tr-TR')}.`,
                    tools: [{ functionDeclarations: [updateDuesStatusTool, addExpenseTool] }],
                },
            });

        } catch (error) {
            console.error('Error starting voice assistant:', error);
            addNotification('Mikrofon erişimi reddedildi veya bir hata oluştu.');
            setIsListening(false);
        }
    };
    
    useEffect(() => {
        if (!isOpen && isListening) {
            stopListening();
        }
    }, [isOpen, isListening, stopListening]);

    return (
        <Modal title="Sesli Asistan" isOpen={isOpen} onClose={handleClose}>
            <div className="flex flex-col items-center justify-center space-y-6 min-h-[300px]">
                <button
                    onClick={startListening}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-300
                        ${isListening ? 'bg-red-500/80 hover:bg-red-600/80 animate-pulse' : 'bg-primary/80 hover:bg-secondary/80'}
                        border-4 ${isListening ? 'border-red-300' : 'border-sky-300'}
                    `}
                >
                    <i className={`fas fa-microphone-alt text-4xl text-white`}></i>
                </button>
                <p className="text-gray-700 dark:text-gray-300 text-center h-5">{status}</p>
                <div className="w-full p-4 bg-white/20 dark:bg-black/20 rounded-lg min-h-[100px] text-gray-800 dark:text-gray-200">
                     {conversation.map((entry, index) => (
                        <p key={index} className={entry.speaker === 'user' ? 'font-semibold' : ''}>
                            <span className="capitalize">{entry.speaker === 'user' ? 'Siz' : 'Asistan'}: </span>{entry.text}
                        </p>
                    ))}
                    {userTranscript && <p className="font-semibold text-gray-600 dark:text-gray-400"><span className="capitalize">Siz: </span>{userTranscript}...</p>}
                    {assistantTranscript && <p className="text-gray-600 dark:text-gray-400"><span className="capitalize">Asistan: </span>{assistantTranscript}...</p>}
                </div>
            </div>
        </Modal>
    );
};

export default VoiceAssistantModal;