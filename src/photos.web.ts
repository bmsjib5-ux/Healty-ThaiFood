// Web: image blobs go into IndexedDB, not the limited localStorage diary row.
let database: Promise<IDBDatabase> | undefined;
function db() {
  return (database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("nutri-thai-photos", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      database = undefined;
      reject(request.error);
    };
    request.onblocked = () => {
      database = undefined;
      reject(Error("กรุณาปิดแท็บแอปอื่นแล้วลองอีกครั้ง"));
    };
  }));
}
export async function savePhoto(id: string, uri: string) {
  const blob = await (await fetch(uri)).blob();
  const database = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction("photos", "readwrite");
    tx.objectStore("photos").put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? Error("บันทึกรูปไม่สำเร็จ"));
  });
}
export async function loadPhoto(id: string): Promise<string | null> {
  const database = await db();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = database
      .transaction("photos", "readonly")
      .objectStore("photos")
      .get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return blob ? URL.createObjectURL(blob) : null;
}
export async function deletePhoto(id: string) {
  const database = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction("photos", "readwrite");
    tx.objectStore("photos").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export function releasePhoto(uri: string) {
  if (uri.startsWith("blob:")) URL.revokeObjectURL(uri);
}
