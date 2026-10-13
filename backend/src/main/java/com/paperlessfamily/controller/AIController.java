package com.paperlessfamily.controller;

import com.paperlessfamily.dto.ApiResponse;
import com.paperlessfamily.dto.ChatMessageDTO;
import com.paperlessfamily.dto.ChatRequest;
import com.paperlessfamily.dto.ChatResponse;
import com.paperlessfamily.dto.ConversationDTO;
import com.paperlessfamily.entity.User;
import com.paperlessfamily.service.AIService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @Valid @RequestBody ChatRequest req,
            @AuthenticationPrincipal User user) {
        ChatResponse response = aiService.chat(req, user);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationDTO>>> getConversations(
            @AuthenticationPrincipal User user) {
        List<ConversationDTO> conversations = aiService.getConversations(user);
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageDTO>>> getConversationMessages(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        List<ChatMessageDTO> messages = aiService.getConversationMessages(id, user);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        aiService.deleteConversation(id, user);
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted successfully", null));
    }
}
