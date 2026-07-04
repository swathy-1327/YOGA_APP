(function () {
  const FIREBASE_SDK_VERSION = '10.12.5';
  const FIRESTORE_WRITE_TIMEOUT_MS = 15000;

  const firebaseConfig = {
    apiKey: "AIzaSyAa8J0mCvUmPBA2XQdRRlUfawOHnFncW9c",
    authDomain: "yogaapp-cd851.firebaseapp.com",
    projectId: "yogaapp-cd851",
    storageBucket: "yogaapp-cd851.firebasestorage.app",
    messagingSenderId: "99431266615",
    appId: "1:99431266615:web:a2fc1be390f58b06fdc2b2"
  };

  let firestoreDatabase = null;
  let firestoreModules = null;

  function hasFirebaseConfig() {
    return Object.values(firebaseConfig).every(
      (value) => typeof value === 'string' && value.trim() !== ''
    );
  }

  async function loadFirebaseModules() {
    if (!firestoreModules) {
      try {
        const firebaseAppModule = await import(
          `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`
        );

        const firestoreModule = await import(
          `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore-lite.js`
        );

        firestoreModules = {
          initializeApp: firebaseAppModule.initializeApp,
          getFirestore: firestoreModule.getFirestore,
          collection: firestoreModule.collection,
          addDoc: firestoreModule.addDoc
        };
      } catch (error) {
        console.error('Firebase SDK loading error:', error);

        throw new Error(
          'Firebase SDK could not be loaded. Check the internet connection and make sure gstatic.com is not blocked.'
        );
      }
    }

    return firestoreModules;
  }
  function withTimeout(promise, timeoutMs, timeoutMessage) {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      window.clearTimeout(timeoutId);
    });
  }

  function getRegistrationErrorMessage(error) {
    console.error('Firestore registration error:', error);

    const code = error && error.code ? error.code : '';

    if (
      code === 'permission-denied' ||
      code === 'firestore/permission-denied'
    ) {
      return 'Firestore rejected the registration. Check the Firestore security rules for the registrations collection.';
    }

    if (
      code === 'not-found' ||
      code === 'failed-precondition' ||
      code === 'firestore/not-found' ||
      code === 'firestore/failed-precondition'
    ) {
      return 'Firestore is not ready. Create the Firestore database in Firebase Console and try again.';
    }

    if (code === 'unavailable' || code === 'firestore/unavailable') {
      return 'Firestore is temporarily unavailable. Check the internet connection and try again.';
    }

    return error && error.message
      ? error.message
      : 'Registration could not be saved.';
  }

  async function getDatabase() {
    if (!hasFirebaseConfig()) {
      throw new Error(
        'Firebase is not configured. Add the Firebase project credentials in assets/js/firebase.js.'
      );
    }

    const { initializeApp, getFirestore } =
      await loadFirebaseModules();

    if (!firestoreDatabase) {
      const firebaseApp = initializeApp(firebaseConfig);
      firestoreDatabase = getFirestore(firebaseApp);
    }

    return firestoreDatabase;
  }

  async function saveRegistration(registrationData) {
    if (
      !registrationData ||
      typeof registrationData !== 'object' ||
      Array.isArray(registrationData)
    ) {
      throw new Error('Invalid registration data.');
    }

    const database = await getDatabase();
    const { collection, addDoc } = await loadFirebaseModules();

    const registrationsCollection = collection(
      database,
      'registrations'
    );

    const documentReference = await withTimeout(
      addDoc(registrationsCollection, registrationData),
      FIRESTORE_WRITE_TIMEOUT_MS,
      'Registration is taking too long to save. Check the Firestore rules, database setup, and network connection.'
    );

    return documentReference.id;
  }

  window.YogaFirebase = {
    saveRegistration,
    getRegistrationErrorMessage
  };
})();