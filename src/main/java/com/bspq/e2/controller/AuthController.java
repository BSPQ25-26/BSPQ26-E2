package com.bspq.e2.controller;

import com.bspq.e2.dto.AuthRequest;
import com.bspq.e2.dto.RegisterRequest;
import com.bspq.e2.model.User;
import com.bspq.e2.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Registration, login and user identity resolution")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a user", description = "Creates a standard MovieTrakk account with an encoded password.")
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
    @Operation(summary = "Log in", description = "Authenticates a user and returns session metadata used by the web client.")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        return userRepository.findByUsername(request.getUsername())
                .filter(u -> passwordEncoder.matches(request.getPassword(), u.getPasswordHash()))
                .map(u -> ResponseEntity.ok(Map.of(
                        "message", "Login successful",
                        "userId", u.getId(),
                        "username", u.getUsername(),
                        "role", u.getRole().name()
                )))
                .orElse(ResponseEntity.status(401).body(Map.of("message", "Invalid credentials")));
    }

    @GetMapping("/resolve-user")
    @Operation(summary = "Resolve user", description = "Returns the user id and role for a known username.")
    public ResponseEntity<?> resolveUser(@RequestParam String username) {
        return userRepository.findByUsername(username)
                .map(u -> ResponseEntity.ok(Map.of(
                        "userId", u.getId(),
                        "username", u.getUsername(),
                        "role", u.getRole().name()
                )))
                .orElse(ResponseEntity.notFound().build());
    }
}
