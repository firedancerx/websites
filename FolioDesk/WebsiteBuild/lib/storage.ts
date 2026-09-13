import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, normalize, relative } from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

const EXTENSIONS_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type StoredFile = {
  bytes: Uint8Array;
  contentType: string;
  contentLength: number;
};

let spacesClient: S3Client | undefined;

function provider() {
  return (process.env.FILE_STORAGE_PROVIDER || "local").toLowerCase();
}

function safeObjectKey(pathSegments: string[]) {
  if (
    pathSegments.length === 0 ||
    pathSegments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\"))
  ) {
    throw new Error("Invalid upload path");
  }
  return pathSegments.join("/");
}

function localUploadPath(pathSegments: string[]) {
  const baseUploadsDir = normalize(join(process.cwd(), "public", "uploads"));
  const filePath = normalize(join(baseUploadsDir, ...pathSegments));
  const relativePath = relative(baseUploadsDir, filePath);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error("Upload path escapes the configured storage directory");
  }
  return filePath;
}

export function validateUpload(file: File) {
  if (file.size <= 0) throw new Error("The uploaded file is empty");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Uploads must be 10 MB or smaller");
  const extension = EXTENSIONS_BY_MIME[file.type.toLowerCase()];
  if (!extension) throw new Error("Only PDF, JPEG, PNG, WebP, HEIC, or HEIF uploads are accepted");
  return extension;
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required when FILE_STORAGE_PROVIDER=spaces`);
  return value;
}

function getSpacesClient() {
  if (!spacesClient) {
    spacesClient = new S3Client({
      endpoint: required("SPACES_ENDPOINT"),
      region: process.env.SPACES_REGION || "sgp1",
      credentials: {
        accessKeyId: required("SPACES_ACCESS_KEY"),
        secretAccessKey: required("SPACES_SECRET_KEY"),
      },
    });
  }
  return spacesClient;
}

export async function saveUpload(
  pathSegments: string[],
  bytes: Uint8Array,
  contentType?: string,
) {
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new Error("Uploads must be 10 MB or smaller");
  const key = safeObjectKey(pathSegments);
  const resolvedContentType = contentType || MIME_TYPES[extname(key).toLowerCase()] || "application/octet-stream";

  if (provider() === "spaces") {
    await getSpacesClient().send(
      new PutObjectCommand({
        Bucket: required("SPACES_BUCKET"),
        Key: `uploads/${key}`,
        Body: bytes,
        ContentType: resolvedContentType,
        CacheControl: "private, no-store",
      }),
    );
  } else {
    const filePath = localUploadPath(pathSegments);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, bytes);
  }

  return `/foliodesk/uploads/${key}`;
}

export async function readUpload(pathSegments: string[]): Promise<StoredFile> {
  const key = safeObjectKey(pathSegments);

  if (provider() === "spaces") {
    const response = await getSpacesClient().send(
      new GetObjectCommand({
        Bucket: required("SPACES_BUCKET"),
        Key: `uploads/${key}`,
      }),
    );
    if (!response.Body) throw new Error("Upload body is empty");
    const bytes = await response.Body.transformToByteArray();
    return {
      bytes,
      contentType: response.ContentType || MIME_TYPES[extname(key).toLowerCase()] || "application/octet-stream",
      contentLength: response.ContentLength ?? bytes.byteLength,
    };
  }

  const filePath = localUploadPath(pathSegments);
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) throw new Error("Upload is not a file");
  const bytes = await readFile(filePath);
  return {
    bytes,
    contentType: MIME_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream",
    contentLength: fileStat.size,
  };
}
