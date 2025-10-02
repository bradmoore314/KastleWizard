
import React from 'react';

const parseLine = (line: string): React.ReactNode => {
    const parts = line.split(/(\*\*.*?\*\*)/g); // Split by **bold** text, keeping the delimiter
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n');

    return (
        <div className="space-y-3 text-on-surface-variant">
            {lines.map((line, index) => {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('###')) {
                    return <h3 key={index} className="text-xl font-semibold text-on-surface mt-6 mb-2 border-b border-white/20 pb-1">{parseLine(trimmedLine.replace(/###/g, '').trim())}</h3>;
                }
                if (trimmedLine.startsWith('##')) {
                    return <h2 key={index} className="text-2xl font-bold text-on-surface mt-8 mb-3">{parseLine(trimmedLine.replace(/##/g, '').trim())}</h2>;
                }
                if (trimmedLine.startsWith('#')) {
                    return <h1 key={index} className="text-3xl font-bold text-on-surface mt-8 mb-3">{parseLine(trimmedLine.replace(/#/g, '').trim())}</h1>;
                }
                if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                    return <li key={index} className="ml-6 list-disc">{parseLine(trimmedLine.substring(2))}</li>;
                }
                if (trimmedLine === '') {
                    return <div key={index} className="h-2"></div>; // Spacer for empty lines
                }
                return <p key={index}>{parseLine(line)}</p>;
            })}
        </div>
    );
};

export default MarkdownRenderer;