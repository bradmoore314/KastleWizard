

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { ChatMessage, DeviceType, DeviceData } from '../types';
import {
    CloseIcon,
    MicIcon,
    MicOffIcon,
    Volume2Icon,
    VolumeXIcon,
    SendIcon,
    SparklesIcon
} from './Icons';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { toast } from 'react-hot-toast';

// For browsers that might not have these types defined globally
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const ChatMessageContent: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <p className="text-sm break-words">
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </p>
    );
};

interface AiAssistantProps {
    onClose: () => void;
    onAddDevice: (deviceInfo: { deviceType: DeviceType; data: Partial<DeviceData> }) => void;
    activeProjectName: string | null;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ onClose, onAddDevice, activeProjectName }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isTtsEnabled, setIsTtsEnabled] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const chatRef = useRef<Chat | null>(null);
    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const modalRef = useFocusTrap<HTMLDivElement>(true);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!process.env.API_KEY) {
            setError("AI Assistant requires an API key to be configured.");
            return;
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = `You are a helpful AI assistant for the Kastle Systems Floor Plan tool. Your primary function is to help users add security equipment to their inventory.
The current project is "${activeProjectName || 'Unnamed Project'}".
Your goal is to gather the necessary details for a device by asking clarifying questions.
Once you have enough information to create a device (e.g., type, location, key attributes), you MUST respond ONLY with a JSON object in this specific format:
{"action": "add_device", "payload": { "deviceType": "...", "data": { ... } }}
The 'deviceType' must be one of: 'access-door', 'camera', 'elevator', 'turnstile', 'intercom'. The 'data' object should contain the attributes you've gathered.
Do NOT include markdown formatting (like \`\`\`json) or any other text around the JSON object. Just the raw JSON.
For any other conversation, respond as a friendly and helpful assistant.`;

        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction },
        });
        
        const initialMessage = `Hi! How can I help with the "${activeProjectName || 'Unnamed Project'}" project? You can tell me to add a device.`;
        setMessages([{ role: 'model', text: initialMessage }]);
        speak(initialMessage);

    }, [activeProjectName]);
    
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
            };

            recognition.onend = () => {
                setIsListening(false);
            };
            
            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'no-speech' || event.error === 'audio-capture') {
                    setError("I didn't hear anything. Please make sure your microphone is working and try again.");
                } else {
                    setError(`Speech recognition error: ${event.error}`);
                }
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!isTtsEnabled || !window.speechSynthesis) return;
        window.speechSynthesis.cancel(); // Cancel any previous speech
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }, [isTtsEnabled]);

    const handleSendMessage = useCallback(async () => {
        if (!inputValue.trim() || isThinking) return;

        const userMessage: ChatMessage = { role: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsThinking(true);
        setError(null);

        try {
            if (!chatRef.current) throw new Error("Chat not initialized. Check API Key.");
            
            const response: GenerateContentResponse = await chatRef.current.sendMessage({ message: userMessage.text });
            const responseText = response.text.trim();

            if (responseText.startsWith('{') && responseText.endsWith('}')) {
                try {
                    const jsonResponse = JSON.parse(responseText);
                    if (jsonResponse.action === 'add_device' && jsonResponse.payload) {
                        onAddDevice(jsonResponse.payload);
                        const deviceName = jsonResponse.payload.data?.location || jsonResponse.payload.deviceType;
                        const confirmationText = `OK, I've added the ${deviceName} to your unplaced inventory.`;
                        setMessages(prev => [...prev, { role: 'model', text: confirmationText }]);
                        speak(confirmationText);
                    } else {
                        setMessages(prev => [...prev, { role: 'model', text: responseText }]);
                        speak(responseText);
                    }
                } catch (e) {
                    console.error("Failed to parse AI JSON response:", e);
                    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
                    speak(responseText);
                }
            } else {
                setMessages(prev => [...prev, { role: 'model', text: responseText }]);
                speak(responseText);
            }
        } catch (err) {
            console.error("Gemini API error:", err);
            const errorMessage = "Sorry, I encountered an error. Please check your API key and try again.";
            setError(errorMessage);
            setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
            speak(errorMessage);
        } finally {
            setIsThinking(false);
        }
    }, [inputValue, isThinking, onAddDevice, speak]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error("Speech recognition is not supported by your browser.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setInputValue('');
            setError(null); // Clear previous errors
            recognitionRef.current.start();
        }
    };
    
    const modalContainerClasses = `bg-black/50 z-[95] flex justify-center fixed inset-0 items-end sm:items-center`;

    return (
        <div className={modalContainerClasses} onClick={onClose}>
            <div ref={modalRef} className="bg-surface rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-lg h-full sm:h-[80vh] sm:max-h-[700px] flex flex-col" role="dialog" aria-modal="true" aria-labelledby="ai-assistant-title" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-primary-400" />
                        <h2 id="ai-assistant-title" className="text-xl font-bold text-on-surface">AI Assistant</h2>
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={() => setIsTtsEnabled(p => !p)} className="p-2 rounded-full hover:bg-white/10" title={isTtsEnabled ? 'Disable Text-to-Speech' : 'Enable Text-to-Speech'}>
                            {isTtsEnabled ? <Volume2Icon className="w-5 h-5" /> : <VolumeXIcon className="w-5 h-5" />}
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" title="Close Assistant">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-primary-300"/></div>}
                            <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-lg' : 'bg-background text-on-surface-variant rounded-bl-lg'}`}>
                                <ChatMessageContent text={msg.text} />
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                         <div className="flex items-end gap-2 justify-start">
                             <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-primary-300"/></div>
                            <div className="max-w-[80%] p-3 rounded-2xl bg-background text-on-surface-variant rounded-bl-lg">
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-pulse delay-0"></span>
                                    <span className="w-1.is's h-1.5 bg-on-surface-variant rounded-full animate-pulse delay-150"></span>
                                    <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-pulse delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <footer 
                    className="p-4 border-t border-white/10 flex-shrink-0"
                >
                    {error && <p className="text-red-500 text-xs text-center mb-2">{error}</p>}
                    <div className="flex items-center gap-2 bg-background rounded-lg p-1">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder="Add a camera at the front door..."
                            rows={1}
                            className="flex-1 bg-transparent p-2 resize-none outline-none text-sm text-on-surface"
                            disabled={isThinking}
                        />
                        <button onClick={toggleListening} className={`p-2 rounded-full hover:bg-white/10 ${isListening ? 'text-primary-500 animate-pulse' : ''}`} disabled={!recognitionRef.current}>
                            {isListening ? <MicOffIcon className="w-5 h-5"/> : <MicIcon className="w-5 h-5"/>}
                        </button>
                        <button onClick={handleSendMessage} disabled={!inputValue.trim() || isThinking} className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-500 disabled:cursor-not-allowed">
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AiAssistant;
