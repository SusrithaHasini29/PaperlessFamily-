package com.paperlessfamily.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDTO {

    private Long id;
    private String name;
    private String email;
    private String profileImage;
    private String relationship;
    private String role;
    private String familyName;
    private String familyCode;
    private String joinedAt;
}
