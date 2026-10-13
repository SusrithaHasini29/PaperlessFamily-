package com.paperlessfamily.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * General application configuration beans.
 */
@Configuration
public class AppConfig {

    /**
     * RestTemplate bean used by AIService to call the Gemini API.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
