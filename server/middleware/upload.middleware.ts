import multer from 'multer';
import { type Request } from 'express';

/**
 * 文件上传中间件配置
 * 使用内存存储，将文件读入 Buffer 后直接存入数据库
 */

// 配置内存存储
const storage = multer.memoryStorage();

// 文件过滤器：只允许 .zip 文件
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // 检查 MIME 类型和文件扩展名
  const isZip =
    file.mimetype === 'application/zip' ||
    file.mimetype === 'application/x-zip-compressed' ||
    file.originalname.toLowerCase().endsWith('.zip');

  if (isZip) {
    cb(null, true);
  } else {
    cb(new Error('只支持 .zip 格式的压缩包'));
  }
};

// 创建 multer 实例
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB
  },
});
