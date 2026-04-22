package com.bspq.e2.controller;

import com.bspq.e2.dto.AuthRequest;
import com.bspq.e2.dto.RegisterRequest;
import com.bspq.e2.model.User;
import com.bspq.e2.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            logger.warn("Registration rejected, username already exists: {}", request.getUsername());
            return ResponseEntity.badRequest().body("Username already exists");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.USER);
        userRepository.save(user);
        logger.info("Registered user: {}", user.getUsername());
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        return userRepository.findByUsername(request.getUsername())
                .filter(u -> passwordEncoder.matches(request.getPassword(), u.getPasswordHash()))
                .map(u -> {
                    logger.info("Login successful for user: {}", u.getUsername());
                    return ResponseEntity.ok(Map.of(
                            "message", "Login successful",
                            "username", u.getUsername(),
                            "role", u.getRole() == null ? User.Role.USER.name() : u.getRole().name()
                    ));
                })
                .orElseGet(() -> {
                    logger.warn("Login failed for user: {}", request.getUsername());
                    return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
                });
    }
}