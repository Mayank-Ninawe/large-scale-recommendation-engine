
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <div>
            <h2>RecoLab</h2>
            <p>PERSONALIZATION ENGINE</p>
          </div>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          Development mode
        </div>
      </header>

      <main className="main-content">
        <section className="welcome">
          <p className="eyebrow">RECOMMENDATION INTELLIGENCE</p>
          <h1>Discover what you'll love.</h1>
          <p className="subtitle">
            A personalized recommendation engine powered by machine learning.
          </p>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <p>Recommendation pipeline</p>
            <h2>In development</h2>
            <span>Retrieval → Ranking</span>
          </article>

          <article className="stat-card">
            <p>Retrieval model</p>
            <h2>Planned</h2>
            <span>Two-Tower + FAISS</span>
          </article>

          <article className="stat-card">
            <p>Ranking model</p>
            <h2>Planned</h2>
            <span>Learning to rank</span>
          </article>
        </section>

        <section className="content-card">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h2>Your recommendation studio</h2>
            <p className="subtitle">
              Soon, you'll be able to explore movie recommendations,
              compare ranking models, and evaluate recommendation quality here.
            </p>
          </div>

          <div className="pipeline">
            <div className="pipeline-step">
              <span>01</span>
              <div>
                <h3>Candidate retrieval</h3>
                <p>Find relevant movies from a large catalog.</p>
              </div>
            </div>

            <div className="pipeline-step">
              <span>02</span>
              <div>
                <h3>Personalized ranking</h3>
                <p>Rank candidates for each user's preferences.</p>
              </div>
            </div>

            <div className="pipeline-step">
              <span>03</span>
              <div>
                <h3>Offline evaluation</h3>
                <p>Measure recommendation quality on held-out data.</p>
              </div>
            </div>
          </div>
        </section>

        <footer>
          RecoLab · Large-Scale Personalized Recommendation Engine
        </footer>
      </main>
    </div>
  )
}

export default App
