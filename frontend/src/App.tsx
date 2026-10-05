import './App.css'

function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="GreenER início">
          <span className="brand-mark" aria-hidden="true">G</span>
          <span>GreenER</span>
        </a>
        <span className="environment-badge">Ambiente de desenvolvimento</span>
      </header>

      <section className="welcome-card" aria-labelledby="welcome-title">
        <p className="eyebrow">Plataforma de impacto ambiental</p>
        <h1 id="welcome-title">Sua base GreenER está pronta para crescer.</h1>
        <p className="welcome-copy">
          O espaço de trabalho está configurado. As próximas entregas vão conectar
          aplicações monitoradas, consumo de energia e emissões estimadas.
        </p>
        <div className="status-row" role="status">
          <span className="status-dot" aria-hidden="true" />
          <span>Frontend React + TypeScript em execução</span>
        </div>
      </section>
    </main>
  )
}

export default App
