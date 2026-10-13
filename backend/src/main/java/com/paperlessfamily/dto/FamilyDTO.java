package com.paperlessfamily.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyDTO {

    private Long id;
    private String familyName;
    private String familyCode;
    private String createdAt;
    private long memberCount;
}
