package com.paperlessfamily.service;

import com.paperlessfamily.dto.ProfileDTO;
import com.paperlessfamily.dto.UpdateProfileRequest;
import com.paperlessfamily.entity.FamilyMember;
import com.paperlessfamily.entity.User;
import com.paperlessfamily.repository.FamilyMemberRepository;
import com.paperlessfamily.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final FamilyMemberRepository familyMemberRepository;

    @Transactional(readOnly = true)
    public ProfileDTO getProfile(User user) {
        Optional<FamilyMember> memberOpt = familyMemberRepository.findByUserId(user.getId());

        ProfileDTO.ProfileDTOBuilder builder = ProfileDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .profileImage(user.getProfileImage());

        if (memberOpt.isPresent()) {
            FamilyMember member = memberOpt.get();
            builder.relationship(member.getRelationship())
                    .role(member.getRole() != null ? member.getRole().name() : null)
                    .familyName(member.getFamily() != null ? member.getFamily().getFamilyName() : null)
                    .familyCode(member.getFamily() != null ? member.getFamily().getFamilyCode() : null)
                    .joinedAt(member.getJoinedAt() != null ? member.getJoinedAt().toString() : null);
        }

        return builder.build();
    }

    @Transactional
    public ProfileDTO updateProfile(UpdateProfileRequest req, User user) {
        User existingUser = userRepository.findById(user.getId())
                .orElse(user);

        if (StringUtils.hasText(req.getName())) {
            existingUser.setName(req.getName().trim());
            existingUser = userRepository.save(existingUser);
        }

        Optional<FamilyMember> memberOpt = familyMemberRepository.findByUserId(user.getId());
        if (memberOpt.isPresent() && StringUtils.hasText(req.getRelationship())) {
            FamilyMember member = memberOpt.get();
            member.setRelationship(req.getRelationship().trim());
            familyMemberRepository.save(member);
        }

        log.info("Profile updated for user: {}", existingUser.getEmail());
        return getProfile(existingUser);
    }
}
