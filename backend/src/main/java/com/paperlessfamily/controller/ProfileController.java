package com.paperlessfamily.controller;

import com.paperlessfamily.dto.ApiResponse;
import com.paperlessfamily.dto.ProfileDTO;
import com.paperlessfamily.dto.UpdateProfileRequest;
import com.paperlessfamily.entity.User;
import com.paperlessfamily.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<ApiResponse<ProfileDTO>> getProfile(@AuthenticationPrincipal User user) {
        ProfileDTO profile = profileService.getProfile(user);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<ProfileDTO>> updateProfile(
            @RequestBody UpdateProfileRequest req,
            @AuthenticationPrincipal User user) {
        ProfileDTO updated = profileService.updateProfile(req, user);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }
}
