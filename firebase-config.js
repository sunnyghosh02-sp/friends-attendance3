const firebaseConfig = {
  apiKey: "AIzaSyAUwrm23k5iZTz_kirmshbGUG6LSjdvQn4",
  authDomain: "friends-attendance-db6a4.firebaseapp.com",
  projectId: "friends-attendance-db6a4",
  storageBucket: "friends-attendance-db6a4.firebasestorage.app",
  messagingSenderId: "328796872836",
  appId: "1:328796872836:web:df651b626e6070d6f2e2d1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();