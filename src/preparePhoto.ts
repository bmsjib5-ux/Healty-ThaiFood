import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";
export async function preparePhoto(asset: ImagePickerAsset): Promise<string> {
  if (asset.type && asset.type !== "image") throw Error("กรุณาเลือกไฟล์รูปภาพ");
  if ((asset.fileSize ?? 0) > 25 * 1024 * 1024)
    throw Error("กรุณาเลือกรูปขนาดไม่เกิน 25 MB");
  if (asset.width * asset.height > 60000000)
    throw Error("รูปใหญ่เกินไป กรุณาเลือกรูปไม่เกิน 60 ล้านพิกเซล");
  const context = ImageManipulator.manipulate(asset.uri);
  try {
    // Resize to a 720 px long edge, retaining the full photo. JPEG conversion removes metadata.
    if (asset.width > 720 || asset.height > 720)
      context.resize(
        asset.width >= asset.height ? { width: 720 } : { height: 720 },
      );
    const image = await context.renderAsync();
    try {
      return (await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 }))
        .uri;
    } finally {
      image.release();
    }
  } finally {
    context.release();
  }
}
