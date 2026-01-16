import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gameService } from './services/geminiService';
import { GameResponse, GameStatus, GameStats } from './types';
import { StatBar } from './components/StatBar';
import { TypewriterText } from './components/TypewriterText';
import { Terminal, Battery, Users, BookOpen, Send, RotateCcw, ShieldAlert, Cpu } from 'lucide-react';

export default function App() {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [currentResponse, setCurrentResponse] = useState<GameResponse | null>(null);
  const [history, setHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isTyping]);

  const handleStartGame = async () => {
    setLoading(true);
    setHistory([]);
    try {
      const response = await gameService.startGame();
      setStatus(GameStatus.PLAYING);
      setCurrentResponse(response);
      setHistory([{ role: 'model', text: response.narrative }]);
      setIsTyping(true);
    } catch (error) {
      console.error(error);
      alert("Error al conectar con Gemini. Verifica tu API Key.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionText: string) => {
    if (!actionText.trim() || loading || status !== GameStatus.PLAYING) return;

    const newHistory = [...history, { role: 'user' as const, text: actionText }];
    setHistory(newHistory);
    setInput('');
    setLoading(true);
    setCurrentResponse(null); // Hide controls temporarily

    try {
      const response = await gameService.sendAction(actionText);
      
      setHistory(prev => [...prev, { role: 'model', text: response.narrative }]);
      setCurrentResponse(response);
      setIsTyping(true);

      if (response.gameOver) setStatus(GameStatus.GAME_OVER);
      else if (response.victory) setStatus(GameStatus.VICTORY);

    } catch (error) {
      console.error(error);
      // Fallback message
      setHistory(prev => [...prev, { role: 'model', text: "Error de sistema... Reintentando conexión..." }]);
    } finally {
      setLoading(false);
    }
  };

  const renderStats = (stats: GameStats) => (
    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900 border-b border-slate-700 shadow-md z-10 sticky top-0">
      <StatBar 
        label="Motivación Alumnos" 
        value={stats.motivation} 
        color="bg-terminal-green" 
        icon={<Users size={14} />} 
      />
      <StatBar 
        label="Autoridad Profesor" 
        value={stats.authority} 
        color="bg-terminal-blue" 
        icon={<ShieldAlert size={14} />} 
      />
      <StatBar 
        label="Energía (Cafeína)" 
        value={stats.energy} 
        color="bg-terminal-yellow" 
        icon={<Battery size={14} />} 
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col md:flex-row overflow-hidden">
      
      {/* Left Panel: Narrative & Chat */}
      <div className="flex-1 flex flex-col h-screen relative">
        {/* Header */}
        <header className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-terminal-blue/20 rounded-lg flex items-center justify-center text-terminal-blue border border-terminal-blue/50">
                    <Terminal size={24} />
                </div>
                <div>
                    <h1 className="font-mono font-bold text-lg text-white">PROFESOR.EXE</h1>
                    <p className="text-xs text-slate-400">v1.0.4 | Simulación Académica</p>
                </div>
            </div>
            {status !== GameStatus.IDLE && (
                 <button 
                 onClick={handleStartGame}
                 className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                 title="Reiniciar Simulación"
                >
                    <RotateCcw size={18} />
                </button>
            )}
        </header>

        {/* Game Area */}
        {status === GameStatus.IDLE ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center animate-pulse">
                    <Cpu size={48} className="text-terminal-blue" />
                </div>
                <h2 className="text-3xl font-bold text-white">¿Listo para dar clase?</h2>
                <p className="max-w-md text-slate-400">
                    Tus alumnos esperan. El proyector no funciona. Tienes resaca de café. 
                    Bienvenido al departamento de Ciencias de la Computación.
                </p>
                <button 
                    onClick={handleStartGame}
                    disabled={loading}
                    className="px-8 py-3 bg-terminal-blue hover:bg-blue-600 text-white font-mono font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-900/20 flex items-center gap-2"
                >
                    {loading ? "Cargando..." : "INICIAR SEMESTRE"}
                    {!loading && <BookOpen size={18} />}
                </button>
            </div>
        ) : (
            <>
                {currentResponse && renderStats(currentResponse.stats)}
                
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                    {history.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-lg ${
                                msg.role === 'user' 
                                    ? 'bg-slate-800 text-slate-100 rounded-br-none border border-slate-700' 
                                    : 'bg-slate-900/80 text-slate-300 rounded-bl-none border border-slate-800'
                            }`}>
                                {msg.role === 'user' ? (
                                    <p className="font-medium">{msg.text}</p>
                                ) : (
                                    <div className="font-mono text-sm md:text-base">
                                        {/* Only animate the last message if typing */}
                                        {idx === history.length - 1 && isTyping ? (
                                            <TypewriterText text={msg.text} onComplete={() => setIsTyping(false)} />
                                        ) : (
                                            <div dangerouslySetInnerHTML={{ 
                                                // Quick and dirty markdown bold support for history
                                                __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-terminal-yellow">$1</strong>') 
                                            }} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-900/50 p-3 rounded-2xl rounded-bl-none border border-slate-800 flex gap-2 items-center">
                                <div className="w-2 h-2 bg-terminal-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-terminal-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-terminal-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </>
        )}

        {/* Footer / Input Area */}
        {(status === GameStatus.PLAYING || status === GameStatus.GAME_OVER || status === GameStatus.VICTORY) && (
            <div className="p-4 bg-slate-900 border-t border-slate-800">
                
                {/* Game Over / Victory Overlay Content */}
                {(status === GameStatus.GAME_OVER || status === GameStatus.VICTORY) ? (
                    <div className="text-center py-4">
                        <h3 className={`text-2xl font-bold font-mono mb-2 ${status === GameStatus.VICTORY ? 'text-terminal-green' : 'text-terminal-red'}`}>
                            {status === GameStatus.VICTORY ? '¡SEMESTRE APROBADO!' : 'GAME OVER'}
                        </h3>
                        <p className="text-slate-400 mb-4">{currentResponse?.reason || "El decano quiere verte en su oficina..."}</p>
                        <button 
                            onClick={handleStartGame}
                            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-mono transition-colors"
                        >
                            Jugar de nuevo
                        </button>
                    </div>
                ) : (
                    /* Active Playing Controls */
                    <div className="space-y-4">
                         {/* Choices Buttons */}
                         {!loading && currentResponse?.choices && !isTyping && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {currentResponse.choices.map((choice, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAction(choice)}
                                        className="text-left text-xs md:text-sm p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-terminal-blue/50 rounded-lg transition-all duration-200 text-slate-300 hover:text-white"
                                    >
                                        <span className="text-terminal-blue font-bold mr-2">{i + 1}.</span>
                                        {choice}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Free Text Input */}
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleAction(input); }}
                            className="relative flex items-center"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isTyping ? "Espera al narrador..." : "O escribe tu propia acción..."}
                                disabled={loading || isTyping}
                                className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-terminal-blue focus:ring-1 focus:ring-terminal-blue transition-all disabled:opacity-50 font-mono text-sm"
                            />
                            <button
                                type="submit"
                                disabled={loading || isTyping || !input.trim()}
                                className="absolute right-2 p-2 bg-terminal-blue hover:bg-blue-600 disabled:bg-slate-700 text-white rounded-lg transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Right Panel: Info & Decor (Hidden on small mobile) */}
      <div className="hidden lg:flex w-80 bg-slate-950 border-l border-slate-800 flex-col p-6 space-y-8">
        <div>
            <h3 className="text-terminal-blue font-mono font-bold mb-4 uppercase tracking-widest text-sm">Estado del Sistema</h3>
            <div className="space-y-4">
                <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">ASIGNATURA</div>
                    <div className="font-bold text-slate-200">Algoritmos y Estructuras de Datos II</div>
                </div>
                <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">AULA</div>
                    <div className="font-bold text-slate-200">Laboratorio 404</div>
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-terminal-blue font-mono font-bold mb-4 uppercase tracking-widest text-sm">Inventario</h3>
            <ul className="space-y-2 text-sm text-slate-400 font-mono">
                <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-terminal-green rounded-full"></div>
                    Laptop Lenovo (Batería 40%)
                </li>
                <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-terminal-green rounded-full"></div>
                    Marcador de pizarra (Casi seco)
                </li>
                <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-terminal-yellow rounded-full"></div>
                    Taza de café (Vacía)
                </li>
                <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-terminal-red rounded-full"></div>
                    USB con parciales 2023
                </li>
            </ul>
        </div>
      </div>
    </div>
  );
}
