package com.paperlessfamily.service;

import com.paperlessfamily.entity.Document;
import com.paperlessfamily.entity.Family;
import com.paperlessfamily.entity.FamilyMember;
import com.paperlessfamily.entity.User;
import com.paperlessfamily.entity.Role;
import com.paperlessfamily.exception.UnauthorizedException;
import com.paperlessfamily.repository.DocumentRepository;
import com.paperlessfamily.repository.FamilyMemberRepository;
import com.paperlessfamily.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for DocumentService covering expiry status calculation
 * and access authorization.
 */
@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private FamilyMemberRepository familyMemberRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private DocumentService documentService;

    private User owner;
    private User otherUser;
    private Family family;
    private FamilyMember memberOfFamily;
    private FamilyMember memberOfOtherFamily;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(1L).name("Raj Sharma").email("raj@test.com").build();
        otherUser = User.builder().id(2L).name("Other User").email("other@test.com").build();

        family = Family.builder().id(1L).familyName("Sharma Family").familyCode("FAM-TEST").build();
        Family otherFamily = Family.builder().id(2L).familyName("Other Family").familyCode("FAM-OTH").build();

        memberOfFamily = FamilyMember.builder()
                .id(1L).user(owner).family(family).role(Role.MEMBER).build();
        memberOfOtherFamily = FamilyMember.builder()
                .id(2L).user(otherUser).family(otherFamily).role(Role.MEMBER).build();
    }

    // ─── Expiry Status Tests ───────────────────────────────────────────────────

    @Test
    @DisplayName("Document.getStatus returns ACTIVE for non-expiring document")
    void document_StatusActive() {
        Document doc = Document.builder()
                .expiryDate(LocalDate.now().plusDays(60))
                .build();
        assertThat(doc.getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("Document.getStatus returns EXPIRING_SOON within 30 days")
    void document_StatusExpiringSoon() {
        Document doc = Document.builder()
                .expiryDate(LocalDate.now().plusDays(15))
                .build();
        assertThat(doc.getStatus()).isEqualTo("EXPIRING_SOON");
    }

    @Test
    @DisplayName("Document.getStatus returns EXPIRED for past expiry date")
    void document_StatusExpired() {
        Document doc = Document.builder()
                .expiryDate(LocalDate.now().minusDays(1))
                .build();
        assertThat(doc.getStatus()).isEqualTo("EXPIRED");
    }

    @Test
    @DisplayName("Document.getStatus returns ACTIVE when no expiry date set")
    void document_StatusActiveWhenNoExpiry() {
        Document doc = Document.builder().build();
        assertThat(doc.getStatus()).isEqualTo("ACTIVE");
    }

    // ─── Authorization Tests ───────────────────────────────────────────────────

    @Test
    @DisplayName("getDocument throws UnauthorizedException for cross-family access")
    void getDocument_ThrowsForCrossFamilyAccess() {
        Document doc = Document.builder()
                .id(1L)
                .name("Passport")
                .family(family)
                .build();

        when(documentRepository.findById(1L)).thenReturn(Optional.of(doc));
        when(familyMemberRepository.findByUserId(otherUser.getId()))
                .thenReturn(Optional.of(memberOfOtherFamily));

        assertThatThrownBy(() -> documentService.getDocument(1L, otherUser))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("getDocument returns DTO for authorized family member")
    void getDocument_SuccessForFamilyMember() {
        FamilyMember ownerMember = FamilyMember.builder()
                .id(1L).user(owner).family(family).relationship("Father").role(Role.MEMBER).build();

        Document doc = Document.builder()
                .id(1L)
                .name("Passport")
                .category("Identity")
                .family(family)
                .owner(ownerMember)
                .uploadedBy(owner)
                .fileType("application/pdf")
                .fileSize(1024L)
                .build();

        when(documentRepository.findById(1L)).thenReturn(Optional.of(doc));
        when(familyMemberRepository.findByUserId(owner.getId()))
                .thenReturn(Optional.of(memberOfFamily));

        var result = documentService.getDocument(1L, owner);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Passport");
        assertThat(result.getCategory()).isEqualTo("Identity");
    }
}
