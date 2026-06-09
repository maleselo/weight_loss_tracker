import { Capacitor } from "@capacitor/core";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("Lecture du fichier impossible."));
        return;
      }
      const base64 = dataUrl.split(",")[1];
      if (!base64) {
        reject(new Error("Lecture du fichier impossible."));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(blob);
  });
}

function downloadOnWeb(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function isShareCancelled(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /cancel/i.test(message);
}

/** Web : téléchargement navigateur. Android/iOS : feuille de partage système. */
export async function saveExportedFile(blob: Blob, filename: string): Promise<"downloaded" | "shared"> {
  if (!Capacitor.isNativePlatform()) {
    downloadOnWeb(blob, filename);
    return "downloaded";
  }

  const { Directory, Filesystem } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");

  const safeName = filename.replace(/[^\w.\-]+/g, "_");
  const path = `exports/${safeName}`;

  await Filesystem.mkdir({
    path: "exports",
    directory: Directory.Cache,
    recursive: true,
  }).catch(() => {});

  await Filesystem.writeFile({
    path,
    data: await blobToBase64(blob),
    directory: Directory.Cache,
  });

  const { uri } = await Filesystem.getUri({
    path,
    directory: Directory.Cache,
  });

  try {
    await Share.share({
      title: safeName,
      files: [uri],
      dialogTitle: "Enregistrer ou partager l'export",
    });
  } catch (err) {
    if (!isShareCancelled(err)) throw err;
  }

  return "shared";
}
