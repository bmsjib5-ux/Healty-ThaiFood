import { Directory, File, Paths } from "expo-file-system";
// Native: store in documents, not the picker cache. Persist a relative ID so iOS container changes are safe.
function fileFor(id: string) {
  if (!/^[a-zA-Z0-9-]+$/.test(id)) throw Error("รหัสรูปไม่ถูกต้อง");
  return new File(Paths.document, "food-photos", `${id}.jpg`);
}
export async function savePhoto(id: string, uri: string) {
  const dir = new Directory(Paths.document, "food-photos");
  dir.create({ idempotent: true, intermediates: true });
  await new File(uri).copy(fileFor(id), { overwrite: true });
}
export async function loadPhoto(id: string): Promise<string | null> {
  const f = fileFor(id);
  return f.exists ? f.uri : null;
}
export async function deletePhoto(id: string) {
  const f = fileFor(id);
  if (f.exists) f.delete();
}
export function releasePhoto(_uri: string) {}
