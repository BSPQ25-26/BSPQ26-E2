package com.bspq.e2.controller;

import com.bspq.e2.dto.AuthRequest;
import com.bspq.e2.dto.RegisterRequest;
import com.bspq.e2.model.User;
import com.bspq.e2.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @Test
    void register_whenUsernameExists_returnsBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("alice");
        request.setEmail("alice@example.com");
        request.setPassword("secret");

        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(new User()));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$").value("Username already exists"));
    }

    @Test
    void register_whenValid_savesUserWithEncodedPassword() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("alice");
        request.setEmail("alice@example.com");
        request.setPassword("secret");

        when(userRepository.findByUsername("alice")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret")).thenReturn("encoded-secret");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("User registered successfully"));

        verify(userRepository).save(any(User.class));
    }

    @Test
    void login_whenCredentialsAreValid_returnsMessageAndRole() throws Exception {
        User user = new User();
        user.setId(7L);
        user.setUsername("admin");
        user.setPasswordHash("hash");
        user.setRole(User.Role.ADMIN);

        AuthRequest request = new AuthRequest();
        request.setUsername("admin");
        request.setPassword("secret");

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "hash")).thenReturn(true);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.userId").value(7))
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void login_whenCredentialsAreInvalid_returnsUnauthorized() throws Exception {
        User user = new User();
        user.setUsername("admin");
        user.setPasswordHash("hash");
        user.setRole(User.Role.ADMIN);

        AuthRequest request = new AuthRequest();
        request.setUsername("admin");
        request.setPassword("wrong");

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    void resolveUser_whenUserExists_returnsUserInfo() throws Exception {
        User user = new User();
        user.setId(5L);
        user.setUsername("miren");
        user.setRole(User.Role.USER);

        when(userRepository.findByUsername("miren")).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/auth/resolve-user").param("username", "miren"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(5))
                .andExpect(jsonPath("$.username").value("miren"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void resolveUser_whenUserDoesNotExist_returnsNotFound() throws Exception {
        when(userRepository.findByUsername("missing")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/auth/resolve-user").param("username", "missing"))
                .andExpect(status().isNotFound());
    }
}
