// Import the functions you need from the SDKs you need
import {getAuth} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getEnv } from "./getEnv";
import { GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API"),
  authDomain: "se-project-f0cc6.firebaseapp.com",
  projectId: "se-project-f0cc6",
  storageBucket: "se-project-f0cc6.firebasestorage.app",
  messagingSenderId: "809803675418",
  appId: "1:809803675418:web:126af70c6ea0bfe04edea3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();


export { auth, provider };