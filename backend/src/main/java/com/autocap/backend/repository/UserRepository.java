package com.autocap.backend.repository;

import com.autocap.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import com.autocap.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
