// ==============================
// DASHBOARD — Vote, View, History
// ==============================

// ---------- User ----------
// ==============================
// DASHBOARD — Vote, View, History
// ==============================

// ==============================
// DASHBOARD — Vote, View, History
// ==============================

// ---------- User ----------
const user = JSON.parse(sessionStorage.getItem('attendanceUser'));
if (!user) {
    window.location.href = 'index.html';
}

// ---------- DOM References ----------
const welcomeBanner = document.getElementById('welcomeBanner');
const welcomeName = document.getElementById('welcomeName');
const dashUserName = document.getElementById('dashUserName');
const dashStudentId = document.getElementById('dashStudentId');
const dashDate = document.getElementById('dashDate');
const dashTitle = document.getElementById('dashTitle');
const sessionTag = document.getElementById('sessionTag');
const sessionInfo = document.getElementById('sessionInfo');
const yesCount = document.getElementById('yesCount');
const noCount = document.getElementById('noCount');
const totalCount = document.getElementById('totalCount');
const voteSection = document.getElementById('voteSection');
const voteQuestion = document.getElementById('voteQuestion');
const voteButtons = document.getElementById('voteButtons');
const votedStatus = document.getElementById('votedStatus');
const votedBadge = document.getElementById('votedBadge');
const changeVoteBtn = document.getElementById('changeVoteBtn');
const responsesList = document.getElementById('responsesList');
const historyContainer = document.getElementById('historyContainer');
const logoutBtn = document.getElementById('logoutBtn');

// ---------- Global State ----------
let activeListener = null;
let historyLoaded = false;

// ---------- Date Helpers (IST) ----------
function getISTDate() {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    const istTime = new Date(utcTime + (5.5 * 60 * 60 * 1000));
    return istTime;
}

