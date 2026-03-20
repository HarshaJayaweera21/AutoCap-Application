package com.autocap.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AdminStatsResponse {

    private String adminFirstName;
    private String adminLastName;
    private long totalUsers;
    private long activeUsers;
    private long deactiveUsers;

}
