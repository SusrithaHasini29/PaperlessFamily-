package com.paperlessfamily.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDTO {

    private Long id;
    private String name;
    private String category;
    private String subcategory;
    private String ownerName;
    private Long ownerId;
    private Long familyId;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String issueDate;
    private String expiryDate;
    private String description;
    private String status;
    private String uploadedAt;
    private String uploadedBy;
}
