const roleData = {
  frontend: {
    name: 'Frontend Engineer', description: 'UI architecture, performance, and accessible product thinking.', questions: [
      { category: 'JavaScript fundamentals', text: 'Explain the difference between event bubbling and event capturing. When would you use event delegation?', keywords: ['event bubbling', 'event capturing', 'event delegation', 'parent', 'child', 'listener'], concepts: ['bubbling', 'capturing', 'delegation', 'propagation'], recommendation: 'Review DOM event propagation and build a small event-delegation example.' },
      { category: 'Web performance', text: 'A product page feels slow on mobile. Walk through how you would diagnose and improve its performance.', keywords: ['lighthouse', 'network', 'bundle', 'lazy loading', 'image', 'cache', 'performance'], concepts: ['diagnose', 'measure', 'bundle', 'lazy loading'], recommendation: 'Practice a Lighthouse audit and learn Core Web Vitals.' },
      { category: 'Accessibility', text: 'How would you make a custom modal accessible to keyboard and screen-reader users?', keywords: ['focus', 'keyboard', 'aria', 'screen reader', 'escape', 'role', 'dialog'], concepts: ['focus', 'keyboard', 'aria', 'dialog'], recommendation: 'Study focus management and the WAI-ARIA dialog pattern.' }
    ]
  },
  backend: {
    name: 'Backend Engineer', description: 'Reliable APIs, data modeling, and production-ready systems.', questions: [
      { category: 'API design', text: 'What makes an API reliable and maintainable? Describe the design of a resource endpoint.', keywords: ['http', 'status', 'validation', 'authentication', 'versioning', 'documentation', 'error'], concepts: ['resource', 'validation', 'status', 'versioning'], recommendation: 'Review REST constraints, HTTP status codes, and API versioning.' },
      { category: 'Data systems', text: 'Explain database indexing and the trade-offs involved in adding an index to a frequently queried table.', keywords: ['index', 'query', 'read', 'write', 'storage', 'b-tree', 'performance'], concepts: ['index', 'query', 'read', 'write'], recommendation: 'Use EXPLAIN on sample queries and compare indexed versus unindexed reads.' },
      { category: 'Distributed systems', text: 'How would you design a background job system that can retry failed work without duplicating side effects?', keywords: ['queue', 'retry', 'idempotent', 'worker', 'dead letter', 'timeout', 'transaction'], concepts: ['queue', 'retry', 'idempotent', 'worker'], recommendation: 'Learn idempotency keys, backoff strategies, and dead-letter queues.' }
    ]
  },
  data: {
    name: 'Data Analyst', description: 'Clear analysis, trustworthy metrics, and decisions backed by evidence.', questions: [
      { category: 'Analytical thinking', text: 'A key business metric dropped 15% this month. How would you investigate the change?', keywords: ['segment', 'trend', 'data quality', 'hypothesis', 'compare', 'funnel', 'dashboard'], concepts: ['segment', 'trend', 'hypothesis', 'data quality'], recommendation: 'Practice metric decomposition: validate, segment, compare, and communicate.' },
      { category: 'SQL', text: 'Explain how you would use a window function to find each customer’s first purchase and their running spend.', keywords: ['window', 'partition', 'order', 'row_number', 'sum', 'over', 'sql'], concepts: ['window', 'partition', 'order', 'running'], recommendation: 'Work through ROW_NUMBER, SUM OVER, PARTITION BY, and ORDER BY.' },
      { category: 'Communication', text: 'How do you communicate an uncertain result to a non-technical stakeholder without losing trust?', keywords: ['confidence', 'assumption', 'uncertainty', 'visual', 'context', 'decision', 'clear'], concepts: ['confidence', 'assumption', 'uncertainty', 'context'], recommendation: 'Study confidence intervals and practice writing a one-slide insight summary.' }
    ]
  }
};

const state = { role: 'frontend', questionIndex: 0, currentAnswer: '', questions: [], results: [] };
const $ = (selector) => document.querySelector(selector);
const roleSelect = $('#roleSelect');

