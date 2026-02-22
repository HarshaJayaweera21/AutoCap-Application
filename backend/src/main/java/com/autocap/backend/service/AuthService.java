package com.autocap.backend.service;

import com.autocap.backend.dto.LoginRequest;
import com.autocap.backend.dto.RegisterRequest;
import com.autocap.backend.entity.Role;
import com.autocap.backend.entity.User;
import com.autocap.backend.repository.RoleRepository;
import com.autocap.backend.repository.UserRepository;
import com.autocap.backend.entity.EmailVerificationToken;
import com.autocap.backend.repository.EmailVerificationTokenRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationTokenRepository emailTokenRepository;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       EmailVerificationTokenRepository emailTokenRepository,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailTokenRepository = emailTokenRepository;
        this.jwtService = jwtService;
    }

    public String register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            return "Email already exists";
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            return "Username already exists";
        }

        Role role = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("Default role not found"));

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setIsActive(true);
        user.setIsEmailVerified(false);
        user.setCreatedAt(OffsetDateTime.now().toInstant());
        user.setUpdatedAt(OffsetDateTime.now().toInstant());

        userRepository.save(user);

        // Generate verification token
        String tokenValue = UUID.randomUUID().toString();

        EmailVerificationToken token = new EmailVerificationToken();
        token.setUser(user);
        token.setToken(tokenValue);
        token.setCreatedAt(Instant.now());
        token.setExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));
        token.setVerified(false);

        emailTokenRepository.save(token);

        return "User registered successfully. Verify using token: " + tokenValue;
    }

    public String verifyEmail(String tokenValue) {

        EmailVerificationToken token = emailTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (token.getVerified()) {
            return "Email already verified";
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            return "Token expired";
        }

        User user = token.getUser();
        user.setIsEmailVerified(true);
        user.setUpdatedAt(Instant.now());

        token.setVerified(true);

        userRepository.save(user);
        emailTokenRepository.save(token);

        return "Email verified successfully";
    }

    public String login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!user.getIsActive()) {
            return "Account is inactive";
        }

        if (!user.getIsEmailVerified()) {
            return "Email not verified";
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return "Invalid email or password";
        }

        return jwtService.generateToken(user.getEmail());
    }
}
