const DB_NAME = 'KastleFileStorage';
const STORE_NAME = 'floorplan-files';
const DB_VERSION = 1;

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveFile = async (id: string, file: File): Promise<void> => {
  const db = await openDb();
  // By storing a plain object containing a Blob and metadata, we improve compatibility
  // with IndexedDB's structured clone algorithm across all browsers, especially mobile.
  const dataToStore = {
    blob: file,
    name: file.name,
    lastModified: file.lastModified,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(dataToStore, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getFile = async (id: string): Promise<File | undefined> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
        const storedData = request.result;
        // Check for the new format (object with blob) or the old format (File object)
        if (storedData && storedData.blob instanceof Blob) {
            // Reconstruct the File object from our stored data
            resolve(new File([storedData.blob], storedData.name, {
                type: storedData.blob.type,
                lastModified: storedData.lastModified,
            }));
        } else if (storedData instanceof File) {
            // Handle old format for backward compatibility
            resolve(storedData);
        } else {
            resolve(undefined);
        }
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteFile = async (id: string): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getAllFileIds = async (): Promise<string[]> => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
    });
};