package com.paperlessfamily.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadRequest {

    @NotBlank(message = "Document name is required")
    private String name;

    @NotBlank(message = "Category is required")
    private String category;

    private String subcategory;
    private Long ownerId;
    private String issueDate;
    private String expiryDate;
    private String description;
}
