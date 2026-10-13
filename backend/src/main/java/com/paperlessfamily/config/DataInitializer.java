package com.paperlessfamily.config;

import com.paperlessfamily.entity.*;
import com.paperlessfamily.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final DocumentRepository documentRepository;
    private final NotificationRepository notificationRepository;
    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.findByEmail("demo@paperlessfamily.com").isPresent()) {
            log.info("Demo user already exists. Skipping data initialization.");
            return;
        }

        log.info("Initializing demo seed data for PaperlessFamily...");

        // 1. Create demo user
        User raj = User.builder()
                .name("Raj Sharma")
                .email("demo@paperlessfamily.com")
                .password(passwordEncoder.encode("Demo@123"))
                .build();
        raj = userRepository.save(raj);

        // 2. Create family users
        User priya = User.builder()
                .name("Priya Sharma")
                .email("priya@sharma.com")
                .password(passwordEncoder.encode("Priya@123"))
                .build();
        priya = userRepository.save(priya);

        User aarav = User.builder()
                .name("Aarav Sharma")
                .email("aarav@sharma.com")
                .password(passwordEncoder.encode("Aarav@123"))
                .build();
        aarav = userRepository.save(aarav);

        User ananya = User.builder()
                .name("Ananya Sharma")
                .email("ananya@sharma.com")
                .password(passwordEncoder.encode("Ananya@123"))
                .build();
        ananya = userRepository.save(ananya);

        // 3. Create family
        Family sharmaFamily = Family.builder()
                .familyName("Sharma Family")
                .familyCode("FAM-SHARM")
                .createdBy(raj)
                .build();
        sharmaFamily = familyRepository.save(sharmaFamily);

        // 4. Create family members
        FamilyMember rajMember = FamilyMember.builder()
                .user(raj)
                .family(sharmaFamily)
                .relationship("Father")
                .role(Role.ADMIN)
                .build();
        rajMember = familyMemberRepository.save(rajMember);

        FamilyMember priyaMember = FamilyMember.builder()
                .user(priya)
                .family(sharmaFamily)
                .relationship("Mother")
                .role(Role.MEMBER)
                .build();
        priyaMember = familyMemberRepository.save(priyaMember);

        FamilyMember aaravMember = FamilyMember.builder()
                .user(aarav)
                .family(sharmaFamily)
                .relationship("Son")
                .role(Role.MEMBER)
                .build();
        aaravMember = familyMemberRepository.save(aaravMember);

        FamilyMember ananyaMember = FamilyMember.builder()
                .user(ananya)
                .family(sharmaFamily)
                .relationship("Daughter")
                .role(Role.MEMBER)
                .build();
        ananyaMember = familyMemberRepository.save(ananyaMember);

        // 5. Create sample documents
        LocalDate today = LocalDate.now();

        // Raj's docs
        documentRepository.save(Document.builder()
                .name("Driving Licence")
                .category("Identity")
                .subcategory("Driver License")
                .owner(rajMember)
                .family(sharmaFamily)
                .fileName("raj_driving_licence.pdf")
                .filePath("demo/raj_driving_licence.pdf")
                .fileType("application/pdf")
                .fileSize(1024500L)
                .issueDate(LocalDate.of(2017, 3, 15))
                .expiryDate(LocalDate.of(2027, 3, 15))
                .description("Permanent 4-wheeler and 2-wheeler driving licence")
                .extractedText("Government of India Driving Licence Name: Raj Sharma Blood Group: O+ Valid Till: 2027-03-15")
                .uploadedBy(raj)
                .build());

        documentRepository.save(Document.builder()
                .name("Vehicle Insurance")
                .category("Insurance")
                .subcategory("Comprehensive Motor")
                .owner(rajMember)
                .family(sharmaFamily)
                .fileName("vehicle_insurance_policy.pdf")
                .filePath("demo/vehicle_insurance_policy.pdf")
                .fileType("application/pdf")
                .fileSize(2048000L)
                .issueDate(today.minusYears(1).plusDays(25))
                .expiryDate(today.plusDays(25))
                .description("Comprehensive car insurance policy covering Honda City")
                .extractedText("Motor Insurance Certificate Policyholder: Raj Sharma Vehicle: Honda City Policy Expiring in 25 days")
                .uploadedBy(raj)
                .build());

        documentRepository.save(Document.builder()
                .name("PAN Card")
                .category("Identity")
                .subcategory("Tax ID")
                .owner(rajMember)
                .family(sharmaFamily)
                .fileName("raj_pan_card.pdf")
                .filePath("demo/raj_pan_card.pdf")
                .fileType("application/pdf")
                .fileSize(512000L)
                .issueDate(LocalDate.of(2012, 1, 10))
                .expiryDate(null)
                .description("Income Tax Department Permanent Account Number card")
                .extractedText("Income Tax Department Govt of India Permanent Account Number Card Name: Raj Sharma")
                .uploadedBy(raj)
                .build());

        // Priya's docs
        documentRepository.save(Document.builder()
                .name("Passport")
                .category("Identity")
                .subcategory("International Travel")
                .owner(priyaMember)
                .family(sharmaFamily)
                .fileName("priya_passport.pdf")
                .filePath("demo/priya_passport.pdf")
                .fileType("application/pdf")
                .fileSize(1840000L)
                .issueDate(today.minusYears(10).plusDays(18))
                .expiryDate(today.plusDays(18))
                .description("Republic of India 36-page passport booklet")
                .extractedText("Republic of India Passport Type: P Given Name: Priya Surname: Sharma Expiring in 18 days")
                .uploadedBy(raj)
                .build());

        documentRepository.save(Document.builder()
                .name("Aadhaar")
                .category("Identity")
                .subcategory("National ID")
                .owner(priyaMember)
                .family(sharmaFamily)
                .fileName("priya_aadhaar.pdf")
                .filePath("demo/priya_aadhaar.pdf")
                .fileType("application/pdf")
                .fileSize(720000L)
                .issueDate(LocalDate.of(2015, 8, 20))
                .expiryDate(null)
                .description("UIDAI standard Aadhaar card document")
                .extractedText("Unique Identification Authority of India Name: Priya Sharma Mera Aadhaar Meri Pehchan")
                .uploadedBy(raj)
                .build());

        documentRepository.save(Document.builder()
                .name("Health Insurance")
                .category("Insurance")
                .subcategory("Family Floater")
                .owner(priyaMember)
                .family(sharmaFamily)
                .fileName("family_health_insurance.pdf")
                .filePath("demo/family_health_insurance.pdf")
                .fileType("application/pdf")
                .fileSize(2450000L)
                .issueDate(LocalDate.of(2024, 7, 1))
                .expiryDate(LocalDate.of(2027, 6, 30))
                .description("Star Health family floater policy covering up to 15 Lakhs")
                .extractedText("Health Insurance Policy Document Insured: Priya Sharma and Family Sum Insured: 15,000,000 INR")
                .uploadedBy(raj)
                .build());

        // Aarav's docs
        documentRepository.save(Document.builder()
                .name("College ID")
                .category("Education")
                .subcategory("Student ID")
                .owner(aaravMember)
                .family(sharmaFamily)
                .fileName("aarav_college_id.pdf")
                .filePath("demo/aarav_college_id.pdf")
                .fileType("application/pdf")
                .fileSize(340000L)
                .issueDate(LocalDate.of(2023, 8, 1))
                .expiryDate(LocalDate.of(2027, 7, 31))
                .description("Engineering undergraduate student identity badge")
                .extractedText("Institute of Technology Student ID Card Name: Aarav Sharma Department: Computer Science")
                .uploadedBy(aarav)
                .build());

        documentRepository.save(Document.builder()
                .name("10th Marksheet")
                .category("Education")
                .subcategory("Secondary School")
                .owner(aaravMember)
                .family(sharmaFamily)
                .fileName("aarav_10th_marksheet.pdf")
                .filePath("demo/aarav_10th_marksheet.pdf")
                .fileType("application/pdf")
                .fileSize(890000L)
                .issueDate(LocalDate.of(2021, 5, 25))
                .expiryDate(null)
                .description("CBSE class 10 consolidated marks statement and passing certificate")
                .extractedText("Central Board of Secondary Education Secondary School Examination Name: Aarav Sharma")
                .uploadedBy(raj)
                .build());

        // Ananya's docs
        documentRepository.save(Document.builder()
                .name("Birth Certificate")
                .category("Identity")
                .subcategory("Vital Record")
                .owner(ananyaMember)
                .family(sharmaFamily)
                .fileName("ananya_birth_certificate.pdf")
                .filePath("demo/ananya_birth_certificate.pdf")
                .fileType("application/pdf")
                .fileSize(630000L)
                .issueDate(LocalDate.of(2014, 11, 12))
                .expiryDate(null)
                .description("Municipal corporation official certified birth record")
                .extractedText("Municipal Corporation Certificate of Birth Registration Child Name: Ananya Sharma")
                .uploadedBy(raj)
                .build());

        documentRepository.save(Document.builder()
                .name("School Certificate")
                .category("Education")
                .subcategory("School Enrollment")
                .owner(ananyaMember)
                .family(sharmaFamily)
                .fileName("ananya_school_bonafide.pdf")
                .filePath("demo/ananya_school_bonafide.pdf")
                .fileType("application/pdf")
                .fileSize(410000L)
                .issueDate(LocalDate.of(2024, 4, 5))
                .expiryDate(null)
                .description("Bonafide student enrollment certificate from Delhi Public School")
                .extractedText("Delhi Public School Bonafide Certificate Student: Ananya Sharma Class: 6")
                .uploadedBy(raj)
                .build());

        // 6. Create notifications
        notificationRepository.save(Notification.builder()
                .user(raj)
                .family(sharmaFamily)
                .title("Priya's passport expires soon")
                .message("Priya's Passport will expire in 18 days. Please schedule a passport renewal appointment.")
                .type("EXPIRY")
                .read(false)
                .build());

        notificationRepository.save(Notification.builder()
                .user(raj)
                .family(sharmaFamily)
                .title("Raj's vehicle insurance expires soon")
                .message("Your Vehicle Insurance policy expires in 25 days. Please review and renew your policy.")
                .type("EXPIRY")
                .read(false)
                .build());

        notificationRepository.save(Notification.builder()
                .user(raj)
                .family(sharmaFamily)
                .title("New document uploaded by Aarav")
                .message("Aarav Sharma uploaded 'College ID' under Education category.")
                .type("UPLOAD")
                .read(false)
                .build());

        notificationRepository.save(Notification.builder()
                .user(raj)
                .family(sharmaFamily)
                .title("Welcome to PaperlessFamily!")
                .message("Your digital family document vault is ready. All family documents are securely encrypted.")
                .type("SYSTEM")
                .read(false)
                .build());

        // 7. Create sample conversation with messages
        Conversation conversation = Conversation.builder()
                .user(raj)
                .family(sharmaFamily)
                .title("Which documents are expiring soon?")
                .build();
        conversation = conversationRepository.save(conversation);

        chatMessageRepository.save(ChatMessage.builder()
                .conversation(conversation)
                .sender(MessageSender.USER)
                .message("Which documents are expiring soon?")
                .build());

        chatMessageRepository.save(ChatMessage.builder()
                .conversation(conversation)
                .sender(MessageSender.AI)
                .message("You have 2 documents expiring soon:\n1. Priya's Passport - expires in 18 days.\n2. Raj's Vehicle Insurance - expires in 25 days.")
                .build());

        log.info("Demo seed data initialization complete for PaperlessFamily!");
    }
}
