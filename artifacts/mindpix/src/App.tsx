import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronRight, CircleStop, Cpu, Grid3X3, Heart, Menu, MonitorSmartphone, Sparkles, Trash2, Wifi, Wind, X } from 'lucide-react';
import './index.css';

type EmotionKey = 'feliz' | 'triste' | 'enojado' | 'ansioso' | 'cansado';

type Emotion = {
  key: EmotionKey;
  label: string;
  emoji: string;
  note: string;
  message: string;
};

type CheckIn = {
  id: string;
  emotion: EmotionKey;
  label: string;
  emoji: string;
  createdAt: string;
};

const HISTORY_KEY = 'mindpix-historial-v1';

const emotions: Emotion[] = [
  { key: 'feliz', label: 'Feliz', emoji: '😊', note: 'Hay algo que celebrar', message: 'Qué bonito encontrar un momento así. Déjalo ocupar espacio: no tienes que justificar sentirte bien.' },
  { key: 'triste', label: 'Triste', emoji: '😔', note: 'Necesito un poco de cuidado', message: 'Tiene sentido que hoy pese un poco. No tienes que resolverlo todo ahora; podemos empezar por acompañarte.' },
  { key: 'enojado', label: 'Enojado/a', emoji: '😠', note: 'Algo me está rebasando', message: 'Tu enojo está tratando de decirte algo. Primero bajemos un poco la intensidad, después podrás escuchar qué necesita.' },
  { key: 'ansioso', label: 'Ansioso/a', emoji: '😰', note: 'Mi mente va muy rápido', message: 'Vuelve a este instante, sin exigirte calma inmediata. Un ritmo lento puede ser un buen primer paso.' },
  { key: 'cansado', label: 'Cansado/a', emoji: '😴', note: 'Me vendría bien una pausa', message: 'Tu energía también merece cuidado. Hoy avanzar despacio cuenta, y descansar no es perder el tiempo.' },
];

const navItems = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'emociones', label: 'Emociones' },
  { id: 'respiracion', label: 'Respiración' },
  { id: 'mi-dia', label: 'Mi día' },
  { id: 'mindpix-fisico', label: 'MINDPIX físico' },
];

const breathPhases = [
  { label: 'INHALA', hint: 'Toma aire lentamente' },
  { label: 'MANTÉN', hint: 'Quédate aquí un momento' },
  { label: 'EXHALA', hint: 'Suelta el aire despacio' },
];