function getTodayStr() {
    const d = getISTDate();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTomorrowStr() {
    const d = getISTDate();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDateNDaysAgo(n) {
    const d = getISTDate();
    d.setDate(d.getDate() - n);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isBefore11AM() {
    const d = getISTDate();
    return d.getHours() < 11;
}

function formatDateDisplay(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-IN', options);
}

function formatDayName(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

// ---------- Welcome Banner ----------
function showWelcome() {
    welcomeName.textContent = user.name;
    welcomeBanner.classList.remove('hidden');
    setTimeout(() => {
        welcomeBanner.classList.add('hidden');
    }, 2000);
}

// ---------- Get Active Session ----------
function getSession() {
    const today = getTodayStr();
    const tomorrow = getTomorrowStr();
    const before11 = isBefore11AM();
    
    if (before11) {
        return {
            votingDocId: today,
            viewingDocId: today,
            label: 'Today',
            isTomorrow: false
        };
    } else {
        return {
            votingDocId: tomorrow,
            viewingDocId: today,
            label: 'Tomorrow',
            isTomorrow: true
        };
    }
}

// ---------- Render Dashboard ----------
function renderDashboard() {
    // Detach old listener to prevent duplicates
    if (activeListener) {
        activeListener();
        activeListener = null;
    }
    
    const session = getSession();
    const today = getTodayStr();
    const tomorrow = getTomorrowStr();
    const before11 = isBefore11AM();
    
    // Update header
    dashUserName.textContent = user.name;
    dashStudentId.textContent = user.studentId;
    
    const todayFormatted = formatDateDisplay(today);
    const tomorrowFormatted = formatDateDisplay(tomorrow);
    
    if (before11) {
        dashDate.textContent = `${todayFormatted} · Voting until 11:00 AM IST`;
        dashTitle.textContent = 'Today';
        sessionTag.textContent = '● ACTIVE';
        sessionTag.className = 'session-tag active';
        sessionInfo.classList.add('hidden');
        voteQuestion.textContent = 'Will you come today?';
    } else {
        dashDate.textContent = `${todayFormatted} (closed) · Voting for ${tomorrowFormatted}`;
        dashTitle.textContent = 'Voting for Tomorrow';
        sessionTag.textContent = '● VOTING OPEN';
        sessionTag.className = 'session-tag upcoming';
        sessionInfo.classList.remove('hidden');
        voteQuestion.textContent = `Will you come tomorrow (${tomorrowFormatted})?`;
    }
    
    // Listen to voting document (real-time) — store unsubscribe function
    const votingDocRef = db.collection('attendance').doc(session.votingDocId);
    
    activeListener = votingDocRef.onSnapshot((docSnap) => {
        const responses = docSnap.exists ? docSnap.data().responses || {} : {};
        updateCounts(responses);
        updateResponsesList(responses);
        updateVoteUI(responses);
    }, (error) => {
        console.error('Listener error:', error);
    });
    
    // Load history only once
    if (!historyLoaded) {
        loadHistory();
        historyLoaded = true;
    }
}

// ---------- Update Counts ----------
function updateCounts(responses) {
    const entries = Object.entries(responses);
    const total = entries.length;
    const yes = entries.filter(([_, d]) => d.status === 'yes').length;
    const no = entries.filter(([_, d]) => d.status === 'no').length;
    
    yesCount.textContent = yes;
    noCount.textContent = no;
    totalCount.textContent = total;
}

// ---------- Update Responses List ----------
function updateResponsesList(responses) {
    const entries = Object.entries(responses);
    
    if (entries.length === 0) {
        responsesList.innerHTML = '<p class="text-muted">No responses yet.</p>';
        return;
    }
    
    const sorted = entries.sort((a, b) => {
        if (a[1].status === b[1].status) return a[1].name.localeCompare(b[1].name);
        return a[1].status === 'yes' ? -1 : 1;
    });
    
    let html = '';
    sorted.forEach(([_, data]) => {
        const statusClass = data.status === 'yes' ? 'coming' : 'not-coming';
        const statusText = data.status === 'yes' ? 'Coming' : 'Not Coming';
        html += `
            <div class="response-item">
                <span class="response-name">${data.name}</span>
                <span class="response-status ${statusClass}">${statusText}</span>
            </div>
        `;
    });
    
    responsesList.innerHTML = html;
}

// ---------- Update Vote UI ----------
function updateVoteUI(responses) {
    const myVote = responses[user.studentId];
    
    if (myVote) {
        voteButtons.classList.add('hidden');
        votedStatus.classList.remove('hidden');
        const isComing = myVote.status === 'yes';
        votedBadge.textContent = isComing ? '✅ Coming' : '❌ Not Coming';
        votedBadge.className = `status-badge ${isComing ? 'coming' : 'not-coming'}`;
        changeVoteBtn.classList.remove('hidden');
    } else {
        voteButtons.classList.remove('hidden');
        votedStatus.classList.add('hidden');
        changeVoteBtn.classList.add('hidden');
    }
}

// ---------- Submit Vote ----------
async function submitVote(status) {
    const session = getSession();
    const docRef = db.collection('attendance').doc(session.votingDocId);
    
    try {
        await db.runTransaction(async (transaction) => {
            const docSnap = await transaction.get(docRef);
            let responses = {};
            
            if (docSnap.exists) {
                responses = docSnap.data().responses || {};
            }
            
            responses[user.studentId] = {
                name: user.name,
                status: status
            };
            
            transaction.set(docRef, {
                date: session.votingDocId,
                responses: responses,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
        
    } catch (error) {
        console.error('Vote error:', error);
        alert('Failed to submit vote. Check your connection and try again.');
    }
}

// ---------- Load Last 7 Days History ----------
async function loadHistory() {
    historyContainer.innerHTML = '<p class="text-muted">Loading history...</p>';
    
    try {
        const today = getTodayStr();
        const last7Days = [];
        
        for (let i = 0; i < 7; i++) {
    const d = getISTDate();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    last7Days.push(`${year}-${month}-${day}`);
        }
        
        const promises = last7Days.map(date => 
            db.collection('attendance').doc(date).get()
        );
        
        const snapshots = await Promise.all(promises);
        
        let html = '';
        
        snapshots.forEach((docSnap, index) => {
            const date = last7Days[index];
            const dayName = formatDayName(date);
            const displayDate = formatDateDisplay(date);
            
            if (docSnap.exists) {
                const responses = docSnap.data().responses || {};
                const entries = Object.entries(responses);
                const total = entries.length;
                const yes = entries.filter(([_, d]) => d.status === 'yes').length;
                const no = entries.filter(([_, d]) => d.status === 'no').length;
                
                const isToday = index === 0;
                const todayLabel = isToday ? ' · Today' : '';
                
                html += `
                    <div class="history-card">
                        <div class="history-date">
                            ${displayDate}
                            <span class="history-day">${dayName}${todayLabel}</span>
                        </div>
                        <div class="history-stats">
                            <span class="history-stat yes">✅ ${yes}</span>
                            <span class="history-stat no">❌ ${no}</span>
                            <span class="history-stat total">👥 ${total}</span>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="history-card">
                        <div class="history-date">
                            ${displayDate}
                            <span class="history-day">${dayName}</span>
                        </div>
                        <div class="history-stats">
                            <span class="history-stat total" style="color: var(--text-tertiary);">No data</span>
                        </div>
                    </div>
                `;
            }
        });
        
        historyContainer.innerHTML = html;
        
    } catch (error) {
        console.error('History error:', error);
        historyContainer.innerHTML = '<p class="text-muted">Failed to load history.</p>';
    }
}

// ---------- Event Listeners ----------
document.getElementById('voteYesBtn').addEventListener('click', () => submitVote('yes'));
document.getElementById('voteNoBtn').addEventListener('click', () => submitVote('no'));

changeVoteBtn.addEventListener('click', () => {
    voteButtons.classList.remove('hidden');
    votedStatus.classList.add('hidden');
    changeVoteBtn.classList.add('hidden');
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('attendanceUser');
    window.location.href = 'index.html';
});

// ---------- Init ----------
showWelcome();
renderDashboard();

// ---------- Auto-refresh at 11:00 AM IST ----------
function scheduleNextRefresh() {
    const now = getISTDate();
    const next11am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0);
    const msUntil11 = next11am - now;
    
    if (msUntil11 > 1000) {
        // More than 1 second before 11am — wait
        setTimeout(() => {
            renderDashboard();
            scheduleNextRefresh();
        }, msUntil11);
    } else if (msUntil11 >= 0) {
        // Between 11:00:00 and 11:00:01 — render now, then schedule next
        renderDashboard();
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        const msUntilMidnight = nextMidnight - now;
        setTimeout(() => {
            renderDashboard();
            scheduleNextRefresh();
        }, msUntilMidnight);
    } else {
        // After 11am — schedule midnight
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        const msUntilMidnight = nextMidnight - now;
        setTimeout(() => {
            renderDashboard();
            scheduleNextRefresh();
        }, msUntilMidnight);
    }
}

scheduleNextRefresh();