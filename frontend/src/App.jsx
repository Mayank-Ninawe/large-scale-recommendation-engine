import { useEffect, useState } from 'react'
import './App.css'

const API = '/api'

function MovieGrid({ movies, mode }) {
  if (!movies.length) {
    return <p className="helper-text">No movies returned by this endpoint.</p>
  }

  return (
    <div className="movie-grid">
      {movies.map((movie, index) => {
        const score =
          mode === 'popular'
            ? movie.weighted_score
            : mode === 'similar'
              ? movie.similarity
              : movie.personalized_score ?? movie.weighted_score

        const scoreLabel =
          mode === 'popular'
            ? 'Weighted score'
            : mode === 'similar'
              ? 'Similarity'
              : 'Personalized score'

        return (
          <article className="movie-card" key={`${mode}-${movie.movieId}`}>
            <div className="movie-number">{String(index + 1).padStart(2, '0')}</div>
            <div className="movie-info">
              <h3>{movie.title}</h3>
              <p>{movie.genres || 'Genres unavailable'}</p>
              <div className="movie-score">
                <span>{scoreLabel}</span>
                <strong>{Number(score ?? 0).toFixed(3)}</strong>
              </div>
              {mode === 'popular' && (
                <p className="movie-extra">
                  Average rating: {Number(movie.average_rating ?? 0).toFixed(2)}
                  {' · '}
                  {Number(movie.rating_count ?? 0).toLocaleString()} ratings
                </p>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function App() {
  const [userId, setUserId] = useState('1')
  const [recommendations, setRecommendations] = useState([])
  const [resultUser, setResultUser] = useState(null)
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState('')

  const [popular, setPopular] = useState([])
  const [popularLoading, setPopularLoading] = useState(true)
  const [popularError, setPopularError] = useState('')

  const [movieId, setMovieId] = useState('318')
  const [similarMovies, setSimilarMovies] = useState([])
  const [inputMovie, setInputMovie] = useState(null)
  const [similarLoading, setSimilarLoading] = useState(false)
  const [similarError, setSimilarError] = useState('')

  async function fetchJson(path) {
    const response = await fetch(`${API}${path}`)
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.detail || 'The request failed.')
    }
    return data
  }

  async function loadPopular() {
    setPopularLoading(true)
    setPopularError('')
    try {
      const data = await fetchJson('/recommendations/popular?limit=10')
      setPopular(data.recommendations || [])
    } catch (err) {
      setPopularError(err.message || 'Could not load popular movies.')
    } finally {
      setPopularLoading(false)
    }
  }

  async function getRecommendations(event) {
    event.preventDefault()
    const id = Number(userId)

    if (!Number.isInteger(id) || id <= 0) {
      setUserError('Please enter a valid positive user ID.')
      return
    }

    setUserLoading(true)
    setUserError('')
    setRecommendations([])
    setResultUser(null)

    try {
      const data = await fetchJson(`/recommendations/user/${id}?limit=10`)
      setRecommendations(data.recommendations || [])
      setResultUser(data)
    } catch (err) {
      setUserError(err.message || 'Could not load personalized recommendations.')
    } finally {
      setUserLoading(false)
    }
  }

  async function getSimilarMovies(event) {
    event.preventDefault()
    const id = Number(movieId)

    if (!Number.isInteger(id) || id <= 0) {
      setSimilarError('Enter a valid positive MovieLens movie ID.')
      return
    }

    setSimilarLoading(true)
    setSimilarError('')
    setSimilarMovies([])
    setInputMovie(null)

    try {
      const data = await fetchJson(`/recommendations/movie/${id}?limit=10`)
      setSimilarMovies(data.recommendations || [])
      setInputMovie(data.input_movie || null)
    } catch (err) {
      setSimilarError(err.message || 'Could not load similar movies.')
    } finally {
      setSimilarLoading(false)
    }
  }

  useEffect(() => {
    loadPopular()
    getInitialUserRecommendations()
  }, [])

  async function getInitialUserRecommendations() {
    setUserLoading(true)
    setUserError('')
    try {
      const data = await fetchJson('/recommendations/user/1?limit=10')
      setRecommendations(data.recommendations || [])
      setResultUser(data)
    } catch (err) {
      setUserError(err.message || 'Could not load initial recommendations.')
    } finally {
      setUserLoading(false)
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
            Explore popular films, personalized picks and movies similar to your favourites,
            powered by MovieLens rating history and item-based collaborative filtering.
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
            <span>Popularity baseline + personalized scoring</span>
          </article>
        </section>

        <section className="content-card studio">
          <p className="eyebrow">EXPLORE THE CATALOG</p>
          <div className="section-title-row">
            <div>
              <h2>Popular Movies</h2>
              <p className="subtitle">Top titles from the trained popularity ranking.</p>
            </div>
            <button className="secondary-button" onClick={loadPopular} disabled={popularLoading}>
              {popularLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {popularLoading && <p className="message">Loading popular movies from the API...</p>}
          {popularError && <p className="error-message" role="alert">{popularError}</p>}
          {!popularLoading && !popularError && <MovieGrid movies={popular} mode="popular" />}

          <div className="section-divider"></div>

          <p className="eyebrow">YOUR WORKSPACE</p>
          <h2>Personalized recommendations</h2>
          <p className="subtitle">
            Enter a MovieLens user ID to recommend unseen movies based on their highly rated films.
          </p>

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
              <button type="submit" disabled={userLoading}>
                {userLoading ? 'Finding movies...' : 'Get recommendations'}
              </button>
            </div>
            <p className="helper-text">Try user ID 1 or 2 to test the live API.</p>
          </form>

          {userLoading && <p className="message" role="status">Generating personalized recommendations...</p>}
          {userError && <p className="error-message" role="alert">{userError}</p>}

          {resultUser && !userLoading && (
            <section className="results-section">
              <div className="results-heading">
                <div>
                  <p className="eyebrow">PERSONALIZED RESULTS</p>
                  <h2>Recommended for User {resultUser.userId}</h2>
                  <p className="helper-text">
                    {resultUser.liked_movies_used != null
                      ? `Based on ${resultUser.liked_movies_used} liked movies`
                      : `Recommendation mode: ${resultUser.recommendation_type || 'fallback'}`}
                  </p>
                </div>
                <span className="result-count">{recommendations.length} movies</span>
              </div>
              <MovieGrid movies={recommendations} mode="personalized" />
            </section>
          )}

          <div className="section-divider"></div>

          <p className="eyebrow">ITEM-BASED COLLABORATIVE FILTERING</p>
          <h2>Find Similar Movies</h2>
          <p className="subtitle">
            Enter a MovieLens movie ID to discover titles with similar rating patterns.
            For example, movie ID 318 is The Shawshank Redemption.
          </p>

          <form className="recommendation-form" onSubmit={getSimilarMovies}>
            <label htmlFor="movieId">MovieLens Movie ID</label>
            <div className="form-row">
              <input
                id="movieId"
                type="number"
                min="1"
                step="1"
                value={movieId}
                onChange={(event) => setMovieId(event.target.value)}
                placeholder="e.g. 318"
                required
              />
              <button type="submit" disabled={similarLoading}>
                {similarLoading ? 'Finding similar movies...' : 'Find similar movies'}
              </button>
            </div>
          </form>

          {similarLoading && <p className="message" role="status">Finding movies with similar rating patterns...</p>}
          {similarError && <p className="error-message" role="alert">{similarError}</p>}
          {inputMovie && !similarLoading && (
            <section className="results-section">
              <div className="results-heading">
                <div>
                  <p className="eyebrow">SIMILAR MOVIES</p>
                  <h2>Because you selected {inputMovie.title}</h2>
                  <p className="helper-text">Source movie ID: {inputMovie.movieId}</p>
                </div>
                <span className="result-count">{similarMovies.length} movies</span>
              </div>
              <MovieGrid movies={similarMovies} mode="similar" />
            </section>
          )}
        </section>

        <footer>RecoLab · Large-Scale Personalized Recommendation Engine</footer>
      </main>
    </div>
  )
}

export default App
