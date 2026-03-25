package com.autocap.backend.repository;

import com.autocap.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    long countByRole_NameNot(String roleName);

    long countByIsActiveTrueAndRole_NameNot(String roleName);

    long countByIsActiveFalseAndRole_NameNot(String roleName);

    Page<User> findByRole_Name(String roleName, Pageable pageable);
}
