package com.paperlessfamily.service;

import com.paperlessfamily.dto.AuthRequest;
import com.paperlessfamily.dto.AuthResponse;
import com.paperlessfamily.dto.RegisterRequest;
import com.paperlessfamily.dto.UserDTO;
import com.paperlessfamily.entity.User;
import com.paperlessfamily.exception.BadRequestException;
import com.paperlessfamily.exception.ResourceNotFoundException;
import com.paperlessfamily.entity.Family;
import com.paperlessfamily.entity.FamilyMember;
import com.paperlessfamily.entity.Role;
import com.paperlessfamily.repository.FamilyMemberRepository;
import com.paperlessfamily.repository.FamilyRepository;
import com.paperlessfamily.repository.UserRepository;
import com.paperlessfamily.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        User savedUser = userRepository.save(user);

        // Automatically create a dedicated family vault for this new user
        String famName = savedUser.getName() + " Family";
        Family family = Family.builder()
                .familyName(famName)
                .createdBy(savedUser)
                .build();
        Family savedFamily = familyRepository.save(family);

        FamilyMember adminMember = FamilyMember.builder()
                .user(savedUser)
                .family(savedFamily)
                .relationship("Head of Family")
                .role(Role.ADMIN)
                .build();
        familyMemberRepository.save(adminMember);

        String token = tokenProvider.generateToken(savedUser);

        log.info("Registered new user '{}' with family '{}'", savedUser.getEmail(), savedFamily.getFamilyName());
        return AuthResponse.builder()
                .token(token)
                .user(mapToDTO(savedUser))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        String token = tokenProvider.generateToken(user);
        log.info("User logged in successfully: {}", email);

        return AuthResponse.builder()
                .token(token)
                .user(mapToDTO(user))
                .build();
    }

    public UserDTO getCurrentUser(User user) {
        return mapToDTO(user);
    }

    public UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .profileImage(user.getProfileImage())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}
