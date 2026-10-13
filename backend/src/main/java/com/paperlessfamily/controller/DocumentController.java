package com.paperlessfamily.controller;

import com.paperlessfamily.dto.ApiResponse;
import com.paperlessfamily.dto.DashboardStatsDTO;
import com.paperlessfamily.dto.DocumentDTO;
import com.paperlessfamily.dto.DocumentUploadRequest;
import com.paperlessfamily.entity.User;
import com.paperlessfamily.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentDTO>> uploadDocument(
            @RequestPart("file") MultipartFile file,
            @RequestParam("name") String name,
            @RequestParam("category") String category,
            @RequestParam(value = "subcategory", required = false) String subcategory,
            @RequestParam(value = "ownerId", required = false) Long ownerId,
            @RequestParam(value = "issueDate", required = false) String issueDate,
            @RequestParam(value = "expiryDate", required = false) String expiryDate,
            @RequestParam(value = "description", required = false) String description,
            @AuthenticationPrincipal User user) {

        DocumentUploadRequest req = DocumentUploadRequest.builder()
                .name(name)
                .category(category)
                .subcategory(subcategory)
                .ownerId(ownerId)
                .issueDate(issueDate)
                .expiryDate(expiryDate)
                .description(description)
                .build();

        DocumentDTO dto = documentService.uploadDocument(file, req, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Document uploaded successfully", dto));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentDTO>>> getDocuments(
            @RequestParam(value = "familyId", required = false) Long familyId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "uploadedAt") String sort,
            @AuthenticationPrincipal User user) {

        List<DocumentDTO> docs = documentService.getDocuments(familyId, category, ownerId, search, sort, user);
        return ResponseEntity.ok(ApiResponse.success(docs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentDTO>> getDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        DocumentDTO dto = documentService.getDocument(id, user);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentDTO>> updateDocument(
            @PathVariable Long id,
            @RequestBody DocumentUploadRequest req,
            @AuthenticationPrincipal User user) {
        DocumentDTO dto = documentService.updateDocument(id, req, user);
        return ResponseEntity.ok(ApiResponse.success("Document updated successfully", dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        documentService.deleteDocument(id, user);
        return ResponseEntity.ok(ApiResponse.success("Document deleted successfully", null));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        DocumentDTO doc = documentService.getDocument(id, user);
        byte[] data = documentService.downloadDocument(id, user);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (doc.getFileType() != null) {
            try {
                mediaType = MediaType.parseMediaType(doc.getFileType());
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getFileName() + "\"")
                .body(data);
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<byte[]> previewDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        DocumentDTO doc = documentService.getDocument(id, user);
        byte[] data = documentService.downloadDocument(id, user);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (doc.getFileType() != null) {
            try {
                mediaType = MediaType.parseMediaType(doc.getFileType());
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.getFileName() + "\"")
                .body(data);
    }

    @GetMapping("/expiring")
    public ResponseEntity<ApiResponse<List<DocumentDTO>>> getExpiringDocuments(@AuthenticationPrincipal User user) {
        List<DocumentDTO> docs = documentService.getExpiringDocuments(user);
        return ResponseEntity.ok(ApiResponse.success(docs));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getDashboardStats(@AuthenticationPrincipal User user) {
        DashboardStatsDTO stats = documentService.getDashboardStats(user);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(documentService.getCategories()));
    }
}
