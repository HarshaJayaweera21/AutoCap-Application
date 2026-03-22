package com.autocap.backend.dto;

import com.autocap.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class UserDto {

    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private Boolean isActive;
    private Boolean isEmailVerified;

    public static UserDto fromEntity(User user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getDateOfBirth(),
                user.getIsActive(),
                user.getIsEmailVerified());
    }
}
