package com.paperlessfamily.controller;

import com.paperlessfamily.dto.ApiResponse;
import com.paperlessfamily.dto.AuthRequest;
import com.paperlessfamily.dto.AuthResponse;
import com.paperlessfamily.dto.RegisterRequest;
import com.paperlessfamily.dto.UserDTO;
import com.paperlessfamily.entity.User;
import com.paperlessfamily.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser(@AuthenticationPrincipal User user) {
        UserDTO dto = authService.getCurrentUser(user);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
