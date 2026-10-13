package com.paperlessfamily.service;

import com.paperlessfamily.dto.DashboardStatsDTO;
import com.paperlessfamily.dto.DocumentDTO;
import com.paperlessfamily.dto.DocumentUploadRequest;
import com.paperlessfamily.entity.Document;
import com.paperlessfamily.entity.Family;
import com.paperlessfamily.entity.FamilyMember;
import com.paperlessfamily.entity.User;
import com.paperlessfamily.exception.BadRequestException;
import com.paperlessfamily.exception.ResourceNotFoundException;
import com.paperlessfamily.exception.UnauthorizedException;
import com.paperlessfamily.repository.DocumentRepository;
import com.paperlessfamily.repository.FamilyMemberRepository;
import com.paperlessfamily.repository.FamilyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png");

    private final DocumentRepository documentRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final FamilyRepository familyRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    @Transactional
    public DocumentDTO uploadDocument(MultipartFile file, DocumentUploadRequest req, User user) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty");
        }

        FamilyMember uploaderMember = familyMemberRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("User does not belong to any family. Please create or join a family first."));

        Family family = uploaderMember.getFamily();

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document");
        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Unsupported file type: " + extension + ". Allowed types: pdf, jpg, jpeg, png");
        }

        String storedPath = fileStorageService.storeFile(file, family.getFamilyCode());

        String extractedText = "";
        if ("pdf".equals(extension)) {
            try (PDDocument pdfDoc = Loader.loadPDF(file.getBytes())) {
                PDFTextStripper stripper = new PDFTextStripper();
                extractedText = stripper.getText(pdfDoc);
                if (extractedText != null && extractedText.length() > 10000) {
                    extractedText = extractedText.substring(0, 10000);
                }
            } catch (Exception e) {
                log.warn("Failed to extract text from PDF {}: {}", originalFilename, e.getMessage());
            }
        }

        FamilyMember owner = uploaderMember;
        if (req.getOwnerId() != null) {
            owner = familyMemberRepository.findById(req.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Owner member not found with ID: " + req.getOwnerId()));
            if (!owner.getFamily().getId().equals(family.getId())) {
                throw new BadRequestException("Specified owner does not belong to this family");
            }
        }

        LocalDate issueDate = parseLocalDate(req.getIssueDate());
        LocalDate expiryDate = parseLocalDate(req.getExpiryDate());

        Document document = Document.builder()
                .name(req.getName().trim())
                .category(req.getCategory().trim())
                .subcategory(req.getSubcategory() != null ? req.getSubcategory().trim() : null)
                .owner(owner)
                .family(family)
                .fileName(originalFilename)
                .filePath(storedPath)
                .fileType(file.getContentType() != null ? file.getContentType() : extension)
                .fileSize(file.getSize())
                .issueDate(issueDate)
                .expiryDate(expiryDate)
                .description(req.getDescription())
                .extractedText(extractedText)
                .uploadedBy(user)
                .build();

        Document savedDoc = documentRepository.save(document);

        notificationService.createNotification(
                user,
                family,
                "Document Uploaded: " + savedDoc.getName(),
                "New document '" + savedDoc.getName() + "' was uploaded to " + savedDoc.getCategory() + " by " + user.getName(),
                "UPLOAD"
        );

        if (expiryDate != null && expiryDate.isBefore(LocalDate.now().plusDays(30))) {
            notificationService.createNotification(
                    user,
                    family,
                    "Document Expiring Soon: " + savedDoc.getName(),
                    savedDoc.getName() + " expires on " + expiryDate + ". Please review it.",
                    "EXPIRY"
            );
        }

        return mapToDTO(savedDoc);
    }

    @Transactional(readOnly = true)
    public List<DocumentDTO> getDocuments(Long familyId, String category, Long ownerId, String search, String sort, User user) {
        if (familyId == null) {
            FamilyMember member = familyMemberRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new BadRequestException("User does not belong to any family"));
            familyId = member.getFamily().getId();
        }
        verifyFamilyMembership(familyId, user);

        List<Document> docs;

        if (StringUtils.hasText(search)) {
            docs = documentRepository.searchDocuments(familyId, search.trim());
        } else if (StringUtils.hasText(category)) {
            docs = documentRepository.findByFamilyIdAndCategory(familyId, category.trim());
        } else if (ownerId != null) {
            docs = documentRepository.findByFamilyIdAndOwnerId(familyId, ownerId);
        } else {
            docs = documentRepository.findByFamilyIdOrderByUploadedAtDesc(familyId);
        }

        if (ownerId != null && (StringUtils.hasText(search) || StringUtils.hasText(category))) {
            docs = docs.stream()
                    .filter(d -> d.getOwner() != null && d.getOwner().getId().equals(ownerId))
                    .collect(Collectors.toList());
        }

        if (StringUtils.hasText(category) && StringUtils.hasText(search)) {
            docs = docs.stream()
                    .filter(d -> d.getCategory() != null && d.getCategory().equalsIgnoreCase(category.trim()))
                    .collect(Collectors.toList());
        }

        if ("name".equalsIgnoreCase(sort)) {
            docs.sort(Comparator.comparing(Document::getName, String.CASE_INSENSITIVE_ORDER));
        } else if ("expiryDate".equalsIgnoreCase(sort)) {
            docs.sort(Comparator.comparing(Document::getExpiryDate, Comparator.nullsLast(Comparator.naturalOrder())));
        } else {
            docs.sort(Comparator.comparing(Document::getUploadedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        }

        return docs.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DocumentDTO getDocument(Long id, User user) {
        Document document = findAndVerifyDocument(id, user);
        return mapToDTO(document);
    }

    @Transactional
    public DocumentDTO updateDocument(Long id, DocumentUploadRequest req, User user) {
        Document document = findAndVerifyDocument(id, user);

        if (StringUtils.hasText(req.getName())) {
            document.setName(req.getName().trim());
        }
        if (StringUtils.hasText(req.getCategory())) {
            document.setCategory(req.getCategory().trim());
        }
        if (req.getSubcategory() != null) {
            document.setSubcategory(req.getSubcategory().trim());
        }
        if (req.getDescription() != null) {
            document.setDescription(req.getDescription().trim());
        }
        if (req.getIssueDate() != null) {
            document.setIssueDate(parseLocalDate(req.getIssueDate()));
        }
        if (req.getExpiryDate() != null) {
            document.setExpiryDate(parseLocalDate(req.getExpiryDate()));
        }
        if (req.getOwnerId() != null) {
            FamilyMember owner = familyMemberRepository.findById(req.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Owner member not found with ID: " + req.getOwnerId()));
            if (!owner.getFamily().getId().equals(document.getFamily().getId())) {
                throw new BadRequestException("Owner must belong to the same family");
            }
            document.setOwner(owner);
        }

        Document updated = documentRepository.save(document);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteDocument(Long id, User user) {
        Document document = findAndVerifyDocument(id, user);

        if (document.getFilePath() != null) {
            fileStorageService.deleteFile(document.getFilePath());
        }

        documentRepository.delete(document);
        log.info("Deleted document ID {} by user {}", id, user.getEmail());
    }

    @Transactional(readOnly = true)
    public List<DocumentDTO> getExpiringDocuments(User user) {
        FamilyMember member = familyMemberRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User does not belong to any family"));

        LocalDate thirtyDaysFromNow = LocalDate.now().plusDays(30);
        List<Document> docs = documentRepository.findExpiringDocuments(member.getFamily().getId(), thirtyDaysFromNow);
        return docs.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats(User user) {
        FamilyMember member = familyMemberRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User does not belong to any family"));

        Long familyId = member.getFamily().getId();
        long totalDocs = documentRepository.countByFamilyId(familyId);
        long totalMembers = familyMemberRepository.countByFamilyId(familyId);

        LocalDate thirtyDaysFromNow = LocalDate.now().plusDays(30);
        List<Document> expiringDocs = documentRepository.findExpiringDocuments(familyId, thirtyDaysFromNow);
        long expiringSoon = expiringDocs.stream()
                .filter(d -> "EXPIRING_SOON".equals(d.getStatus()) || "EXPIRED".equals(d.getStatus()))
                .count();

        long bytesUsed = fileStorageService.getFamilyStorageUsed(member.getFamily().getFamilyCode());
        String formattedStorage = fileStorageService.formatStorageSize(bytesUsed);

        return DashboardStatsDTO.builder()
                .totalDocuments(totalDocs)
                .totalMembers(totalMembers)
                .expiringSoon(expiringSoon)
                .storageUsed(formattedStorage)
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] downloadDocument(Long id, User user) {
        Document document = findAndVerifyDocument(id, user);
        if (document.getFilePath() == null || document.getFilePath().isBlank()) {
            throw new BadRequestException("Document has no associated file content");
        }
        return fileStorageService.loadFile(document.getFilePath());
    }

    public List<Map<String, Object>> getCategories() {
        return List.of(
                Map.of("id", "identity", "name", "Identity", "icon", "id-card", "description", "IDs, Passports, Driving Licenses, Aadhaar"),
                Map.of("id", "insurance", "name", "Insurance", "icon", "shield", "description", "Health, Life, Motor, Property Insurance"),
                Map.of("id", "education", "name", "Education", "icon", "graduation-cap", "description", "Degrees, Certificates, Transcripts"),
                Map.of("id", "medical", "name", "Medical", "icon", "heart-pulse", "description", "Prescriptions, Reports, Health Records"),
                Map.of("id", "finance", "name", "Finance", "icon", "wallet", "description", "Tax filings, Bank statements, Investments"),
                Map.of("id", "legal", "name", "Legal", "icon", "scale", "description", "Agreements, Deeds, Wills, Contracts"),
                Map.of("id", "other", "name", "Other", "icon", "folder", "description", "Miscellaneous family documents")
        );
    }

    public Document findAndVerifyDocument(Long id, User user) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + id));

        verifyFamilyMembership(document.getFamily().getId(), user);
        return document;
    }

    private void verifyFamilyMembership(Long familyId, User user) {
        if (!familyMemberRepository.existsByUserIdAndFamilyId(user.getId(), familyId)) {
            throw new UnauthorizedException("User is not authorized to access documents of family ID: " + familyId);
        }
    }

    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex > 0 && dotIndex < filename.length() - 1) {
            return filename.substring(dotIndex + 1);
        }
        return "";
    }

    private LocalDate parseLocalDate(String dateStr) {
        if (!StringUtils.hasText(dateStr)) {
            return null;
        }
        try {
            return LocalDate.parse(dateStr.trim());
        } catch (Exception e) {
            log.warn("Invalid date format for string '{}': {}", dateStr, e.getMessage());
            return null;
        }
    }

    public DocumentDTO mapToDTO(Document doc) {
        return DocumentDTO.builder()
                .id(doc.getId())
                .name(doc.getName())
                .category(doc.getCategory())
                .subcategory(doc.getSubcategory())
                .ownerName(doc.getOwner() != null && doc.getOwner().getUser() != null ? doc.getOwner().getUser().getName() : null)
                .ownerId(doc.getOwner() != null ? doc.getOwner().getId() : null)
                .familyId(doc.getFamily() != null ? doc.getFamily().getId() : null)
                .fileName(doc.getFileName())
                .fileType(doc.getFileType())
                .fileSize(doc.getFileSize())
                .issueDate(doc.getIssueDate() != null ? doc.getIssueDate().toString() : null)
                .expiryDate(doc.getExpiryDate() != null ? doc.getExpiryDate().toString() : null)
                .description(doc.getDescription())
                .status(doc.getStatus())
                .uploadedAt(doc.getUploadedAt() != null ? doc.getUploadedAt().toString() : null)
                .uploadedBy(doc.getUploadedBy() != null ? doc.getUploadedBy().getName() : null)
                .build();
    }
}