function readHistory(): CheckIn[] {
  try {
    const saved = window.localStorage.getItem(HISTORY_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

function App() {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(null);
  const [history, setHistory] = useState<CheckIn[]>(readHistory);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const [isBreathing, setIsBreathing] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseSecond, setPhaseSecond] = useState(1);
  const [breathCount, setBreathCount] = useState(0);
  const [toast, setToast] = useState('');

  const chosenEmotion = useMemo(() => emotions.find((emotion) => emotion.key === selectedEmotion), [selectedEmotion]);
  const counts = useMemo(() => emotions.reduce<Record<EmotionKey, number>>((result, emotion) => {
    result[emotion.key] = history.filter((item) => item.emotion === emotion.key).length;
    return result;
  }, { feliz: 0, triste: 0, enojado: 0, ansioso: 0, cansado: 0 }), [history]);
  const mostFrequent = useMemo(() => {
    if (!history.length) return null;
    return emotions.reduce((current, emotion) => counts[emotion.key] > counts[current.key] ? emotion : current, emotions[0]);
  }, [counts, history.length]);

  useEffect(() => {
    document.title = 'MINDPIX · Haz una pausa, vuelve a ti';
    const description = 'MINDPIX te acompaña a reconocer cómo te sientes y probar una pequeña pausa para volver a tu centro.';
    const upsertMeta = (attribute: string, key: string, content: string) => {
      let tag = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, key);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', 'MINDPIX · Haz una pausa, vuelve a ti');
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', 'website');
  }, []);

  useEffect(() => {
    const sections = navItems.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: '-24% 0px -58% 0px', threshold: [0, .3, .7] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isBreathing) return;
    const timer = window.setInterval(() => {
      setPhaseSecond((second) => {
        if (second >= 4) {
          setPhaseIndex((index) => {
            const next = (index + 1) % breathPhases.length;
            if (next === 0) setBreathCount((count) => count + 1);
            return next;
          });
          return 1;
        }
        return second + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isBreathing]);

  const navigateTo = (sectionId: string) => {
    setIsMenuOpen(false);
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const selectEmotion = (emotion: Emotion) => {
    setSelectedEmotion(emotion.key);
    const checkIn: CheckIn = {
      id: `${emotion.key}-${Date.now()}`,
      emotion: emotion.key,
      label: emotion.label,
      emoji: emotion.emoji,
      createdAt: new Date().toISOString(),
    };
    setHistory((current) => {
      const next = [checkIn, ...current].slice(0, 80);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
    showToast('Tu emoción quedó guardada en Mi día');
  };

  const resetBreathing = () => {
    setIsBreathing(false);
    setPhaseIndex(0);
    setPhaseSecond(1);
  };

  const clearHistory = () => {
    if (!history.length || !window.confirm('¿Quieres borrar todo tu historial de emociones?')) return;
    window.localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    setSelectedEmotion(null);
    showToast('Historial borrado');
  };

  return (
    <div className="mindpix-app">
      <header className="site-header">
        <div className="nav-shell">
          <button className="brand" data-testid="button-logo-inicio" onClick={() => navigateTo('inicio')} aria-label="Ir al inicio de MINDPIX">
            <span className="brand-mark" aria-hidden="true">M</span>
            <span className="brand-word">MIND<span>PIX</span></span>
          </button>
          <nav className="desktop-nav" aria-label="Navegación principal">
            {navItems.map((item) => (
              <button key={item.id} className={`nav-link ${activeSection === item.id ? 'is-active' : ''}`} data-testid={`button-nav-${item.id}`} onClick={() => navigateTo(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>
          <button className="menu-toggle" data-testid="button-menu-mobile" onClick={() => setIsMenuOpen((open) => !open)} aria-expanded={isMenuOpen} aria-controls="mobile-navigation" aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}>
            {isMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
        {isMenuOpen && (
          <nav className="mobile-menu" id="mobile-navigation" aria-label="Navegación móvil">
            {navItems.map((item) => (
              <button key={item.id} className={`nav-link ${activeSection === item.id ? 'is-active' : ''}`} data-testid={`button-mobile-nav-${item.id}`} onClick={() => navigateTo(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="content-shell hero-grid">
            <div>
              <p className="eyebrow">Tu pausa empieza aquí</p>
              <h1>Conoce, expresa y <em>comprende</em> cómo te sientes.</h1>
              <p className="hero-copy">MINDPIX es un espacio breve para hacer check-in contigo: nombra lo que aparece y elige una forma amable de acompañarte.</p>
              <div className="hero-actions">
                <button className="button" data-testid="button-comenzar" onClick={() => navigateTo('emociones')}>Comenzar <ArrowRight size={16} /></button>
                <button className="button secondary" data-testid="button-ver-respiracion" onClick={() => navigateTo('respiracion')}>Necesito una pausa</button>
              </div>
            </div>
            <div className="hero-art" aria-label="Ilustración abstracta de una pausa consciente" role="img">
              <div className="art-sun" />
              <div className="art-orbit" />
              <div className="art-card">
                <div className="art-card-top">
                  <span className="art-card-label">check-in / 01</span>
                  <span className="art-signal" aria-hidden="true"><i /><i /><i /></span>
                </div>
                <h3>Un minuto para ti.</h3>
                <p>Lo que sientes merece un nombre, no un juicio.</p>
                <div className="art-progress" aria-hidden="true"><span /></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section tint" id="emociones">
          <div className="content-shell">
            <div className="section-head">
              <div>
                <p className="section-kicker">01 / check-in</p>
                <h2>Ponle un nombre a este momento.</h2>
              </div>
              <p className="section-intro">No hay respuestas correctas. Elige la palabra que más se acerque, aunque sea solo por hoy.</p>
            </div>
            <div className="emotion-grid" role="list" aria-label="Emociones disponibles">
              {emotions.map((emotion) => (
                <button key={emotion.key} className={`emotion-card ${selectedEmotion === emotion.key ? 'selected' : ''}`} data-testid={`button-emotion-${emotion.key}`} onClick={() => selectEmotion(emotion)} aria-label={`${emotion.emoji} ${emotion.label}`} aria-pressed={selectedEmotion === emotion.key}>
                  <span className="emotion-symbol" aria-hidden="true">{emotion.emoji}</span>
                  <span>
                    <span className="emotion-name">{emotion.label}</span>
                    <span className="emotion-note">{emotion.note}</span>
                  </span>
                  {selectedEmotion === emotion.key && <span className="selected-check" aria-label="Seleccionada"><Check size={13} strokeWidth={3} /></span>}
                </button>
              ))}
            </div>
            {chosenEmotion && (
              <div className="result-panel" data-testid="status-emotion-result" aria-live="polite">
                <div>
                  <p className="section-kicker">Te escucho · {chosenEmotion.emoji} {chosenEmotion.label}</p>
                  <h3>{chosenEmotion.message}</h3>
                  <p>Prueba una respiración guiada. No tienes que cambiar lo que sientes; solo darte un poco de espacio.</p>
                </div>
                <button className="button" data-testid="button-quiero-sentirme-mejor" onClick={() => navigateTo('respiracion')}>Quiero sentirme mejor <ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        </section>

        <section className="section" id="respiracion">
          <div className="content-shell">
            <div className="section-head">
              <div>
                <p className="section-kicker">02 / ritmo</p>
                <h2>Respira conmigo.</h2>
              </div>
              <p className="section-intro">Cuatro segundos para entrar, cuatro para quedarte, cuatro para soltar. Sigue tu propio ritmo.</p>
            </div>
            <div className="breath-layout">
              <div className="breath-copy">
                <h3>Tu atención puede volver, una respiración a la vez.</h3>
                <p>Coloca los pies en el suelo si te resulta cómodo. Mira el círculo y acompáñalo sin forzar. Si hoy no quieres continuar, detenerte también está bien.</p>
                <p className="breath-note">Esta es una pausa de bienestar, no una indicación médica.</p>
                <div className="button-row">
                  <button className="button" data-testid="button-start-breathing" onClick={() => setIsBreathing(true)} disabled={isBreathing}>{isBreathing ? 'En curso' : 'Comenzar respiración'} <Wind size={16} /></button>
                  <button className="button secondary small" data-testid="button-stop-breathing" onClick={resetBreathing} disabled={!isBreathing}><CircleStop size={15} /> Detener</button>
                </div>
              </div>
              <div className="breath-stage" data-testid="status-breathing-stage" aria-live="polite">
                <div className="breath-orb-wrap">
                  <div className={`breath-orb ${isBreathing ? 'is-running' : ''}`}>
                    <span className="breath-phase">{isBreathing ? breathPhases[phaseIndex].label : 'LISTA'}</span>
                  </div>
                  <div className="breath-meta">
                    <span className="breath-count">{breathCount} {breathCount === 1 ? 'ciclo' : 'ciclos'}</span>
                    <span>·</span>
                    <span>{isBreathing ? breathPhases[phaseIndex].hint : 'Cuando quieras'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="mindpix-fisico">
          <div className="content-shell">
            <div className="device-card">
              <div>
                <p className="section-kicker">03 / el proyecto</p>
                <h3>Una idea que también puede salir de la pantalla.</h3>
                <p>MINDPIX físico está pensado como una matriz LED que recibe el estado elegido desde esta experiencia. Por ahora, el recorrido está preparado para conectar, sin simular una conexión real.</p>
                <span className="device-status">preparado para conectar, sin simular conexión real</span>
              </div>
              <div className="device-flow" aria-label="Flujo de conexión MINDPIX físico">
                <div className="flow-item"><MonitorSmartphone size={19} /><span>Celular</span></div>
                <ChevronRight className="flow-arrow" size={16} aria-hidden="true" />
                <div className="flow-item"><MonitorSmartphone size={19} /><span>Página web</span></div>
                <ChevronRight className="flow-arrow" size={16} aria-hidden="true" />
                <div className="flow-item"><Wifi size={19} /><span>Wi-Fi</span></div>
                <ChevronRight className="flow-arrow" size={16} aria-hidden="true" />
                <div className="flow-item"><Cpu size={19} /><span>ESP32</span></div>
                <ChevronRight className="flow-arrow" size={16} aria-hidden="true" />
                <div className="flow-item"><Grid3X3 size={19} /><span>Matriz LED 8×8</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section tint" id="mi-dia">
          <div className="content-shell">
            <div className="section-head">
              <div>
                <p className="section-kicker">04 / tu registro</p>
                <h2>Mi día, sin filtros.</h2>
              </div>
              <p className="section-intro">Tu historial vive solo en este navegador. MINDPIX no envía tus emociones a ningún servidor.</p>
            </div>
            <div className="day-grid">
              <div className="stat-card highlight" data-testid="stat-checkin-count">
                <div className="stat-label"><span>Check-ins</span><Heart size={15} /></div>
                <div className="stat-value">{history.length}</div>
                <div className="stat-detail">{history.length ? 'veces que te has detenido aquí' : 'tu primer registro te espera'}</div>
              </div>
              <div className="stat-card" data-testid="stat-most-frequent">
                <div className="stat-label"><span>Más presente</span><Sparkles size={15} /></div>
                <div className="stat-value">{mostFrequent ? mostFrequent.emoji : '—'}</div>
                <div className="stat-detail">{mostFrequent ? `${mostFrequent.label} · ${counts[mostFrequent.key]} ${counts[mostFrequent.key] === 1 ? 'vez' : 'veces'}` : 'Todavía estamos conociéndote'}</div>
              </div>
              <div className="stat-card" data-testid="status-day-summary">
                <div className="stat-label"><span>Resumen breve</span><Wind size={15} /></div>
                <div className="stat-value">{history.length ? 'Aquí' : 'Hola'}</div>
                <div className="stat-detail">{history.length ? 'Hoy elegiste escucharte. Eso ya es algo.' : 'Registra una emoción para ver tu mapa.'}</div>
              </div>
              <div className="history-card">
                <div className="history-title">
                  <h3>Últimos registros</h3>
                  <button className="text-button" data-testid="button-clear-history" onClick={clearHistory} disabled={!history.length}><Trash2 size={13} /> Borrar historial</button>
                </div>
                {history.length ? (
                  <div className="history-list" data-testid="list-history">
                    {history.slice(0, 5).map((item) => (
                      <div className="history-row" key={item.id} data-testid={`row-history-${item.id}`}>
                        <span className="history-emoji" aria-hidden="true">{item.emoji}</span>
                        <div><strong>{item.label}</strong><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" data-testid="empty-history">
                    <strong>Tu mapa comienza con una palabra.</strong>
                    <p>Cuando quieras, vuelve a Emociones y cuéntame cómo estás. Solo tú podrás ver estos registros.</p>
                    <button className="button secondary small" data-testid="button-empty-go-emotions" onClick={() => navigateTo('emociones')}>Elegir emoción <ArrowRight size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="content-shell footer-inner">
          <p><strong>MINDPIX</strong> · una pausa para volver a ti.</p>
          <p>Proyecto escolar · 10.º grado · Tus datos se quedan en tu navegador.</p>
        </div>
      </footer>

      {toast && <div className="toast" data-testid="status-toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}

export default App;