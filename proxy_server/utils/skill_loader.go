package utils

import (
	"archive/zip"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
)

// SaveMultipartToTemp 将上传文件保存到临时 Zip
func SaveMultipartToTemp(fileHeader *multipart.FileHeader) (string, error) {
	if fileHeader == nil {
		return "", fmt.Errorf("未获取到技能包文件")
	}

	src, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("读取上传文件失败: %w", err)
	}
	defer src.Close()

	tmpFile, err := os.CreateTemp("", "skill-*.zip")
	if err != nil {
		return "", fmt.Errorf("创建临时文件失败: %w", err)
	}
	defer tmpFile.Close()

	if _, err := io.Copy(tmpFile, src); err != nil {
		return "", fmt.Errorf("写入临时文件失败: %w", err)
	}

	return tmpFile.Name(), nil
}

// ExtractZip 解压 Zip 文件
func ExtractZip(zipPath, destDir string) error {
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return fmt.Errorf("打开压缩包失败: %w", err)
	}
	defer reader.Close()

	if err := os.MkdirAll(destDir, 0o755); err != nil {
		return fmt.Errorf("创建解压目录失败: %w", err)
	}

	root := filepath.Clean(destDir)
	sep := string(os.PathSeparator)

	for _, file := range reader.File {
		cleanName := filepath.Clean(file.Name)
		if cleanName == "." {
			continue
		}
		if cleanName == ".." || strings.HasPrefix(cleanName, ".."+sep) || filepath.IsAbs(cleanName) || strings.Contains(cleanName, ":") {
			return fmt.Errorf("检测到非法路径: %s", file.Name)
		}

		targetPath := filepath.Join(root, cleanName)
		if !strings.HasPrefix(targetPath, root+sep) && targetPath != root {
			return fmt.Errorf("检测到非法路径: %s", file.Name)
		}

		if file.FileInfo().IsDir() {
			if err := os.MkdirAll(targetPath, file.Mode()); err != nil {
				return fmt.Errorf("创建目录失败: %w", err)
			}
			continue
		}

		if err := os.MkdirAll(filepath.Dir(targetPath), 0o755); err != nil {
			return fmt.Errorf("创建文件目录失败: %w", err)
		}

		dstFile, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.Mode())
		if err != nil {
			return fmt.Errorf("创建文件失败: %w", err)
		}

		srcFile, err := file.Open()
		if err != nil {
			dstFile.Close()
			return fmt.Errorf("读取压缩内容失败: %w", err)
		}

		if _, err := io.Copy(dstFile, srcFile); err != nil {
			srcFile.Close()
			dstFile.Close()
			return fmt.Errorf("写入文件失败: %w", err)
		}

		srcFile.Close()
		dstFile.Close()
	}

	return nil
}

// HasSkillManifest 判断是否存在 SKILL.md
func HasSkillManifest(rootDir string) (bool, error) {
	found := false
	err := filepath.WalkDir(rootDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() && strings.EqualFold(filepath.Base(path), "SKILL.md") {
			found = true
			return io.EOF
		}
		return nil
	})
	if err != nil && err != io.EOF {
		return false, err
	}
	return found, nil
}

// PromoteExtractedSkill 将技能从临时目录移动到目标目录
func PromoteExtractedSkill(tmpDir, skillsRoot string) error {
	entries, err := os.ReadDir(tmpDir)
	// empty package should still be considered invalid earlier, but guard
	if err != nil {
		return fmt.Errorf("读取临时目录失败: %w", err)
	}

	for _, entry := range entries {
		srcPath := filepath.Join(tmpDir, entry.Name())
		dstPath := filepath.Join(skillsRoot, entry.Name())

		if _, err := os.Stat(dstPath); err == nil {
			if err := os.RemoveAll(dstPath); err != nil {
				return fmt.Errorf("清理旧技能目录失败: %w", err)
			}
		}

		if err := os.Rename(srcPath, dstPath); err != nil {
			return fmt.Errorf("移动技能目录失败: %w", err)
		}
	}

	return nil
}
