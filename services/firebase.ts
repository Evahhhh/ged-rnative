// Collez ici l'objet de configuration Firebase que vous avez récupéré
// depuis la console Firebase.
//
// Exemple :
// const firebaseConfig = {
//   apiKey: "VOTRE_API_KEY",
//   authDomain: "VOTRE_AUTH_DOMAIN",
//   projectId: "VOTRE_PROJECT_ID",
//   storageBucket: "VOTRE_STORAGE_BUCKET",
//   messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
//   appId: "VOTRE_APP_ID"
// };

const firebaseConfig = {};

// Ne pas modifier les lignes ci-dessous
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
