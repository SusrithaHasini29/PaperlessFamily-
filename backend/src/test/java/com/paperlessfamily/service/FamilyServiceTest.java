package com.paperlessfamily.service;

import com.paperlessfamily.dto.CreateFamilyRequest;
import com.paperlessfamily.dto.FamilyDTO;
import com.paperlessfamily.entity.*;
import com.paperlessfamily.exception.ResourceNotFoundException;
import com.paperlessfamily.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for FamilyService covering family creation and member management.
 */
@ExtendWith(MockitoExtension.class)
class FamilyServiceTest {

    @Mock
    private FamilyRepository familyRepository;

    @Mock
    private FamilyMemberRepository familyMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private InvitationRepository invitationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private FamilyService familyService;

    private User testUser;
    private Family testFamily;
    private FamilyMember adminMember;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Raj Sharma")
                .email("raj@test.com")
                .password("encoded")
                .build();

        testFamily = Family.builder()
                .id(1L)
                .familyName("Sharma Family")
                .familyCode("FAM-TEST1")
                .createdBy(testUser)
                .build();

        adminMember = FamilyMember.builder()
                .id(1L)
                .user(testUser)
                .family(testFamily)
                .relationship("Father")
                .role(Role.ADMIN)
                .build();
    }

    @Test
    @DisplayName("createFamily - creates family and admin member successfully")
    void createFamily_Success() {
        CreateFamilyRequest req = new CreateFamilyRequest();
        req.setFamilyName("Sharma Family");

        when(familyRepository.save(any(Family.class))).thenReturn(testFamily);
        when(familyMemberRepository.save(any(FamilyMember.class))).thenReturn(adminMember);
        when(familyMemberRepository.countByFamilyId(1L)).thenReturn(1L);

        FamilyDTO result = familyService.createFamily(req, testUser);

        assertThat(result).isNotNull();
        assertThat(result.getFamilyName()).isEqualTo("Sharma Family");
        verify(familyRepository, times(1)).save(any(Family.class));
        verify(familyMemberRepository, times(1)).save(any(FamilyMember.class));
    }

    @Test
    @DisplayName("getUserFamily - throws ResourceNotFoundException when no family")
    void getUserFamily_ThrowsWhenNoFamily() {
        when(familyMemberRepository.findByUserId(testUser.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> familyService.getUserFamily(testUser))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getUserFamily - returns family DTO when member exists")
    void getUserFamily_Success() {
        when(familyMemberRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(adminMember));
        when(familyMemberRepository.countByFamilyId(testFamily.getId())).thenReturn(1L);

        FamilyDTO result = familyService.getUserFamily(testUser);

        assertThat(result).isNotNull();
        assertThat(result.getFamilyName()).isEqualTo("Sharma Family");
        assertThat(result.getFamilyCode()).isEqualTo("FAM-TEST1");
    }
}
