import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCjDAbyqOkqxqTaaymApjGL4P4eobsDYxE",
    authDomain: "santasystemsql.firebaseapp.com",
    projectId: "santasystemsql",
    storageBucket: "santasystemsql.firebasestorage.app",
    messagingSenderId: "980536129086",
    appId: "1:980536129086:web:c50c05a0101e8ecac2c36f",
    measurementId: "G-NEYEYWB293"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
