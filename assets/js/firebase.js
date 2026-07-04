(function () {
  const firebaseConfig = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  };

  let database = null;
  let modules = null;

  function hasConfig() {
    return Object.values(firebaseConfig).every((value) => value.trim() !== '');
  }

  async function loadModules() {
    if (!modules) {
      const appModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
      const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');

      modules = {
        initializeApp: appModule.initializeApp,
        getFirestore: firestoreModule.getFirestore,
        collection: firestoreModule.collection,
        addDoc: firestoreModule.addDoc,
      };
    }

    return modules;
  }

  async function getDatabase() {
    if (!hasConfig()) {
      throw new Error('Firebase is not configured yet. Add your project keys in assets/js/firebase.js.');
    }

    const { initializeApp, getFirestore } = await loadModules();

    if (!database) {
      database = getFirestore(initializeApp(firebaseConfig));
    }

    return database;
  }

  async function saveRegistration(data) {
    const db = await getDatabase();
    const { collection, addDoc } = await loadModules();
    const doc = await addDoc(collection(db, 'registrations'), data);

    return doc.id;
  }

  window.YogaFirebase = { saveRegistration };
}());
