
import { useState } from 'react'
import './App.css'

function App() {
  const [userId, setUserId] = useState('1')
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultUser, setResultUser] = useState(null)

  async function getRecommendations(event) {
    event.preventDefault()

    const id = Number(userId)

    if (!Number.isInteger(id) || id <= 0) {
      setError('Please enter a valid positive user ID.')
      return
    }

    setLoading(true)
    setError('')
    setRecommendations([])
    setResultUser(null)

    try {
      const response = await fetch(
        `/api/recommendations/user/${id}?limit=10`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Could not load recommendations.')
      }

      setRecommendations(data.recommendations || [])
      setResultUser(data)
    } catch (err) {
      setError(
        err.message ||
          'Unable to connect to the recommendation API. Check both servers.'
      )
    } finally {
      setLoading(false)
    }
  }

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
          ML Recommendation Studio
        </div>
      </header>

      <main className="main-content">
        <section className="welcome">
          <p className="eyebrow">RECOMMENDATION INTELLIGENCE</p>
          <h1>Discover what you'll love.</h1>
          <p className="subtitle">
            Explore personalized movie recommendations generated from
            user rating history and item-based collaborative filtering.
          </p>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <p>Training interactions</p>
            <h2>20.06 Million</h2>
            <span>MovieLens 25M · Training split</span>
          </article>

          <article className="stat-card">
            <p>Catalog size</p>
            <h2>11,464</h2>
            <span>Eligible movies in retrieval catalog</span>
          </article>

          <article className="stat-card">
            <p>Retrieval model</p>
            <h2>Item Similarity</h2>
            <span>Personalized candidate scoring</span>
          </article>
        </section>

        <section className="content-card studio">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h2>Your recommendation studio</h2>
            <p className="subtitle">
              Enter a MovieLens user ID to generate recommendations
              using the trained recommendation artifacts.
            </p>
          </div>

          <form className="recommendation-form" onSubmit={getRecommendations}>
            <label htmlFor="userId">MovieLens User ID</label>
            <div className="form-row">
              <input
                id="userId"
                type="number"
                min="1"
                step="1"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="e.g. 1"
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Finding movies...' : 'Get recommendations'}
              </button>
            </div>
            <p className="helper-text">
              Try user ID 1 to test the live API connection.
            </p>
          </form>

          {loading && (
            <div className="message" role="status">
              Generating personalized recommendations...
            </div>
          )}

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {resultUser && !loading && (
            <section className="results-section">
              <div className="results-heading">
                <div>
                  <p className="eyebrow">PERSONALIZED RESULTS</p>
                  <h2>Recommended for User {resultUser.userId}</h2>
                  <p className="helper-text">
                    Based on {resultUser.liked_movies_used} liked movies
                  </p>
                </div>
                <span className="result-count">
                  {recommendations.length} movies
                </span>
              </div>

              {recommendations.length > 0 ? (
                <div className="movie-grid">
                  {recommendations.map((movie, index) => (
                    <article className="movie-card" key={movie.movieId}>
                      <div className="movie-number">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="movie-info">
                        <h3>{movie.title}</h3>
                        <p>{movie.genres || 'Genres unavailable'}</p>
                        <div className="movie-score">
                          <span>Personalized score</span>
                          <strong>
                            {Number(movie.personalized_score).toFixed(3)}
                          </strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="message">
                  No recommendations were returned for this user.
                </p>
              )}
            </section>
          )}
        </section>

        <footer>
          RecoLab · Large-Scale Personalized Recommendation Engine
        </footer>
      </main>
    </div>
  )
}

export default App
