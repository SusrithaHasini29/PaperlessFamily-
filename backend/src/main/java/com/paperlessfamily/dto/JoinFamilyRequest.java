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
public class JoinFamilyRequest {

    @NotBlank(message = "Family code is required")
    private String familyCode;

    private String relationship;
}

