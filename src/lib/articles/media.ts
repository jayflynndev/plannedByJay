import sharp from "sharp";
export async function preparePhoto(bytes: Buffer) {
  const image = sharp(bytes, { limitInputPixels: 40000000, failOn: "error" });
  const meta = await image.metadata();
  if (
    !["jpeg", "png", "webp"].includes(meta.format || "") ||
    !meta.width ||
    !meta.height
  )
    throw new Error("Unsupported photograph");
  return image
    .rotate()
    .resize({
      width: 2000,
      height: 2000,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();
}
