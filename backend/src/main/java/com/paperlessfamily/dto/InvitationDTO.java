package com.paperlessfamily.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationDTO {

    private Long id;
    private String email;
    private String relationship;
    private String status;
    private String familyName;
    private String invitedBy;
    private String createdAt;
}
