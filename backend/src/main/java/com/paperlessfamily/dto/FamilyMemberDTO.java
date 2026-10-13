package com.paperlessfamily.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyMemberDTO {

    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String relationship;
    private String role;
    private long documentCount;
    private String joinedAt;
}
