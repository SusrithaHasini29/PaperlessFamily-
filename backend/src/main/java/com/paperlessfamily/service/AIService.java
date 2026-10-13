package com.paperlessfamily.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paperlessfamily.dto.ChatMessageDTO;
import com.paperlessfamily.dto.ChatRequest;
import com.paperlessfamily.dto.ChatResponse;
import com.paperlessfamily.dto.ConversationDTO;
import com.paperlessfamily.entity.*;
import com.paperlessfamily.exception.ResourceNotFoundException;
import com.paperlessfamily.exception.UnauthorizedException;
import com.paperlessfamily.repository.ChatMessageRepository;
import com.paperlessfamily.repository.ConversationRepository;
import com.paperlessfamily.repository.DocumentRepository;
import com.paperlessfamily.repository.FamilyMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIService {

    private final DocumentRepository documentRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.ai.api-key:}")
    private String apiKey;

    @Value("${app.ai.model:gemini-2.0-flash}")
    private String model;

    @Transactional
    public ChatResponse chat(ChatRequest req, User user) {
        FamilyMember member = familyMemberRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User does not belong to any family"));

        Family family = member.getFamily();
        List<Document> familyDocuments = documentRepository.findByFamilyId(family.getId());

        Conversation conversation;
        if (req.getConversationId() != null) {
            conversation = conversationRepository.findById(req.getConversationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with ID: " + req.getConversationId()));
            if (!conversation.getUser().getId().equals(user.getId())) {
                throw new UnauthorizedException("Unauthorized access to this conversation");
            }
        } else {
            String title = req.getMessage().length() > 40
                    ? req.getMessage().substring(0, 37) + "..."
                    : req.getMessage();

            conversation = Conversation.builder()
                    .user(user)
                    .family(family)
                    .title(title)
                    .build();
            conversation = conversationRepository.save(conversation);
        }

        ChatMessage userMessage = ChatMessage.builder()
                .conversation(conversation)
                .sender(MessageSender.USER)
                .message(req.getMessage())
                .build();
        chatMessageRepository.save(userMessage);

        String systemInstruction = buildSystemPrompt(family, familyDocuments);
        List<FamilyMember> familyMembers = familyMemberRepository.findByFamilyId(family.getId());

        String aiResponseText;
        if (StringUtils.hasText(apiKey)) {
            try {
                aiResponseText = callGeminiAPI(systemInstruction, conversation.getId(), req.getMessage());
            } catch (Exception e) {
                log.warn("Gemini API call failed, falling back to intelligent assistant: {}", e.getMessage());
                aiResponseText = generateIntelligentMock(req.getMessage(), familyDocuments, family, familyMembers, user);
            }
        } else {
            aiResponseText = generateIntelligentMock(req.getMessage(), familyDocuments, family, familyMembers, user);
        }

        ChatMessage aiMessage = ChatMessage.builder()
                .conversation(conversation)
                .sender(MessageSender.AI)
                .message(aiResponseText)
                .build();
        chatMessageRepository.save(aiMessage);

        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return ChatResponse.builder()
                .response(aiResponseText)
                .conversationId(conversation.getId())
                .timestamp(LocalDateTime.now().toString())
                .build();
    }

    private String buildSystemPrompt(Family family, List<Document> documents) {
        StringBuilder sb = new StringBuilder();
        String rawFamilyName = family.getFamilyName();
        String familyDisplayName = rawFamilyName.toLowerCase().endsWith("family") ? rawFamilyName : rawFamilyName + " Family";
        sb.append("You are FamilyAI, a helpful family document assistant for ").append(familyDisplayName)
                .append(". You help family members find, understand, and manage their documents.\n\n");

        sb.append("Here are the family's documents:\n");
        if (documents.isEmpty()) {
            sb.append("- No documents uploaded yet.\n");
        } else {
            for (Document doc : documents) {
                String ownerName = (doc.getOwner() != null && doc.getOwner().getUser() != null)
                        ? doc.getOwner().getUser().getName()
                        : "Family";
                sb.append("- ")
                        .append(doc.getName())
                        .append(" | Category: ").append(doc.getCategory())
                        .append(" | Owner: ").append(ownerName)
                        .append(" | Expiry: ").append(doc.getExpiryDate() != null ? doc.getExpiryDate().toString() : "None")
                        .append(" | Status: ").append(doc.getStatus())
                        .append(" | Description: ").append(doc.getDescription() != null ? doc.getDescription() : "None");
                if (StringUtils.hasText(doc.getExtractedText())) {
                    String snippet = doc.getExtractedText().length() > 300
                            ? doc.getExtractedText().substring(0, 300)
                            : doc.getExtractedText();
                    sb.append(" | Content Snippet: ").append(snippet.replaceAll("\\s+", " "));
                }
                sb.append("\n");
            }
        }

        sb.append("\nAlways be helpful and friendly. For sensitive documents, include a brief disclaimer that you do not replace professional, legal, or medical advice.");
        return sb.toString();
    }

    private String callGeminiAPI(String systemInstruction, Long conversationId, String newMessage) throws Exception {
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey);

        List<ChatMessage> previousMessages = chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        List<Map<String, Object>> contents = new ArrayList<>();
        for (ChatMessage msg : previousMessages) {
            String role = msg.getSender() == MessageSender.USER ? "user" : "model";
            contents.add(Map.of(
                    "role", role,
                    "parts", List.of(Map.of("text", msg.getMessage()))
            ));
        }

        Map<String, Object> requestBody = Map.of(
                "contents", contents,
                "systemInstruction", Map.of("parts", List.of(Map.of("text", systemInstruction)))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        String response = restTemplate.postForObject(url, entity, String.class);

        JsonNode root = objectMapper.readTree(response);
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && !candidates.isEmpty()) {
            JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
            if (!textNode.isMissingNode()) {
                return textNode.asText();
            }
        }

        throw new RuntimeException("Unexpected Gemini API response structure");
    }

    private String generateIntelligentMock(String query, List<Document> documents, Family family, List<FamilyMember> members, User currentUser) {
        String lowerQuery = query.toLowerCase().trim();
        String rawFamilyName = family.getFamilyName();
        String familyDisplayName = rawFamilyName.toLowerCase().endsWith("family") ? rawFamilyName : rawFamilyName + " Family";

        // 1. GREETINGS & INTRO / HELP
        if (lowerQuery.matches("^(hi|hello|hey|help|who are you|what can you do|greetings|hola|namaste).*") || lowerQuery.equals("hi") || lowerQuery.equals("hello")) {
            StringBuilder sb = new StringBuilder();
            sb.append("Hello **").append(currentUser.getName()).append("**! 👋\n\n");
            sb.append("I am your **FamilyAI** assistant for the **").append(familyDisplayName).append("** vault.\n\n");
            sb.append("📊 **Current Vault Status:**\n");
            sb.append("• **Documents saved:** ").append(documents.size()).append("\n");
            sb.append("• **Family members:** ").append(members.size()).append("\n\n");
            sb.append("💡 **Suggested things to ask me:**\n");
            if (!documents.isEmpty()) {
                Document sampleDoc = documents.get(0);
                sb.append("• \"Summarize ").append(sampleDoc.getName()).append("\"\n");
            } else {
                sb.append("• \"How do I upload a document?\"\n");
            }
            if (!members.isEmpty()) {
                FamilyMember firstMem = members.get(0);
                String memName = firstMem.getUser() != null ? firstMem.getUser().getName() : firstMem.getRelationship();
                sb.append("• \"Show documents for ").append(memName).append("\"\n");
            }
            sb.append("• \"Which documents are expiring soon?\"\n");
            sb.append("• \"Who is in our family vault?\"\n");
            return sb.toString();
        }

        // 2. EXPIRING / RENEWAL QUERIES
        if (lowerQuery.contains("expir") || lowerQuery.contains("valid") || lowerQuery.contains("renew") || lowerQuery.contains("due date") || lowerQuery.contains("deadline")) {
            List<Document> expiring = documents.stream()
                    .filter(d -> "EXPIRING_SOON".equals(d.getStatus()) || "EXPIRED".equals(d.getStatus()))
                    .collect(Collectors.toList());

            if (expiring.isEmpty()) {
                StringBuilder sb = new StringBuilder("✅ **All documents are currently up to date!**\n\n");
                sb.append("No documents in the **").append(familyDisplayName).append("** vault are currently expired or expiring within the next 30 days.\n\n");
                if (!documents.isEmpty()) {
                    sb.append("Active documents:\n");
                    for (Document doc : documents) {
                        String exp = doc.getExpiryDate() != null ? doc.getExpiryDate().toString() : "Permanent / No Expiry";
                        sb.append("• **").append(doc.getName()).append("** (").append(doc.getCategory()).append(") — ").append(exp).append("\n");
                    }
                }
                return sb.toString();
            }

            StringBuilder sb = new StringBuilder("⚠️ **Documents requiring attention for ").append(familyDisplayName).append(":**\n\n");
            for (Document doc : expiring) {
                String owner = doc.getOwner() != null && doc.getOwner().getUser() != null ? doc.getOwner().getUser().getName() : "Family";
                String badge = "EXPIRED".equals(doc.getStatus()) ? "🔴 EXPIRED" : "🟠 EXPIRING SOON";
                sb.append("• **").append(doc.getName()).append("** (").append(doc.getCategory()).append(")\n")
                        .append("  - Owner: ").append(owner).append("\n")
                        .append("  - Expiry Date: ").append(doc.getExpiryDate() != null ? doc.getExpiryDate().toString() : "N/A")
                        .append(" [").append(badge).append("]\n\n");
            }
            sb.append("💡 *Tip: Check the Notifications tab to manage renewal reminders.*");
            return sb.toString();
        }

        // 3. REMINDER QUERIES ("Create Reminder", "Set reminder", "Reminders")
        if (lowerQuery.contains("remind") || lowerQuery.contains("alert") || lowerQuery.contains("notification")) {
            StringBuilder sb = new StringBuilder("⏰ **Automated Expiry Tracking & Reminders**\n\n");
            sb.append("PaperlessFamily continuously monitors all documents in the **").append(familyDisplayName).append("** vault.\n\n");
            sb.append("• **How it works:** When you upload a document with an expiration date (e.g., Passport, Vehicle Insurance, Driving Licence), the system automatically triggers alerts **30 days prior** to expiration.\n");
            sb.append("• **Current Status:** ");
            long expiringCount = documents.stream().filter(d -> "EXPIRING_SOON".equals(d.getStatus()) || "EXPIRED".equals(d.getStatus())).count();
            if (expiringCount > 0) {
                sb.append("You have **").append(expiringCount).append("** document(s) currently marked as expiring soon or expired.\n\n");
            } else {
                sb.append("All current documents are active with no pending expiration deadlines.\n\n");
            }
            if (!documents.isEmpty()) {
                sb.append("Documents monitored:\n");
                for (Document doc : documents) {
                    sb.append("• **").append(doc.getName()).append("** (").append(doc.getCategory()).append("): ")
                            .append(doc.getExpiryDate() != null ? "Expires on " + doc.getExpiryDate() : "Permanent record")
                            .append("\n");
                }
            }
            return sb.toString();
        }

        // 4. WHO IS IN MY FAMILY / SHOW MEMBERS
        if (lowerQuery.contains("who is in") || lowerQuery.contains("family member") || lowerQuery.contains("members") || lowerQuery.contains("household") || lowerQuery.equals("my family")) {
            StringBuilder sb = new StringBuilder("👨‍👩‍👧‍👦 **Members of ").append(familyDisplayName).append(":**\n\n");
            for (FamilyMember m : members) {
                String mName = m.getUser() != null ? m.getUser().getName() : "Unknown";
                String mEmail = m.getUser() != null ? m.getUser().getEmail() : "";
                long docCount = documents.stream().filter(d -> d.getOwner() != null && d.getOwner().getId().equals(m.getId())).count();
                sb.append("• **").append(mName).append("** — *").append(m.getRelationship()).append("* (").append(m.getRole()).append(")\n")
                        .append("  Email: ").append(mEmail).append(" | Documents: ").append(docCount).append("\n\n");
            }
            sb.append("🔑 **Family Invite Code:** `").append(family.getFamilyCode()).append("`\n");
            sb.append("*(Share this code with other family members so they can click 'Join Family' to join your space!)*");
            return sb.toString();
        }

        // 5. RELATIONSHIP SPECIFIC QUERY ("Mom's documents", "Dad's documents", "Sister", "Brother", "Son", "Daughter")
        Map<String, String> relationKeywords = Map.of(
                "mother", "Mother",
                "mom", "Mother",
                "mummy", "Mother",
                "maa", "Mother",
                "father", "Father",
                "dad", "Father",
                "papa", "Father",
                "daddy", "Father",
                "brother", "Brother",
                "sister", "Sister"
        );

        String requestedRelation = null;
        for (Map.Entry<String, String> entry : relationKeywords.entrySet()) {
            if (lowerQuery.contains(entry.getKey())) {
                requestedRelation = entry.getValue();
                break;
            }
        }
        if (requestedRelation == null) {
            if (lowerQuery.contains("son") || lowerQuery.contains("boy")) requestedRelation = "Son";
            else if (lowerQuery.contains("daughter") || lowerQuery.contains("girl")) requestedRelation = "Daughter";
            else if (lowerQuery.contains("husband")) requestedRelation = "Husband";
            else if (lowerQuery.contains("wife") || lowerQuery.contains("spouse")) requestedRelation = "Wife";
        }

        if (requestedRelation != null) {
            final String targetRel = requestedRelation;
            Optional<FamilyMember> relMember = members.stream()
                    .filter(m -> m.getRelationship() != null && m.getRelationship().equalsIgnoreCase(targetRel))
                    .findFirst();

            if (relMember.isPresent()) {
                FamilyMember m = relMember.get();
                String mName = m.getUser() != null ? m.getUser().getName() : targetRel;
                List<Document> memDocs = documents.stream()
                        .filter(d -> d.getOwner() != null && d.getOwner().getId().equals(m.getId()))
                        .collect(Collectors.toList());

                if (memDocs.isEmpty()) {
                    return "ℹ️ **" + mName + "** (*" + targetRel + "*) is registered in your family space, but does not have any documents assigned yet.\n\n" +
                            "You can upload documents for " + mName + " anytime from the **Documents** tab by selecting them as the owner in the upload form!";
                }

                StringBuilder sb = new StringBuilder("📁 **Documents for " + mName + " (" + targetRel + "):**\n\n");
                for (Document doc : memDocs) {
                    sb.append("• **").append(doc.getName()).append("** (").append(doc.getCategory()).append(")\n")
                            .append("  - Status: ").append(doc.getStatus()).append("\n")
                            .append("  - Expiry: ").append(doc.getExpiryDate() != null ? doc.getExpiryDate().toString() : "None").append("\n\n");
                }
                return sb.toString();
            } else {
                StringBuilder sb = new StringBuilder("ℹ️ I checked your family vault, but there is no member registered as **" + targetRel + "** in " + familyDisplayName + " yet.\n\n");
                sb.append("Currently registered members:\n");
                for (FamilyMember m : members) {
                    String mName = m.getUser() != null ? m.getUser().getName() : "Member";
                    sb.append("• **").append(mName).append("** (*").append(m.getRelationship()).append("*)\n");
                }
                sb.append("\nYou can add or invite new members using your Family Code `").append(family.getFamilyCode()).append("` from the **Family** tab!");
                return sb.toString();
            }
        }

        // 6. SPECIFIC MEMBER BY NAME
        for (FamilyMember m : members) {
            if (m.getUser() != null && StringUtils.hasText(m.getUser().getName())) {
                String memberName = m.getUser().getName().toLowerCase();
                String firstName = memberName.split(" ")[0];
                if (lowerQuery.contains(memberName) || (firstName.length() > 2 && lowerQuery.contains(firstName))) {
                    String matchedName = m.getUser().getName();
                    List<Document> memberDocs = documents.stream()
                            .filter(d -> d.getOwner() != null && d.getOwner().getId().equals(m.getId()))
                            .collect(Collectors.toList());

                    if (memberDocs.isEmpty()) {
                        return "📁 **" + matchedName + "** (*" + m.getRelationship() + "*) has no documents uploaded in your vault yet. You can upload one from the Documents tab!";
                    }

                    StringBuilder sb = new StringBuilder("📁 **Documents for " + matchedName + " (" + m.getRelationship() + "):**\n\n");
                    for (Document mDoc : memberDocs) {
                        sb.append("• **").append(mDoc.getName()).append("** (").append(mDoc.getCategory()).append(")");
                        if (mDoc.getExpiryDate() != null) {
                            sb.append(" — Expires: ").append(mDoc.getExpiryDate());
                        }
                        sb.append("\n");
                    }
                    return sb.toString();
                }
            }
        }

        // 7. SUMMARIZE / EXPLAIN / READ DOCUMENT
        if (lowerQuery.contains("summariz") || lowerQuery.contains("summary") || lowerQuery.contains("explain") || lowerQuery.contains("what is") || lowerQuery.contains("read") || lowerQuery.contains("about")) {
            if (documents.isEmpty()) {
                return "Your family vault does not contain any documents yet. Please upload a PDF or image first!";
            }

            // Check if query targets a specific document
            Document targetDoc = null;
            for (Document d : documents) {
                String dName = d.getName().toLowerCase();
                if (lowerQuery.contains(dName) || (d.getSubcategory() != null && lowerQuery.contains(d.getSubcategory().toLowerCase())) || lowerQuery.contains(d.getCategory().toLowerCase())) {
                    targetDoc = d;
                    break;
                }
                for (String word : dName.split("[\\s\\[\\]\\-_.]+")) {
                    if (word.length() > 3 && lowerQuery.contains(word)) {
                        targetDoc = d;
                        break;
                    }
                }
                if (targetDoc != null) break;
            }

            // If no specific document matched, default to the latest document
            if (targetDoc == null) {
                targetDoc = documents.get(0);
            }

            StringBuilder sb = new StringBuilder();
            sb.append("📄 **Summary of ").append(targetDoc.getName()).append("**:\n\n");
            sb.append("• **Category:** ").append(targetDoc.getCategory());
            if (StringUtils.hasText(targetDoc.getSubcategory())) {
                sb.append(" (").append(targetDoc.getSubcategory()).append(")");
            }
            sb.append("\n");
            String owner = targetDoc.getOwner() != null && targetDoc.getOwner().getUser() != null ? targetDoc.getOwner().getUser().getName() : "Family";
            sb.append("• **Owner:** ").append(owner).append("\n");
            sb.append("• **Status:** ").append(targetDoc.getStatus()).append("\n");
            if (targetDoc.getIssueDate() != null) {
                sb.append("• **Issue Date:** ").append(targetDoc.getIssueDate()).append("\n");
            }
            if (targetDoc.getExpiryDate() != null) {
                sb.append("• **Expiry Date:** ").append(targetDoc.getExpiryDate()).append("\n");
            }

            if (StringUtils.hasText(targetDoc.getExtractedText())) {
                String cleanText = targetDoc.getExtractedText()
                        .replaceAll("\\r", "")
                        .replaceAll("\\n{3,}", "\n\n")
                        .trim();

                sb.append("\n📋 **Extracted Document Content:**\n");
                String preview = cleanText.length() > 600 ? cleanText.substring(0, 600) + "..." : cleanText;
                sb.append("```\n").append(preview).append("\n```\n\n");
                sb.append("💡 *You can preview or download the full original file anytime from the Documents tab.*");
            } else {
                sb.append("• **Description:** ").append(StringUtils.hasText(targetDoc.getDescription()) ? targetDoc.getDescription() : "Standard record").append("\n\n");
                sb.append("💡 *Note: Original file is safely stored. Click 'View' in Documents to inspect the document viewer.*");
            }
            return sb.toString();
        }

        // 8. LIST DOCUMENTS / FIND / SEARCH / CATEGORY
        if (lowerQuery.contains("what document") || lowerQuery.contains("list") || lowerQuery.contains("show all") || lowerQuery.contains("find") || lowerQuery.contains("search") || lowerQuery.contains("vault") || lowerQuery.equals("documents")) {
            if (documents.isEmpty()) {
                return "Your family vault currently has **0** documents. Click **Upload Document** on the Documents page to add your first record!";
            }

            StringBuilder sb = new StringBuilder("📁 **Documents in ").append(familyDisplayName).append(" (Total: ").append(documents.size()).append("):**\n\n");
            for (Document doc : documents) {
                String owner = doc.getOwner() != null && doc.getOwner().getUser() != null ? doc.getOwner().getUser().getName() : "Family";
                String exp = doc.getExpiryDate() != null ? "Expires: " + doc.getExpiryDate() : "Active";
                sb.append("• **").append(doc.getName()).append("** [").append(doc.getCategory()).append("]\n")
                        .append("  Owner: ").append(owner).append(" | ").append(exp).append("\n\n");
            }
            sb.append("You can ask me to **summarize** any document by name!");
            return sb.toString();
        }

        // 9. CATEGORY-SPECIFIC SEARCH
        for (String cat : List.of("Identity", "Education", "Medical", "Finance", "Insurance", "Property", "Vehicle", "Bills")) {
            if (lowerQuery.contains(cat.toLowerCase())) {
                List<Document> catDocs = documents.stream()
                        .filter(d -> d.getCategory() != null && d.getCategory().equalsIgnoreCase(cat))
                        .collect(Collectors.toList());

                if (catDocs.isEmpty()) {
                    return "ℹ️ No documents under category **" + cat + "** found in " + familyDisplayName + " yet. You can upload one under " + cat + " anytime!";
                }

                StringBuilder sb = new StringBuilder("📂 **" + cat + " Documents (" + catDocs.size() + "):**\n\n");
                for (Document doc : catDocs) {
                    sb.append("• **").append(doc.getName()).append("** — Status: ").append(doc.getStatus()).append("\n");
                }
                return sb.toString();
            }
        }

        // 10. DEFAULT DYNAMIC CONTEXTUAL RESPONSE
        StringBuilder sb = new StringBuilder();
        sb.append("I am your **FamilyAI** assistant for the **").append(familyDisplayName).append("** space.\n\n");
        sb.append("You currently have **").append(documents.size()).append("** document(s) and **").append(members.size()).append("** member(s) in your vault.\n\n");
        if (!documents.isEmpty()) {
            sb.append("Saved documents:\n");
            for (Document doc : documents.stream().limit(5).collect(Collectors.toList())) {
                sb.append("• **").append(doc.getName()).append("** (").append(doc.getCategory()).append(")\n");
            }
        }
        sb.append("\n💡 **You can ask me:**\n");
        if (!documents.isEmpty()) {
            sb.append("• \"Summarize ").append(documents.get(0).getName()).append("\"\n");
        }
        if (!members.isEmpty()) {
            String mName = members.get(0).getUser() != null ? members.get(0).getUser().getName() : members.get(0).getRelationship();
            sb.append("• \"Show documents for ").append(mName).append("\"\n");
        }
        sb.append("• \"Which documents are expiring soon?\"\n");
        sb.append("• \"Who is in our family vault?\"\n");
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public List<ConversationDTO> getConversations(User user) {
        FamilyMember member = familyMemberRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User does not belong to any family"));

        List<Conversation> conversations = conversationRepository.findByUserIdAndFamilyIdOrderByUpdatedAtDesc(
                user.getId(),
                member.getFamily().getId()
        );

        return conversations.stream().map(c -> {
            List<ChatMessage> msgs = chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(c.getId());
            String lastMsg = msgs.isEmpty() ? "" : msgs.get(msgs.size() - 1).getMessage();
            return ConversationDTO.builder()
                    .id(c.getId())
                    .title(c.getTitle())
                    .createdAt(c.getCreatedAt() != null ? c.getCreatedAt().toString() : null)
                    .lastMessage(lastMsg)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getConversationMessages(Long conversationId, User user) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with ID: " + conversationId));

        if (!conversation.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You are not authorized to view messages from this conversation");
        }

        return chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(m -> ChatMessageDTO.builder()
                        .id(m.getId())
                        .sender(m.getSender() != null ? m.getSender().name() : "USER")
                        .message(m.getMessage())
                        .createdAt(m.getCreatedAt() != null ? m.getCreatedAt().toString() : null)
                        .build()
                )
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteConversation(Long conversationId, User user) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with ID: " + conversationId));

        if (!conversation.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You are not authorized to delete this conversation");
        }

        conversationRepository.delete(conversation);
        log.info("Deleted conversation ID {} by user {}", conversationId, user.getEmail());
    }
}
