package com.paperlessfamily;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Application context load test.
 * Verifies the entire Spring Boot context loads without errors.
 */
@SpringBootTest
@ActiveProfiles("test")
class PaperlessFamilyApplicationTests {

    @Test
    void contextLoads() {
        // Verifies the Spring application context loads successfully
    }
}
