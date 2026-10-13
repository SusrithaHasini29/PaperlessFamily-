package com.paperlessfamily.controller;

import com.paperlessfamily.dto.*;
import com.paperlessfamily.entity.User;
import com.paperlessfamily.service.FamilyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/families", "/api/family"})
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping
    public ResponseEntity<ApiResponse<FamilyDTO>> createFamily(
            @Valid @RequestBody CreateFamilyRequest req,
            @AuthenticationPrincipal User user) {
        FamilyDTO dto = familyService.createFamily(req, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Family created successfully", dto));
    }

    @GetMapping({"/current", "/my"})
    public ResponseEntity<ApiResponse<FamilyDTO>> getCurrentFamily(@AuthenticationPrincipal User user) {
        FamilyDTO dto = familyService.getUserFamily(user);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/{familyId}/members")
    public ResponseEntity<ApiResponse<List<FamilyMemberDTO>>> getMembers(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        List<FamilyMemberDTO> members = familyService.getFamilyMembers(familyId, user);
        return ResponseEntity.ok(ApiResponse.success(members));
    }

    @PostMapping("/{familyId}/members")
    public ResponseEntity<ApiResponse<FamilyMemberDTO>> addMember(
            @PathVariable Long familyId,
            @Valid @RequestBody AddMemberRequest req,
            @AuthenticationPrincipal User user) {
        FamilyMemberDTO dto = familyService.addMember(familyId, req, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Member added successfully", dto));
    }

    @PutMapping("/{familyId}/members/{memberId}")
    public ResponseEntity<ApiResponse<FamilyMemberDTO>> updateMember(
            @PathVariable Long familyId,
            @PathVariable Long memberId,
            @RequestBody UpdateMemberRequest req,
            @AuthenticationPrincipal User user) {
        FamilyMemberDTO dto = familyService.updateMember(familyId, memberId, req, user);
        return ResponseEntity.ok(ApiResponse.success("Member updated successfully", dto));
    }

    @DeleteMapping("/{familyId}/members/{memberId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long familyId,
            @PathVariable Long memberId,
            @AuthenticationPrincipal User user) {
        familyService.removeMember(familyId, memberId, user);
        return ResponseEntity.ok(ApiResponse.success("Member removed successfully", null));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<FamilyDTO>> joinFamily(
            @Valid @RequestBody JoinFamilyRequest req,
            @AuthenticationPrincipal User user) {
        FamilyDTO dto = familyService.joinFamily(req, user);
        return ResponseEntity.ok(ApiResponse.success("Joined family successfully", dto));
    }

    @PostMapping("/{familyId}/invite")
    public ResponseEntity<ApiResponse<InvitationDTO>> inviteMember(
            @PathVariable Long familyId,
            @Valid @RequestBody InviteMemberRequest req,
            @AuthenticationPrincipal User user) {
        InvitationDTO dto = familyService.inviteMember(familyId, req, user);
        return ResponseEntity.ok(ApiResponse.success("Invitation sent successfully", dto));
    }

    @GetMapping("/{familyId}/invitations")
    public ResponseEntity<ApiResponse<List<InvitationDTO>>> getInvitations(
            @PathVariable Long familyId,
            @AuthenticationPrincipal User user) {
        List<InvitationDTO> invitations = familyService.getFamilyInvitations(familyId, user);
        return ResponseEntity.ok(ApiResponse.success(invitations));
    }
}
