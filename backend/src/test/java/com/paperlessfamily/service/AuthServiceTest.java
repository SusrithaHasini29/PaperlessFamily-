package com.paperlessfamily.service;

import com.paperlessfamily.dto.AuthRequest;
import com.paperlessfamily.dto.AuthResponse;
import com.paperlessfamily.dto.RegisterRequest;
import com.paperlessfamily.entity.User;
import com.paperlessfamily.exception.BadRequestException;
import com.paperlessfamily.repository.UserRepository;
import com.paperlessfamily.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthService covering registration and login flows.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Raj Sharma")
                .email("raj@test.com")
                .password("encodedPassword")
                .build();
    }

    @Test
    @DisplayName("Register - success when email is new")
    void register_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Raj Sharma");
        request.setEmail("raj@test.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("raj@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtTokenProvider.generateToken(any(User.class))).thenReturn("jwt-token");

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getUser()).isNotNull();
        assertThat(response.getUser().getEmail()).isEqualTo("raj@test.com");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Register - throws BadRequestException when email already exists")
    void register_ThrowsWhenEmailExists() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Raj Sharma");
        request.setEmail("raj@test.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("raj@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Login - returns token on valid credentials")
    void login_Success() {
        AuthRequest request = new AuthRequest();
        request.setEmail("raj@test.com");
        request.setPassword("password123");

        Authentication mockAuth = mock(Authentication.class);
        when(mockAuth.getPrincipal()).thenReturn(testUser);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mockAuth);
        when(jwtTokenProvider.generateToken(testUser)).thenReturn("jwt-token");

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt-token");
    }

    @Test
    @DisplayName("getCurrentUser - maps user to UserDTO correctly")
    void getCurrentUser_MapsCorrectly() {
        var dto = authService.getCurrentUser(testUser);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getName()).isEqualTo("Raj Sharma");
        assertThat(dto.getEmail()).isEqualTo("raj@test.com");
    }
}
