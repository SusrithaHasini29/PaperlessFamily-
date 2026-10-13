package com.paperlessfamily.service;

import com.paperlessfamily.dto.*;
import com.paperlessfamily.entity.*;
import com.paperlessfamily.exception.BadRequestException;
import com.paperlessfamily.exception.ResourceNotFoundException;
import com.paperlessfamily.exception.UnauthorizedException;
import com.paperlessfamily.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final DocumentRepository documentRepository;
    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    @Transactional
    public FamilyDTO createFamily(CreateFamilyRequest req, User user) {
        Family family = Family.builder()
                .familyName(req.getFamilyName().trim())
                .createdBy(user)
                .build();
        Family savedFamily = familyRepository.save(family);

        FamilyMember adminMember = FamilyMember.builder()
                .user(user)
                .family(savedFamily)
                .relationship("Head of Family")
                .role(Role.ADMIN)
                .build();
        familyMemberRepository.save(adminMember);

        log.info("Created family '{}' with code '{}' for user {}", savedFamily.getFamilyName(), savedFamily.getFamilyCode(), user.getEmail());
        return mapToDTO(savedFamily, 1L);
    }

    @Transactional
    public FamilyDTO getUserFamily(User user) {
        return familyMemberRepository.findByUserId(user.getId())
                .map(member -> {
                    Family family = member.getFamily();
                    long memberCount = familyMemberRepository.countByFamilyId(family.getId());
                    return mapToDTO(family, memberCount);
                })
                .orElseGet(() -> {
                    String famName = (user.getName() != null && !user.getName().isBlank())
                            ? user.getName().trim() + " Family"
                            : "My Family";
                    CreateFamilyRequest req = new CreateFamilyRequest();
                    req.setFamilyName(famName);
                    return createFamily(req, user);
                });
    }

    @Transactional(readOnly = true)
    public List<FamilyMemberDTO> getFamilyMembers(Long familyId, User user) {
        verifyUserInFamily(familyId, user);

        List<FamilyMember> members = familyMemberRepository.findByFamilyId(familyId);
        return members.stream().map(m -> {
            long docCount = documentRepository.findByFamilyIdAndOwnerId(familyId, m.getId()).size();
            return mapToMemberDTO(m, docCount);
        }).collect(Collectors.toList());
    }

    @Transactional
    public FamilyMemberDTO addMember(Long familyId, AddMemberRequest req, User user) {
        Family family = verifyAdmin(familyId, user);

        String email = req.getEmail().toLowerCase().trim();
        User memberUser = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .name(req.getName().trim())
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .build();
            return userRepository.save(newUser);
        });

        if (familyMemberRepository.existsByUserIdAndFamilyId(memberUser.getId(), familyId)) {
            throw new BadRequestException("User is already a member of this family");
        }

        Role role = Role.MEMBER;
        if (req.getRole() != null && req.getRole().equalsIgnoreCase("ADMIN")) {
            role = Role.ADMIN;
        }

        FamilyMember newMember = FamilyMember.builder()
                .user(memberUser)
                .family(family)
                .relationship(req.getRelationship().trim())
                .role(role)
                .build();
        FamilyMember savedMember = familyMemberRepository.save(newMember);

        notificationService.createNotification(
                memberUser,
                family,
                "Welcome to " + family.getFamilyName(),
                user.getName() + " added you to the " + family.getFamilyName() + " family.",
                "FAMILY_JOIN"
        );

        return mapToMemberDTO(savedMember, 0L);
    }

    @Transactional
    public FamilyMemberDTO updateMember(Long familyId, Long memberId, UpdateMemberRequest req, User user) {
        verifyAdmin(familyId, user);

        FamilyMember member = familyMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Family member not found with ID: " + memberId));

        if (!member.getFamily().getId().equals(familyId)) {
            throw new BadRequestException("Member does not belong to this family");
        }

        if (req.getRelationship() != null && !req.getRelationship().isBlank()) {
            member.setRelationship(req.getRelationship().trim());
        }

        if (req.getRole() != null && !req.getRole().isBlank()) {
            try {
                member.setRole(Role.valueOf(req.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role: " + req.getRole() + ". Supported roles: ADMIN, MEMBER");
            }
        }

        FamilyMember updatedMember = familyMemberRepository.save(member);
        long docCount = documentRepository.findByFamilyIdAndOwnerId(familyId, member.getId()).size();
        return mapToMemberDTO(updatedMember, docCount);
    }

    @Transactional
    public void removeMember(Long familyId, Long memberId, User user) {
        verifyAdmin(familyId, user);

        FamilyMember member = familyMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Family member not found with ID: " + memberId));

        if (!member.getFamily().getId().equals(familyId)) {
            throw new BadRequestException("Member does not belong to this family");
        }

        if (member.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Cannot remove yourself from the family");
        }

        familyMemberRepository.delete(member);
        log.info("Removed member ID {} from family ID {}", memberId, familyId);
    }

    @Transactional
    public FamilyDTO joinFamily(JoinFamilyRequest req, User user) {
        Family family = familyRepository.findByFamilyCode(req.getFamilyCode().trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Family not found with code: " + req.getFamilyCode()));

        if (familyMemberRepository.existsByUserIdAndFamilyId(user.getId(), family.getId())) {
            throw new BadRequestException("You are already a member of this family");
        }

        // Clean up previous auto-generated single-member empty family if user had one
        Optional<FamilyMember> existingMemberOpt = familyMemberRepository.findByUserId(user.getId());
        if (existingMemberOpt.isPresent()) {
            FamilyMember existing = existingMemberOpt.get();
            Family oldFamily = existing.getFamily();
            long oldDocCount = documentRepository.countByFamilyId(oldFamily.getId());
            long oldMemCount = familyMemberRepository.countByFamilyId(oldFamily.getId());
            if (oldDocCount == 0 && oldMemCount == 1 && !oldFamily.getId().equals(family.getId())) {
                familyMemberRepository.delete(existing);
                familyRepository.delete(oldFamily);
                log.info("Cleaned up empty previous family '{}' for user {}", oldFamily.getFamilyName(), user.getEmail());
            }
        }

        String rel = (req.getRelationship() != null && !req.getRelationship().isBlank())
                ? req.getRelationship().trim()
                : "Member";

        FamilyMember newMember = FamilyMember.builder()
                .user(user)
                .family(family)
                .relationship(rel)
                .role(Role.MEMBER)
                .build();
        familyMemberRepository.save(newMember);

        notificationService.createNotification(
                family.getCreatedBy(),
                family,
                "New Family Member Joined",
                user.getName() + " has joined the " + family.getFamilyName() + " vault.",
                "MEMBER"
        );

        long memberCount = familyMemberRepository.countByFamilyId(family.getId());
        return mapToDTO(family, memberCount);
    }

    @Transactional
    public InvitationDTO inviteMember(Long familyId, InviteMemberRequest req, User user) {
        Family family = verifyAdmin(familyId, user);

        String email = req.getEmail().toLowerCase().trim();
        Invitation invitation = Invitation.builder()
                .family(family)
                .email(email)
                .relationship(req.getRelationship().trim())
                .invitedBy(user)
                .status(InvitationStatus.PENDING)
                .build();
        Invitation savedInvitation = invitationRepository.save(invitation);

        userRepository.findByEmail(email).ifPresent(invitedUser -> {
            notificationService.createNotification(
                    invitedUser,
                    family,
                    "Invitation to join " + family.getFamilyName(),
                    user.getName() + " invited you to join the " + family.getFamilyName() + " family.",
                    "INVITATION"
            );
        });

        return mapToInvitationDTO(savedInvitation);
    }

    @Transactional(readOnly = true)
    public List<InvitationDTO> getFamilyInvitations(Long familyId, User user) {
        verifyUserInFamily(familyId, user);
        return invitationRepository.findByFamilyId(familyId)
                .stream()
                .map(this::mapToInvitationDTO)
                .collect(Collectors.toList());
    }

    public Family verifyUserInFamily(Long familyId, User user) {
        return familyMemberRepository.findByUserIdAndFamilyId(user.getId(), familyId)
                .map(FamilyMember::getFamily)
                .orElseThrow(() -> new UnauthorizedException("User does not have access to family ID: " + familyId));
    }

    public Family verifyAdmin(Long familyId, User user) {
        FamilyMember member = familyMemberRepository.findByUserIdAndFamilyId(user.getId(), familyId)
                .orElseThrow(() -> new UnauthorizedException("User does not belong to family ID: " + familyId));

        if (member.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Admin privileges required to perform this action");
        }
        return member.getFamily();
    }

    public FamilyDTO mapToDTO(Family family, long memberCount) {
        return FamilyDTO.builder()
                .id(family.getId())
                .familyName(family.getFamilyName())
                .familyCode(family.getFamilyCode())
                .createdAt(family.getCreatedAt() != null ? family.getCreatedAt().toString() : null)
                .memberCount(memberCount)
                .build();
    }

    public FamilyMemberDTO mapToMemberDTO(FamilyMember member, long documentCount) {
        return FamilyMemberDTO.builder()
                .id(member.getId())
                .userId(member.getUser() != null ? member.getUser().getId() : null)
                .name(member.getUser() != null ? member.getUser().getName() : "")
                .email(member.getUser() != null ? member.getUser().getEmail() : "")
                .relationship(member.getRelationship())
                .role(member.getRole() != null ? member.getRole().name() : "MEMBER")
                .documentCount(documentCount)
                .joinedAt(member.getJoinedAt() != null ? member.getJoinedAt().toString() : null)
                .build();
    }

    public InvitationDTO mapToInvitationDTO(Invitation inv) {
        return InvitationDTO.builder()
                .id(inv.getId())
                .email(inv.getEmail())
                .relationship(inv.getRelationship())
                .status(inv.getStatus() != null ? inv.getStatus().name() : "PENDING")
                .familyName(inv.getFamily() != null ? inv.getFamily().getFamilyName() : "")
                .invitedBy(inv.getInvitedBy() != null ? inv.getInvitedBy().getName() : "")
                .createdAt(inv.getCreatedAt() != null ? inv.getCreatedAt().toString() : null)
                .build();
    }
}
