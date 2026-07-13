// ==============================
// LOGIN — Passkey Verification
// ==============================

const loginForm = document.getElementById('loginForm');
const passkeyInput = document.getElementById('passkeyInput');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');

// Auto-focus on page load
window.addEventListener('load', () => {
    passkeyInput.focus();
});

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    
    const passkey = passkeyInput.value.trim();
    
    // Validate 6 digits
    if (passkey.length !== 6 || !/^\d{6}$/.test(passkey)) {
        showError('Please enter a valid 6-digit passkey.');
        return;
    }
    
    // Loading state
    setLoading(true);
    
    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('passkey', '==', passkey).get();
        
        if (snapshot.empty) {
            showError('Invalid passkey. Try again.');
            setLoading(false);
            passkeyInput.value = '';
            passkeyInput.focus();
            return;
        }
        
        const userData = snapshot.docs[0].data();
        const user = {
            studentId: userData.studentId,
            name: userData.name,
            passkey: userData.passkey
        };
        
        // Store in sessionStorage (clears on tab close)
        sessionStorage.setItem('attendanceUser', JSON.stringify(user));
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Connection error. Please check your internet and try again.');
        setLoading(false);
    }
});

// Helper: show error message
function showError(message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
}

// Helper: loading state
function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    loginBtn.textContent = isLoading ? 'Verifying...' : 'Sign In';
}

// Clear error on input
passkeyInput.addEventListener('input', () => {
    loginError.classList.add('hidden');
});