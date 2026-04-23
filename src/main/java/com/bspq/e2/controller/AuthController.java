package com.bspq.e2.controller;

import com.bspq.e2.dto.AuthRequest;
import com.bspq.e2.dto.RegisterRequest;
import com.bspq.e2.model.User;
import com.bspq.e2.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.USER);
        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        return userRepository.findByUsername(request.getUsername())
                .filter(u -> passwordEncoder.matches(request.getPassword(), u.getPasswordHash()))
            .map(u -> ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "userId", u.getId(),
                "username", u.getUsername(),
                "role", u.getRole() == null ? User.Role.USER.name() : u.getRole().name()
            )))
            .orElseGet(() -> ResponseEntity.status(401).body(Map.of("message", "Invalid credentials")));
        }

        @GetMapping("/resolve-user")
        public ResponseEntity<?> resolveUser(@RequestParam String username) {
        return userRepository.findByUsername(username)
            .map(u -> ResponseEntity.ok(Map.of(
                "userId", u.getId(),
                "username", u.getUsername(),
                "role", u.getRole() == null ? User.Role.USER.name() : u.getRole().name()
            )))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}