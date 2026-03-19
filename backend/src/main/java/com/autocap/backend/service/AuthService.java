package com.autocap.backend.service;

import com.autocap.backend.dto.AuthResponse;
import com.autocap.backend.dto.ForgotPasswordRequest;
import com.autocap.backend.dto.LoginRequest;
import com.autocap.backend.dto.RegisterRequest;
import com.autocap.backend.dto.ResetPasswordRequest;
import com.autocap.backend.entity.Role;
import com.autocap.backend.entity.User;
import com.autocap.backend.entity.PasswordResetToken;
import com.autocap.backend.repository.RoleRepository;
import com.autocap.backend.repository.UserRepository;
import com.autocap.backend.entity.EmailVerificationToken;
import com.autocap.backend.repository.EmailVerificationTokenRepository;
import com.autocap.backend.repository.PasswordResetTokenRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthService(UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            EmailVerificationTokenRepository emailTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            JwtService jwtService,
            TokenBlacklistService tokenBlacklistService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailTokenRepository = emailTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.jwtService = jwtService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    private static final String PASSWORD_REGEX =
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$";

    @Transactional
    public ResponseEntity<String> register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already taken");
        }

        if (request.getPassword() == null || !request.getPassword().matches(PASSWORD_REGEX)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password does not meet requirements");
        }

        Role role = roleRepository.findByName("USER")
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Default role not found"));

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

        return ResponseEntity.status(HttpStatus.CREATED)
                .body("User registered successfully. Verify using token: " + tokenValue);
    }

    @Transactional
    public ResponseEntity<String> verifyEmail(String tokenValue) {

        EmailVerificationToken token = emailTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token"));

        if (token.getVerified()) {
            return ResponseEntity.status(HttpStatus.OK).body("Email already verified");
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token expired");
        }

        User user = token.getUser();
        user.setIsEmailVerified(true);
        user.setUpdatedAt(Instant.now());

        token.setVerified(true);

        userRepository.save(user);
        emailTokenRepository.save(token);

        return ResponseEntity.status(HttpStatus.OK).body("Email verified successfully");
    }

    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!user.getIsActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is deactivated. Contact admin");
        }

        if (!user.getIsEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Please verify your email before logging in");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String token = jwtService.generateToken(user.getEmail());

        return new AuthResponse(
                token,
                user.getRole().getName());
    }

    public ResponseEntity<String> logout(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Authorization header");
        }

        String token = authHeader.substring(7);
        tokenBlacklistService.blacklist(token);

        return ResponseEntity.ok("Logged out successfully");
    }

    @Transactional
    public ResponseEntity<String> forgotPassword(ForgotPasswordRequest request) {

        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Email not found");
        }

        // Generate password reset token
        String tokenValue = UUID.randomUUID().toString();

        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken(tokenValue);
        token.setCreatedAt(Instant.now());
        token.setExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));
        token.setUsed(false);

        passwordResetTokenRepository.save(token);

        return ResponseEntity.ok("Password reset token generated. Reset using token: " + tokenValue);
    }

    @Transactional
    public ResponseEntity<String> resetPassword(ResetPasswordRequest request) {

        PasswordResetToken token = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token"));

        if (token.getUsed()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token has already been used");
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token has expired");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(Instant.now());

        token.setUsed(true);

        userRepository.save(user);
        passwordResetTokenRepository.save(token);

        return ResponseEntity.ok("Password reset successfully");
    }

    @Transactional(readOnly = true)
    public boolean checkEmailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional(readOnly = true)
    public boolean checkUsernameExists(String username) {
        return userRepository.existsByUsername(username);
    }
}
