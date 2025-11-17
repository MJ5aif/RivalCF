import { useState, useEffect } from 'react';
import { problems } from './problems.js';

const ITEMS_PER_PAGE = 100;
const RATINGS = [1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000];

function App() {
  const [userHandle1, setUserHandle1] = useState('MJSaif');
  const [userHandle2, setUserHandle2] = useState('MJ5aif');
  const [selectedRating, setSelectedRating] = useState(null);
  const [solvedByUser1, setSolvedByUser1] = useState(new Set());
  const [solvedByUser2, setSolvedByUser2] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchSolvedForUser = async (handle) => {
    try {
      const response = await fetch(
        `https://codeforces.com/api/user.status?handle=${handle.trim()}&from=1&count=10000`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const solved = new Set();
        data.result.forEach((submission) => {
          if (submission.verdict === 'OK') {
            const problemId = `${submission.problem.contestId}${submission.problem.index}`;
            solved.add(problemId);
          }
        });
        return { success: true, solved };
      } else {
        return { success: false, error: 'Failed to fetch user data' };
      }
    } catch (error) {
      return { success: false, error: 'Error fetching data from Codeforces API' };
    }
  };

  const fetchSolvedProblems = async () => {
    if (!userHandle1.trim() && !userHandle2.trim()) {
      alert('Please enter at least one Codeforces handle');
      return;
    }

    setLoading(true);
    
    try {
      const promises = [];
      
      if (userHandle1.trim()) {
        promises.push(fetchSolvedForUser(userHandle1));
      } else {
        promises.push(Promise.resolve({ success: true, solved: new Set() }));
      }
      
      if (userHandle2.trim()) {
        promises.push(fetchSolvedForUser(userHandle2));
      } else {
        promises.push(Promise.resolve({ success: true, solved: new Set() }));
      }
      
      const [result1, result2] = await Promise.all(promises);
      
      if (result1.success) {
        setSolvedByUser1(result1.solved);
        console.log('User 1 solved:', result1.solved.size);
      } else {
        alert(`User 1: ${result1.error}`);
      }
      
      if (result2.success) {
        setSolvedByUser2(result2.solved);
        console.log('User 2 solved:', result2.solved.size);
      } else {
        alert(`User 2: ${result2.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter problems by rating
  const filteredProblems = selectedRating
    ? problems.filter((p) => p.rating === selectedRating)
    : problems;

  // Pagination
  const totalPages = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProblems = filteredProblems.slice(startIndex, endIndex);

  // Reset to page 1 when rating changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRating]);

  // Auto-fetch on component mount with default handles
  useEffect(() => {
    if (userHandle1 && userHandle2) {
      fetchSolvedProblems();
    }
  }, []); // Empty dependency array means run once on mount

  // Determine row class based on who solved it
  const getRowClass = (problemId) => {
    const solvedBy1 = solvedByUser1.has(problemId);
    const solvedBy2 = solvedByUser2.has(problemId);
    
    if (solvedBy1 && solvedBy2) return 'solved-both';
    if (solvedBy1) return 'solved-user1';
    if (solvedBy2) return 'solved-user2';
    return '';
  };

  // Calculate solve counts for current filtered problems
  const yourSolveCount = filteredProblems.filter(p => solvedByUser1.has(p.problemId)).length;
  const rivalSolveCount = filteredProblems.filter(p => solvedByUser2.has(p.problemId)).length;
  const bothSolvedCount = filteredProblems.filter(p => 
    solvedByUser1.has(p.problemId) && solvedByUser2.has(p.problemId)
  ).length;
  const uniqueSolvedCount = yourSolveCount + rivalSolveCount - bothSolvedCount;

  return (
    <div className="container theme-matrix">
      <header>
        <div className="header-content">
          <div className="logo">{'</>'}</div>
          <h1>RivalCF</h1>
        </div>
        <p className="tagline">Compare Your Codeforces Progress</p>

        <div className="controls">"
          <div className="user-input-group">
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="Your Handle"
                value={userHandle1}
                onChange={(e) => setUserHandle1(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchSolvedProblems()}
              />
              {userHandle1 && solvedByUser1.size > 0 && (
                <div className="solve-count yours">
                  Solved: <strong>{yourSolveCount}</strong> / {filteredProblems.length}
                </div>
              )}
            </div>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="Rival Handle"
                value={userHandle2}
                onChange={(e) => setUserHandle2(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchSolvedProblems()}
              />
              {userHandle2 && solvedByUser2.size > 0 && (
                <div className="solve-count rival">
                  Solved: <strong>{rivalSolveCount}</strong> / {filteredProblems.length}
                </div>
              )}
            </div>
            {userHandle1 && userHandle2 && solvedByUser1.size > 0 && solvedByUser2.size > 0 && (
              <>
                {bothSolvedCount > 0 && (
                  <div className="both-solved-badge">
                    <span className="both-icon">🔥</span>
                    <span>Both Solved: <strong>{bothSolvedCount}</strong></span>
                  </div>
                )}
                <div className="unique-solved-badge">
                  <span className="unique-icon">⭐</span>
                  <span>Total Unique: <strong>{uniqueSolvedCount}</strong></span>
                </div>
              </>
            )}
            <button onClick={fetchSolvedProblems} disabled={loading}>
              {loading ? 'Loading...' : 'Check Solved'}
            </button>
          </div>
        </div>
      </header>

      <div className="filters">
        <div className="rating-buttons">
          <button
            className={selectedRating === null ? 'active' : ''}
            onClick={() => setSelectedRating(null)}
          >
            All
          </button>
          {RATINGS.map((rating) => (
            <button
              key={rating}
              className={selectedRating === rating ? 'active' : ''}
              onClick={() => setSelectedRating(rating)}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>

      <div className="info">
        <p>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredProblems.length)} of{' '}
          {filteredProblems.length} problems
        </p>
        <div className="legend">
          <span className="legend-item">
            <span className="legend-color green"></span> You Only
          </span>
          <span className="legend-item">
            <span className="legend-color blue"></span> Rival Only
          </span>
          <span className="legend-item">
            <span className="legend-color red"></span> Both
          </span>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Problem Name</th>
              <th>Rating</th>
              <th>Tags</th>
              <th>Solve Count</th>
              <th>Length</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {currentProblems.map((problem, index) => (
              <tr
                key={index}
                className={getRowClass(problem.problemId)}
              >
                <td>
                  <a
                    href={problem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="problem-name-link"
                  >
                    {problem.name}
                  </a>
                </td>
                <td>{problem.rating}</td>
                <td className="tags">
                  {problem.tags.length > 0 ? problem.tags.join(', ') : '-'}
                </td>
                <td>{problem.solveCount.toLocaleString()}</td>
                <td>{problem.length}</td>
                <td>
                  <a
                    href={problem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {problem.problemId}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
