package com.paperlessfamily.service;

import com.paperlessfamily.exception.BadRequestException;
import com.paperlessfamily.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.stream.Stream;

@Slf4j
@Service
public class FileStorageService {

    @Value("${app.storage.upload-dir:./uploads}")
    private String uploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        try {
            this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(this.rootLocation);
            log.info("File upload directory initialized at: {}", this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    public String storeFile(MultipartFile file, String familyCode) {
        if (file.isEmpty()) {
            throw new BadRequestException("Failed to store empty file");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        if (originalFilename.contains("..")) {
            throw new BadRequestException("Filename contains invalid path sequence: " + originalFilename);
        }

        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex);
        }

        String storedFilename = UUID.randomUUID() + extension;

        try {
            Path familyPath = this.rootLocation.resolve(familyCode).normalize();
            Files.createDirectories(familyPath);

            Path destinationPath = familyPath.resolve(storedFilename).normalize();
            if (!destinationPath.startsWith(this.rootLocation)) {
                throw new BadRequestException("Cannot store file outside current storage directory");
            }

            Files.copy(file.getInputStream(), destinationPath, StandardCopyOption.REPLACE_EXISTING);
            return familyCode + "/" + storedFilename;
        } catch (IOException e) {
            log.error("Failed to store file {}", originalFilename, e);
            throw new RuntimeException("Failed to store file " + originalFilename, e);
        }
    }

    public byte[] loadFile(String filePath) {
        try {
            Path file = this.rootLocation.resolve(filePath).normalize();
            if (!file.startsWith(this.rootLocation) || !Files.exists(file)) {
                throw new ResourceNotFoundException("File not found at path: " + filePath);
            }
            return Files.readAllBytes(file);
        } catch (IOException e) {
            log.error("Failed to read file {}", filePath, e);
            throw new RuntimeException("Failed to read file at path: " + filePath, e);
        }
    }

    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return;
        }
        try {
            Path file = this.rootLocation.resolve(filePath).normalize();
            if (file.startsWith(this.rootLocation) && Files.exists(file)) {
                Files.delete(file);
                log.info("Deleted file: {}", file);
            }
        } catch (IOException e) {
            log.warn("Failed to delete file {}: {}", filePath, e.getMessage());
        }
    }

    public long getFamilyStorageUsed(String familyCode) {
        try {
            Path familyPath = this.rootLocation.resolve(familyCode).normalize();
            if (!Files.exists(familyPath)) {
                return 0L;
            }
            try (Stream<Path> walk = Files.walk(familyPath)) {
                return walk.filter(p -> !Files.isDirectory(p))
                        .mapToLong(p -> {
                            try {
                                return Files.size(p);
                            } catch (IOException e) {
                                return 0L;
                            }
                        })
                        .sum();
            }
        } catch (IOException e) {
            log.warn("Failed to calculate storage for family {}: {}", familyCode, e.getMessage());
            return 0L;
        }
    }

    public String formatStorageSize(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        }
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
}
