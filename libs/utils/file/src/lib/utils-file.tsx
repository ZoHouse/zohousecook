const IMAGES_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "svg"];
const VIDEOS_EXTENSIONS = ["mp4", "mpeg", "avi"];
const DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "csv", "zip"];

const blobToFile = (blob: Blob, name: string) =>
  new File([blob], name, { type: blob.type });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getFileExtension = (f: any) => {
  const name =
    f instanceof File || Object.keys(f).indexOf("name") !== -1
      ? f.name
      : `${f}`;
  return name.substr(name.lastIndexOf(".") + 1);
};

const getFileCategory = (file: File) => {
  const extension = getFileExtension(file);
  if (IMAGES_EXTENSIONS.includes(extension)) {
    return "image";
  }
  if (VIDEOS_EXTENSIONS.includes(extension)) {
    return "video";
  }
  if (DOCUMENT_EXTENSIONS.includes(extension)) {
    return "document";
  }
  return null;
};

const copyToClipboard = (text: string) => {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(text);
};

export {
  DOCUMENT_EXTENSIONS,
  IMAGES_EXTENSIONS,
  VIDEOS_EXTENSIONS,
  blobToFile,
  copyToClipboard,
  getFileCategory,
  getFileExtension,
};