function updateRolePreview() {
  const role = roleData[roleSelect.value];
  $('#rolePreview').textContent = role.description + ` Three questions calibrated for ${role.name.toLowerCase()} interviews.`;
}
async function startSession() {
  state.role = roleSelect.value; state.questionIndex = 0; state.currentAnswer = ''; state.results = [];
  $('#questionSection').classList.remove('hidden'); $('#resultsSection').classList.add('hidden');
  $('#startButton').disabled = true; $('#startButton').querySelector('span').textContent = '...';
  try {
    const response = await fetch(`/api/questions?role=${encodeURIComponent(state.role)}`);
    if (!response.ok) throw new Error('Question service unavailable');
    const data = await response.json(); state.questions = data.questions;
  } catch (error) {
    state.questions = roleData[state.role].questions;
  } finally {
    $('#startButton').disabled = false; $('#startButton').querySelector('span').textContent = '→';
  }
  renderQuestion(); $('#questionSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function renderQuestion() {
  const questions = state.questions.length ? state.questions : roleData[state.role].questions; const question = questions[state.questionIndex];
  $('#questionLabel').textContent = `Question ${String(state.questionIndex + 1).padStart(2, '0')}`;
  $('#progressText').textContent = `${state.questionIndex + 1} of ${questions.length}`;
  $('#progressBar').style.width = `${((state.questionIndex + 1) / questions.length) * 100}%`;
  $('#questionCategory').textContent = question.category; $('#questionText').textContent = question.text;
  $('#evaluateButton').innerHTML = state.questionIndex === questions.length - 1 ? 'Finish interview <span>✓</span>' : 'Save answer &amp; next <span>→</span>';
  $('#answerInput').value = ''; $('#charCount').textContent = '0 / 2000'; $('#answerInput').focus();
}
function tokenize(text) { return [...new Set(text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(word => word.length > 2))]; }
function evaluateAnswer(answer, question) {
  const normalized = answer.toLowerCase(); const words = tokenize(answer); const keywordHits = question.keywords.filter(keyword => normalized.includes(keyword));
  const conceptHits = question.concepts.filter(concept => words.includes(concept));
  const relevance = Math.min(100, 35 + keywordHits.length * 11 + Math.min(15, words.length / 5));
  const technical = Math.min(100, 24 + conceptHits.length * 18 + keywordHits.length * 5);
  const completeness = Math.min(100, 20 + (words.length > 35 ? 28 : words.length * .8) + (answer.includes('.') ? 12 : 0) + (answer.length > 500 ? 16 : 0));
  const clarity = Math.min(100, 35 + (answer.includes('.') ? 15 : 0) + (answer.includes(',') ? 10 : 0) + (words.length > 20 ? 25 : 0));
  const structure = Math.min(100, 28 + (answer.includes('first') || answer.includes('then') || answer.includes('finally') ? 32 : 0) + (answer.split(/[.!?]/).length > 2 ? 22 : 0));
  const evidence = Math.min(100, 20 + (answer.includes('example') ? 32 : 0) + (answer.includes('because') || answer.includes('when') ? 18 : 0) + (words.length > 45 ? 18 : 0));
  const signals = { Relevance: relevance, 'Technical depth': technical, Completeness: completeness, Clarity: clarity, Structure: structure, Evidence: evidence };
  const overall = Math.round(Object.values(signals).reduce((sum, score) => sum + score, 0) / 6);
  return { overall, signals, keywordHits, conceptHits, words };
}
function getFeedback(result, question) {
  const strengths = []; const gaps = [];
  if (result.signals.Relevance >= 65) strengths.push('Your response stays close to the question and uses role-relevant language.'); else gaps.push('Connect each point back to the exact scenario in the question.');
  if (result.signals['Technical depth'] >= 65) strengths.push(`You mention useful concepts: ${result.conceptHits.slice(0, 3).join(', ') || 'core ideas'}.`); else gaps.push(`Add technical vocabulary such as ${question.concepts.slice(0, 3).join(', ')}.`);
  if (result.signals.Completeness >= 65) strengths.push('The answer has enough detail to give an interviewer a clear starting point.'); else gaps.push('Develop the answer with a definition, reasoning, and a concrete example.');
  if (result.signals.Evidence < 65) gaps.push('Include a specific example, trade-off, or outcome to make the answer more credible.');
  if (!strengths.length) strengths.push('You have a useful starting point; keep practicing concise technical explanations.');
  return { strengths, gaps };
}
function showResults(results) {
  const averages = Object.fromEntries(Object.keys(results[0].signals).map(label => [label, results.reduce((sum, result) => sum + result.signals[label], 0) / results.length]));
  const sessionResult = { overall: Math.round(results.reduce((sum, result) => sum + result.overall, 0) / results.length), signals: averages, conceptHits: [...new Set(results.flatMap(result => result.conceptHits))] };
  const feedback = results.reduce((combined, result, index) => { const current = getFeedback(result, state.questions[index]); combined.strengths.push(...current.strengths); combined.gaps.push(...current.gaps); return combined; }, { strengths: [], gaps: [] });
  const lastQuestion = state.questions[state.questions.length - 1]; $('#resultsSection').classList.remove('hidden');
  $('#overallScore').textContent = sessionResult.overall; $('#answerCount').textContent = `${results.length} answers`; $('#scoreSummary').textContent = sessionResult.overall >= 75 ? 'A confident session with strong interview signal.' : sessionResult.overall >= 55 ? 'A solid foundation with clear areas to sharpen.' : 'A useful first pass. More structure will make your thinking easier to evaluate.';
  $('#breakdownList').innerHTML = Object.entries(sessionResult.signals).map(([label, value]) => `<div class="signal-item"><div class="signal-label"><span>${label}</span><span>${Math.round(value)}%</span></div><div class="signal-bar"><div style="width:${value}%"></div></div></div>`).join('');
  $('#strengthsList').innerHTML = [...new Set(feedback.strengths)].slice(0, 4).map(item => `<li>${item}</li>`).join(''); $('#gapsList').innerHTML = [...new Set(feedback.gaps)].slice(0, 4).map(item => `<li>${item}</li>`).join('');
  $('#recommendationsList').innerHTML = `<div class="recommendation"><strong>${lastQuestion.category}</strong><span>${lastQuestion.recommendation}</span></div><div class="recommendation"><strong>Answer pattern</strong><span>Try: concept → reasoning → example → trade-off.</span></div>`;
  saveHistory({ role: roleData[state.role].name, question: `${results.length} interview questions`, score: sessionResult.overall, signal: sessionResult.signals['Technical depth'] >= sessionResult.signals.Relevance ? 'Technical depth' : 'Relevance', date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) });
  $('#resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function submitAnswer() { const answer = $('#answerInput').value.trim(); const question = state.questions[state.questionIndex] || roleData[state.role].questions[state.questionIndex]; if (answer.length < 15) { $('#answerInput').focus(); $('#answerInput').placeholder = 'Add a little more detail so the engine can evaluate your answer.'; return; } state.results.push(evaluateAnswer(answer, question)); if (state.questionIndex < state.questions.length - 1) { state.questionIndex += 1; renderQuestion(); } else { showResults(state.results); } }
function saveHistory(entry) { const history = JSON.parse(localStorage.getItem('skillLensHistory') || '[]'); history.unshift(entry); localStorage.setItem('skillLensHistory', JSON.stringify(history.slice(0, 10))); renderHistory(); }
function renderHistory() { const history = JSON.parse(localStorage.getItem('skillLensHistory') || '[]'); $('#historyCount').textContent = `${history.length} session${history.length === 1 ? '' : 's'}`; $('#historyBody').innerHTML = history.length ? history.map(item => `<tr><td><strong>${item.role}</strong></td><td>${item.question}</td><td><span class="score-pill">${item.score}/100</span></td><td><span class="signal-pill">${item.signal}</span></td><td>${item.date}</td></tr>`).join('') : '<tr class="empty-row"><td colspan="5">Complete an evaluation to start your practice trail.</td></tr>'; }
roleSelect.addEventListener('change', updateRolePreview); $('#startButton').addEventListener('click', startSession); $('#evaluateButton').addEventListener('click', submitAnswer); $('#answerInput').addEventListener('input', event => { $('#charCount').textContent = `${event.target.value.length} / 2000`; }); $('#newSession').addEventListener('click', () => { $('#resultsSection').classList.add('hidden'); $('#questionSection').classList.remove('hidden'); state.questionIndex = 0; startSession(); }); $('#clearHistory').addEventListener('click', () => { localStorage.removeItem('skillLensHistory'); renderHistory(); });
updateRolePreview(); renderHistory();
