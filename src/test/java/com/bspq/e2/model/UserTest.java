package com.bspq.e2.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UserTest {

    @Test
    void userFields_areStoredCorrectly() {
        User u = new User();
        u.setId(1L);
        u.setUsername("alice");
        u.setEmail("alice@example.com");
        u.setPasswordHash("hash123");
        u.setRole(User.Role.USER);

        assertThat(u.getId()).isEqualTo(1L);
        assertThat(u.getUsername()).isEqualTo("alice");
        assertThat(u.getEmail()).isEqualTo("alice@example.com");
        assertThat(u.getPasswordHash()).isEqualTo("hash123");
        assertThat(u.getRole()).isEqualTo(User.Role.USER);
    }

    @Test
    void userRole_adminIsDistinctFromUser() {
        assertThat(User.Role.ADMIN).isNotEqualTo(User.Role.USER);
    }

    @Test
    void userRole_canBeChanged() {
        User u = new User();
        u.setRole(User.Role.USER);
        u.setRole(User.Role.ADMIN);

        assertThat(u.getRole()).isEqualTo(User.Role.ADMIN);
    }

    @Test
    void userEmail_canBeUpdated() {
        User u = new User();
        u.setEmail("old@example.com");
        u.setEmail("new@example.com");

        assertThat(u.getEmail()).isEqualTo("new@example.com");
    }

    @Test
    void userPassword_canBeUpdated() {
        User u = new User();
        u.setPasswordHash("oldHash");
        u.setPasswordHash("newHash");

        assertThat(u.getPasswordHash()).isEqualTo("newHash");
    }
}
