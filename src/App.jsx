import { useState, useEffect } from 'react';
import { problems } from './problems.js';

const ITEMS_PER_PAGE = 100;
const RATINGS = [1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000];

// Color palette for users
const USER_COLORS = [
  '#10b981', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

function App() {
  const [users, setUsers] = useState([
    { id: 1, handle: 'MJSaif', solved: new Set(), color: USER_COLORS[0] },
    { id: 2, handle: 'MJ5aif', solved: new Set(), color: USER_COLORS[1] },
  ]);
  const [newHandle, setNewHandle] = useState('');
  const [selectedRating, setSelectedRating] = useState(1800);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [visitCount, setVisitCount] = useState(0);

  // Track page visits globally using API
  useEffect(() => {
    // Fetch and increment visit count from API
    const updateVisitCount = async () => {
      try {
        const response = await fetch('https://api.countapi.xyz/hit/rivalcf-mj5aif/visits');
        const data = await response.json();
        setVisitCount(data.value);
      } catch (error) {
        console.error('Failed to fetch visit count:', error);
        // Fallback to localStorage
        const storedCount = localStorage.getItem('pageVisitCount');
        const currentCount = storedCount ? parseInt(storedCount, 10) : 0;
        const newCount = currentCount + 1;
        localStorage.setItem('pageVisitCount', newCount.toString());
        setVisitCount(newCount);
      }
    };
    updateVisitCount();
  }, []);

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

  const addUser = () => {
    if (!newHandle.trim()) {
      alert('Please enter a handle');
      return;
    }
    
    if (users.some(u => u.handle.toLowerCase() === newHandle.trim().toLowerCase())) {
      alert('User already added');
      return;
    }

    const newUser = {
      id: Date.now(),
      handle: newHandle.trim(),
      solved: new Set(),
      color: USER_COLORS[users.length % USER_COLORS.length]
    };
    
    setUsers([...users, newUser]);
    setNewHandle('');
  };

  const removeUser = (userId) => {
    if (users.length <= 1) {
      alert('At least one user is required');
      return;
    }
    setUsers(users.filter(u => u.id !== userId));
  };

  const fetchAllSolvedProblems = async () => {
    const validUsers = users.filter(u => u.handle.trim());
    
    if (validUsers.length === 0) {
      alert('Please enter at least one Codeforces handle');
      return;
    }

    setLoading(true);
    
    try {
      const results = await Promise.all(
        validUsers.map(user => fetchSolvedForUser(user.handle))
      );
      
      const updatedUsers = users.map((user, index) => {
        if (!user.handle.trim()) return user;
        
        const resultIndex = validUsers.findIndex(u => u.id === user.id);
        const result = results[resultIndex];
        
        if (result && result.success) {
          console.log(`${user.handle} solved:`, result.solved.size);
          return { ...user, solved: result.solved };
        } else {
          alert(`${user.handle}: ${result?.error || 'Unknown error'}`);
          return user;
        }
      });
      
      setUsers(updatedUsers);
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
    if (users.some(u => u.handle)) {
      fetchAllSolvedProblems();
    }
  }, []); // Empty dependency array means run once on mount

  // Get users who solved a problem
  const getSolvedByUsers = (problemId) => {
    return users.filter(u => u.solved.has(problemId));
  };

  // Determine row style based on who solved it
  const getRowStyle = (problemId) => {
    const solvers = users.filter(u => u.solved.has(problemId));
    
    if (solvers.length === 0) return {};
    if (solvers.length === 1) {
      return {
        background: `linear-gradient(135deg, ${solvers[0].color}50 0%, ${solvers[0].color}35 100%)`,
        borderLeft: `5px solid ${solvers[0].color}`,
      };
    }
    
    // Multiple users solved - create gradient
    const colors = solvers.map(s => s.color);
    return {
      background: `linear-gradient(135deg, ${colors[0]}50 0%, ${colors[colors.length - 1]}50 100%)`,
      borderLeft: `5px solid ${colors[0]}`,
    };
  };

  // Calculate solve counts for current filtered problems
  const userStats = users.map(user => ({
    ...user,
    solveCount: filteredProblems.filter(p => user.solved.has(p.problemId)).length
  }));
  
  const totalUniqueSolved = new Set(
    filteredProblems.filter(p => users.some(u => u.solved.has(p.problemId))).map(p => p.problemId)
  ).size;

  return (
    <div className="container theme-matrix">
      <header>
        <div className="header-content">
          <div className="logo">{'</>'}</div>
          <h1>Rival_CF</h1>
          {visitCount > 0 && (
            <div className="visit-counter">
              👁️ Visits: {visitCount.toLocaleString()}
            </div>
          )}
        </div>
        <p className="tagline">Compare Your Codeforces Progress</p>

        <div className="controls">
          <div className="users-container">
            {users.map((user, index) => (
              <div key={user.id} className="user-item">
                <span className="user-color-badge" style={{ backgroundColor: user.color }}></span>
                <input
                  type="text"
                  placeholder={`User ${index + 1} Handle`}
                  value={user.handle}
                  onChange={(e) => {
                    const newUsers = [...users];
                    newUsers[index].handle = e.target.value;
                    setUsers(newUsers);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && fetchAllSolvedProblems()}
                  className="user-input"
                />
                <button 
                  onClick={() => removeUser(user.id)} 
                  className="remove-user-btn"
                  disabled={users.length <= 1}
                  title="Remove user"
                >
                  ✕
                </button>
              </div>
            ))}
            
            <div className="add-user-row">
              <input
                type="text"
                placeholder="Add new handle..."
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addUser()}
                className="add-user-input"
              />
              <button onClick={addUser} className="add-user-btn">
                + Add User
              </button>
            </div>
            
            <button onClick={fetchAllSolvedProblems} disabled={loading} className="check-btn">
              {loading ? 'Loading...' : 'Check All Users'}
            </button>
          </div>
          
          {users.some(u => u.solved.size > 0) && (
            <div className="stats-row">
              {userStats.map(user => (
                <div key={user.id} className="solve-count" style={{ borderColor: user.color }}>
                  <span className="user-badge" style={{ backgroundColor: user.color }}></span>
                  {user.handle}: <strong>{user.solveCount}</strong> / {filteredProblems.length}
                </div>
              ))}
              <div className="solve-count unique">
                Total Unique: <strong>{totalUniqueSolved}</strong>
              </div>
            </div>
          )}
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
          {users.map(user => (
            <span key={user.id} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: user.color }}></span>
              {user.handle || `User ${users.indexOf(user) + 1}`}
            </span>
          ))}
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
                style={getRowStyle(problem.problemId)}
              >
                <td>
                  <div className="problem-name-cell">
                    {getSolvedByUsers(problem.problemId).map(user => (
                      <span 
                        key={user.id} 
                        className="solved-indicator"
                        style={{ backgroundColor: user.color }}
                        title={`Solved by ${user.handle}`}
                      ></span>
                    ))}
                    <a
                      href={problem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="problem-name-link"
                    >
                      {problem.name}
                    </a>
                  </div>
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
