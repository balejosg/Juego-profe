import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({ text, speed = 15, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  // Handle markdown-like bolding simply for this demo
  const renderText = (content: string) => {
    return content.split('**').map((part, index) => 
      index % 2 === 1 ? <strong key={index} className="text-terminal-yellow">{part}</strong> : part
    );
  };

  return <div className="whitespace-pre-wrap leading-relaxed">{renderText(displayedText)}</div>;
};