import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBbsxKO2Yxu6Zi7lXDFse-JIJJs3tsT-uw",
  authDomain: "forja-laser-administrador.firebaseapp.com",
  databaseURL: "https://forja-laser-administrador-default-rtdb.firebaseio.com",
  projectId: "forja-laser-administrador",
  storageBucket: "forja-laser-administrador.firebasestorage.app",
  messagingSenderId: "309646006962",
  appId: "1:309646006962:web:3d5084f93420e1503547ab",
  measurementId: "G-H9NBGD2QY5"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);

// Funciones Helper para evitar errores de tablas inexistentes
export async function getOrCreateCollection<T>(path: string, defaultValue: T): Promise<T> {
  try {
    const dbRef = ref(rtdb, path);
    const snapshot = await get(dbRef);
    if (!snapshot.exists()) {
      await set(dbRef, defaultValue);
      return defaultValue;
    }
    return snapshot.val() as T;
  } catch (error) {
    console.error(`Error en getOrCreateCollection para ${path}:`, error);
    return defaultValue;
  }
}
export { ref, get, set };
export default app;
